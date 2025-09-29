import express from "express";
import https from "https";
import http from "http";
import fs from "fs";
import sqlite3 from "sqlite3";
import pLimit from "p-limit";

import { scrape, searchSeller } from "./client/src/scraper.js";
import { fuzzy } from "./client/src/search.js";
import { resolve } from "path";

// 👉 for price refresh by stored link
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// 👉 allow your Vite frontend / other tools to call these endpoints
import cors from "cors";

// https shit im too lazy to actually use this yet
var options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.cert"),
};

// set up express sir
var app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // allow JSON requests too
app.use(cors({ origin: "*" })); // loosen if you want to lock to your domain

// set up sqlite sir
const db = new sqlite3.Database("./client/src/db/data.sqlite");

// shorthand for reading files because im autistic and like little ravioli functions
const file = (filename, encoding) => {
  return fs.readFileSync(filename, { encoding: encoding });
};

// useful shorthand for doing sql queries
const query = (type, queryName, args, callback) => {
  return new Promise((res, rej) => {
    if (type === "run") {
      db.run(
        file(`./client/src/db/queries/${queryName}.sql`, "utf8"),
        args,
        function (err) {
          if (err) return rej(err);
          callback?.(this);
          res(this);
        }
      );
    } else if (type === "get") {
      db.get(
        file(`./client/src/db/queries/${queryName}.sql`, "utf8"),
        args,
        (err, row) => {
          if (err) return rej(err);
          callback?.(row);
          res(row);
        }
      );
    } else if (type === "all") {
      db.all(
        file(`./client/src/db/queries/${queryName}.sql`, "utf8"),
        args,
        (err, rows) => {
          if (err) return rej(err);
          callback?.(rows);
          res(rows);
        }
      );
    } else if (type === "each") {
      db.each(
        file(`./client/src/db/queries/${queryName}.sql`, "utf8"),
        args,
        (err, rows) => {
          if (err) return rej(err);
          callback?.(rows);
          res(rows);
        }
      );
    }
  });
};

// -------- db stuff
let remainingCount = 0;

// initialize once when server starts
const initRemainingCount = async () => {
  // this returns ALL unchecked rows; we just take .length for the counter
  const unchecked = await query("all", "select/count_unsorted", []);
  remainingCount = unchecked.length;
  console.log(`📊 Starting unchecked prices: ${remainingCount}`);
};
initRemainingCount();

const setupDB = async () => {
  console.log("⚙️  Setting up database... please wait.");

  //await clearDB();
  await query("run", "create/products");
  await query("run", "create/prices");
  await query("run", "create/sellers");

  const sellersString = fs.readFileSync("./client/src/db/json/sellers.json");
  const sellers = JSON.parse(sellersString);
  console.log(`📦 Importing ${sellers.length} sellers...`);
  for (const seller of sellers) {
    await query("run", "insert/seller", [
      seller.name,
      seller.base_url,
      seller.search_url,
      seller.product_selector,
      seller.name_selector,
      seller.link_selector,
      seller.price_selector,
      seller.sale_selector,
      seller.image_selector,
    ]);
  }

  const productsString = fs.readFileSync("./client/src/db/json/products.json");
  const products = JSON.parse(productsString);
  console.log(`📦 Importing ${products.length} products...`);
  for (const product of products) {
    await query("run", "insert/product", [product.name, product.search_term]);
  }

  const pricePromises = [];
  for (let seller_i = 1; seller_i <= sellers.length; seller_i++) {
    for (let product_i = 1; product_i <= products.length; product_i++) {
      pricePromises.push(query("run", "insert/price", [seller_i, product_i]));
    }
  }

  await Promise.all(pricePromises);
  console.log("✅ Database setup complete!");
};

const clearDB = async () => {
  await query("run", "delete/products");
  await query("run", "delete/prices");
  await query("run", "delete/sellers");
};


// Simple form page (prefilled if /product passes query params)
app.get("/report-by-link", (req, res) => {
  const link = String(req.query.link || "");
  const productName = String(req.query.productName || "");
  const sellerName = String(req.query.sellerName || "");

  const html = `
    <div style="max-width:640px;margin:24px auto;font-family:system-ui,Segoe UI,Arial">
      <a href="/"><button>⬅ Home</button></a>
      <h2>Report wrong price/link</h2>
      <form method="POST" action="/report-wrong-by-link" style="display:flex; flex-direction:column; gap:8px; max-width:520px;">
        <label>Item Link
          <input name="link" value="${link}" placeholder="https://store.example.com/item/123" required />
        </label>
        <label>Reason (optional)
          <textarea name="reason" rows="4" placeholder="What’s wrong? e.g., wrong kit, OOS page, etc."></textarea>
        </label>
        <div style="font-size:14px;color:#666;">
          ${sellerName ? `Seller: ${sellerName}` : ""} ${productName ? ` — Product: ${productName}` : ""}
        </div>
        <button type="submit" style="width:220px; padding:10px; background:#e74c3c; color:#fff; border:none; border-radius:8px;">
          Invalidate by Link
        </button>
      </form>
    </div>
  `;
  res.send(html);
});

// POST: invalidate any rows that match this link (validated = 0)
app.post("/report-wrong-by-link", async (req, res) => {
  const link = (req.body?.link ?? req.query?.link ?? "").toString().trim();
  const reason = (req.body?.reason ?? req.query?.reason ?? "").toString().trim();
  if (!link) return res.status(400).send("link is required");

  try {
    // optional logging (safe to attempt)
    try {
      await query("run", "create/bug_reports");
      await query("run", "insert/bug_report_minimal", [link, reason || null]);
    } catch {}

    // invalidate all rows for this link
    await query("run", "update/unvalidate_by_link", [link]);

    // refresh counter used on homepage/admin
    const unchecked = await query("all", "select/count_unsorted", []);
    remainingCount = unchecked.length;

    res.send(`
      <div style="max-width:640px;margin:24px auto;font-family:system-ui,Segoe UI,Arial">
        <p>Thanks! We invalidated any row with this link (it won't show in Tinder again):</p>
        <p style="word-break:break-all;"><code>${link}</code></p>
        <div style="display:flex; gap:8px;">
          <a href="/"><button>Home</button></a>
          <a href="/admin"><button>Admin Panel</button></a>
        </div>
      </div>
    `);
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to invalidate by link.");
  }
});

// ---------------------------
// BASIC HTML FOR DEBUGGING
// ---------------------------
const homeButton = `
<div>
  <form action="/" method="GET">
    <button type="submit">Home</button>
  </form>
</div>
`;

const searchBar = `
<div>
  <form action="/search" method="GET">
    <input type="text" name="q" />
    <button type="submit">Search</button>
  </form>
</div>
`;

const debugDB = `
<div>
  <form action="/db" method="POST">
    <input type="text" name="query" />
    <button type="submit" name="action" value="run">Run</button>
    <button type="submit" name="action" value="log">Log</button>
    <button type="submit" name="action" value="log_all">Log all</button>
    <button type="submit" name="action" value="clear">Clear</button>
    <button type="submit" name="action" value="setup">Set up</button>
    <button type="submit" name="action" value="update">Update</button>
    
  </form>
        <form action="/export" method="GET">
    <button type="submit">Export DB to Data</button>
  </form>
</div>
`;

// ---------------------------
// FRONTEND PUBLIC API
// ---------------------------
app.get("/api/products", async (req, res) => {
  const products = await query("all", "select/all_products", []);
  res.json(products);
});

app.get("/api/products/:id", async (req, res) => {
  const product = await query("get", "select/product_id", [req.params.id]);
  if (!product) return res.status(404).json({ error: "Not found" });
  const prices = await query("all", "select/display_prices", [product.id]);
  res.json({ ...product, prices });
});

app.get("/api/sellers", async (req, res) => {
  const sellers = await query("all", "select/all_sellers", []);
  res.json(sellers);
});

// ---------------------------
// EXPORT TO TYPESCRIPT
// ---------------------------
app.get("/export", async (req, res) => {
  try {
    const products = await query("all", "select/all_products");

    const exportProducts = [];
    for (const product of products) {
      const prices = await query("all", "select/display_prices", [product.id]);

      exportProducts.push({
        id: product.id.toString(),
        name: product.name,
        game: "",
        faction: "",
        category: "",
        points: 0,
        image: "",
        retailers: prices.map((p) => ({
          store: p.seller_name,
          price: Number(p.price),
          inStock: false,
          url: p.link,
        })),
      });
    }

    const toTsLiteral = (obj) =>
      JSON.stringify(obj, null, 2).replace(/"([^"]+)":/g, "$1:");

    const content = `// Auto-generated file from /export

export interface Product {
  id: string;
  name: string;
  game: string;
  faction: string;
  category: string;
  points: number;
  image: string;
  retailers: {
    store: string;
    price: number;
    inStock: boolean;
    url: string;
  }[];
}

export const gameCategories = {
  warhammer40k: [
    'Characters',
    'Battleline',
    'Dedicated Transports',
    'Other',
    'Fortifications'
  ],
  ageofsigmar: [
    'Cavalry Heroes',
    'Infantry Heroes',
    'Monster Heroes',
    'Cavalry',
    'Infantry',
    'Monster',
    'War machine',
    'Regiment of Renown',
    'Faction terrain',
    'Endless spell'
  ]
};

export const Products: Product[] = ${toTsLiteral(exportProducts)};
`;

    fs.writeFileSync("./client/src/data/Data.ts", content);

    res.json({
      status: "ok",
      message: "Exported into client/src/data/Data.ts",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ---------------------------
// PUBLIC WEB PAGES (debug/demo)
// ---------------------------
app.get("/", (req, res) => {
  res.send(
    `<div style="max-width:900px;margin:24px auto;font-family:system-ui,Segoe UI,Arial">
      <h1 style="margin:0 0 12px 0;">Pricehammer — Debug</h1>
      <div style="margin-bottom:16px;color:#555;">Remaining unchecked prices: <b>${remainingCount}</b></div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px;">
        <a href="/tinder"><button>Tinder</button></a>
        <a href="/admin"><button>Admin Panel</button></a>
        <a href="/export"><button>Export to Data.ts</button></a>
      </div>
      ${debugDB}
      ${searchBar}
    </div>`
  );
});

app.get("/search", (req, res) => {
  query("all", "select/all_products", [], (products) => {
    var text =
      `<div style="max-width:900px;margin:24px auto;font-family:system-ui,Segoe UI,Arial">` +
      `<div>Search query: \'${req.query.q}\'`;
    const results = fuzzy(
      req.query.q.trim(),
      products,
      0.25,
      (product) => product.name
    );
    if (results?.length > 0) {
      results.sort((a, b) => a.score - b.score);
      results.forEach((result) => {
        text +=
          `<div><a href=\'/product?q=${result.result.id}\'>` +
          result.result.name +
          "</a></div>";
      });
    } else {
      text += "<div>No results</div>";
    }
    text += "</div></div>";
    res.send(text);
  });
});

app.get("/product", (req, res) => {
  query("get", "select/product_id", [req.query?.q], (product) =>
    query("all", "select/display_prices", [product?.id], (prices) => {
      let html =
        `<div style="max-width:900px;margin:24px auto;font-family:system-ui,Segoe UI,Arial">` +
        `<h2 style="margin-top:0;">Product: '${product.name}'</h2>`;

      prices?.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      prices?.forEach((price) => {
        const link = price.link || "";
        const reportHref = `/report-by-link?` +
          `link=${encodeURIComponent(link)}` +
          `&productName=${encodeURIComponent(product.name)}` +
          `&sellerName=${encodeURIComponent(price.seller_name)}`;

        html += `
          <div style="margin:6px 0;">
            <a href="${link}" target="_blank" rel="noopener">
              ${price.seller_name} — price: ${price.price ?? "—"}
            </a>
            <a href="${reportHref}" style="margin-left:12px;color:#e74c3c;">Report wrong</a>
          </div>`;
      });

      html += `<div style="margin-top:16px;"><a href="/admin"><button>Admin Panel</button></a></div>`;
      html += "</div>";
      res.send(html);
    })
  );
});


// ---------------------------
// PRIVATE ADMIN (tinder tool)
// ---------------------------
let lastAction = null;

// validate
app.get("/validate", async (req, res) => {
  await query("run", "update/validate_price", [
    req.query.link.trim(),
    req.query.price.trim(),
    req.query.s.trim(),
    req.query.p.trim(),
  ]);
  lastAction = { seller: req.query.s.trim(), product: req.query.p.trim() };
  if (remainingCount > 0) remainingCount--; // decrement after success
  res.redirect("/tinder");
});

// invalidate
app.get("/invalidate", async (req, res) => {
  await query("run", "update/invalidate_price", [req.query.s, req.query.p]);
  lastAction = { seller: req.query.s.trim(), product: req.query.p.trim() };
  if (remainingCount > 0) remainingCount--; // decrement after success
  res.redirect("/tinder");
});

// undo (reset validated back to NULL)
app.get("/undo", async (req, res) => {
  if (!lastAction) {
    return res.send("<h2>No action to undo!</h2>" + homeButton);
  }

  await query("run", "update/unvalidate_price", [
    lastAction.seller,
    lastAction.product,
  ]);

  console.log(
    `↩️ Undid last action for seller=${lastAction.seller}, product=${lastAction.product}`
  );
  remainingCount++; // put it back in the pool
  lastAction = null;
  res.redirect("/tinder");
});

async function invalidatePairAndCount(sellerId, productId) {
  await query("run", "update/invalidate_price", [sellerId, productId]);
  // refresh the in-memory counter so the number on pages is correct
  const unchecked = await query("all", "select/count_unsorted", []);
  remainingCount = unchecked.length;
}



// tinder manual verification
app.get("/tinder", async (req, res) => {
  // grab one NULL row
  const price = await query("get", "select/unchecked_prices");
  if (!price) {
    return res.send("<h2>No unchecked prices left!</h2>" + homeButton);
  }

  const seller  = await query("get", "select/seller_id", [price.seller_id]);
  const product = await query("get", "select/product_id", [price.product_id]);

  // search candidates
  const candidates = await searchSeller(seller, product);

  // filter to “usable” (has a link)
  const usable = (candidates || []).filter(c => !!c.link);

  // 🔥 If no candidates (or none usable), auto-invalidate this pair and move on
  if (!usable.length) {
    await invalidatePairAndCount(seller.id, product.id);
    return res.redirect("/tinder");
  }

  // buffers → base64 strings (null-safe)
  const imgStringProducts = usable.map((c) => ({
    link: c.link || "",
    price: c.price ?? "",
    img: c.img ? c.img.toString("base64") : "",
  }));

  const validateLink   = `/validate?s=${seller.id}&p=${product.id}`;
  const invalidateLink = `/invalidate?s=${seller.id}&p=${product.id}`;
  const firstLink      = imgStringProducts[0]?.link || "#";

  const html = `
    <div style="max-width:900px;margin:24px auto;font-family:system-ui,Segoe UI,Arial">
      <div style="font-size: 48px; margin-bottom: 12px;">Is this ${product.name}?</div>
      <div style="font-size: 20px; margin-bottom: 16px; text-align:center;">
        Remaining unchecked prices: ${remainingCount}
      </div>

      <div style="text-align: center; margin-bottom: 10px;">
        <a id="productLink" href="${firstLink}" target="_blank"
          style="font-size: 20px; color: #3498db; text-decoration: underline;">${firstLink}</a>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; gap:20px; margin-bottom:20px;">
        <button class="yuckBtn" onclick="yuck()">❌ Yuck</button>
        <img id="productImage" />
        <button class="yumBtn" onclick="yum()">✅ Yum</button>
      </div>

      <div style="display:flex; justify-content:center; gap:12px; margin-bottom:20px;">
        <button class="backBtn" onclick="window.location.href='/undo'">⬅ Undo Last</button>
      </div>

      <style>
        button { font-size:22px; font-weight:bold; padding:12px 24px; border-radius:10px; border:none; cursor:pointer; transition:all .2s; }
        .yuckBtn { background:#e74c3c; color:#fff; } .yuckBtn:hover{ background:#c0392b; }
        .yumBtn  { background:#2ecc71; color:#fff; } .yumBtn:hover { background:#27ae60; }
        .backBtn { background:#f1c40f; color:#000; } .backBtn:hover{ background:#d4ac0d; }
        #productImage { display:block; width:100%; height:auto; max-width:70vw; max-height:80vh; object-fit:contain; border:2px solid #ddd; border-radius:12px; margin:0 auto; }
      </style>

      <script>
        const products = ${JSON.stringify(imgStringProducts).replace(/</g, "\\u003c")};
        let idx = 0;

        function render() {
          if (!products[idx]) {
            // 🔥 no more candidates: invalidate this pair and move on
            window.location.href = "${invalidateLink}";
            return;
          }
          const cand = products[idx];

          const imgEl = document.getElementById("productImage");
          if (cand.img) imgEl.src = "data:image/jpeg;base64," + cand.img;
          else imgEl.removeAttribute("src");

          const a = document.getElementById("productLink");
          a.href = cand.link || "#";
          a.textContent = cand.link || "#";
        }

        function yuck() { idx++; render(); }
        function yum() {
          const cand = products[idx] || { link: "", price: "" };
          const href = "${validateLink}" +
            "&link=" + encodeURIComponent(cand.link || "") +
            "&price=" + encodeURIComponent(String(cand.price || ""));
          window.location.href = href;
        }

        render();
      </script>
    </div>
  `;
  res.send(html);
});


// ---------------------------
// SEEDING + PRICE REFRESH ROUTES
// ---------------------------

// Recompute remaining count (handy after seeding)
async function recomputeRemaining() {
  const unchecked = await query("all", "select/count_unsorted", []);
  remainingCount = unchecked.length;
}

// Seed price rows for a NEW seller across ALL products
// Use: POST /seed/new-seller?seller=<sellerId>
app.post("/seed/new-seller", async (req, res) => {
  const sellerId = (req.query.seller || "").trim();
  if (!sellerId) return res.status(400).json({ ok: false, error: "seller param required" });

  await query("run", "insert/seed_prices_for_new_seller", [sellerId]);
  await recomputeRemaining();
  res.json({ ok: true, remainingCount });
});

// Seed price rows for a NEW product across ALL sellers
// Use: POST /seed/new-product?product=<productId>
app.post("/seed/new-product", async (req, res) => {
  const productId = (req.query.product || "").trim();
  if (!productId) return res.status(400).json({ ok: false, error: "product param required" });

  await query("run", "insert/seed_prices_for_new_product", [productId]);
  await recomputeRemaining();
  res.json({ ok: true, remainingCount });
});

// --- import (upsert) from sellers.json and seed ONLY new sellers ---
app.post("/admin/import-sellers-from-json", async (req, res) => {
  try {
    const raw = fs.readFileSync("./client/src/db/json/sellers.json", "utf8");
    const sellers = JSON.parse(raw);

    const existing = await query("all", "select/all_sellers", []);
    const existingKey = new Set(existing.map(s => `${s.name}|||${s.base_url}`));

    let inserted = 0;
    for (const s of sellers) {
      const key = `${s.name}|||${s.base_url}`;
      if (existingKey.has(key)) continue;

      await query("run", "insert/seller", [
        s.name, s.base_url, s.search_url, s.product_selector,
        s.name_selector, s.link_selector, s.price_selector, s.sale_selector, s.image_selector,
      ]);

      const newSellerRow = await query("get", "select/seller_by_name_base", [s.name, s.base_url]);
      const newSellerId = newSellerRow?.id;

      if (newSellerId) {
        await query("run", "insert/seed_prices_for_new_seller", [newSellerId]);
        inserted++;
        console.log(`Seeded prices for NEW seller ${s.name} (id=${newSellerId})`);
      }
    }

    const unchecked = await query("all", "select/unchecked_prices", []);
    remainingCount = unchecked.length;

    res.json({ ok: true, sellersProcessed: sellers.length, newSellersInsertedAndSeeded: inserted, remainingCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- import (upsert) from products.json and seed ONLY new products ---
app.post("/admin/import-products-from-json", async (req, res) => {
  try {
    const raw = fs.readFileSync("./client/src/db/json/products.json", "utf8");
    const products = JSON.parse(raw);

    const existing = await query("all", "select/all_products", []);
    const existingKey = new Set(existing.map(p => `${p.name}|||${p.search_term}`));

    let inserted = 0;
    for (const p of products) {
      const key = `${p.name}|||${p.search_term}`;
      if (existingKey.has(key)) continue;

      await query("run", "insert/product", [p.name, p.search_term]);

      const newProdRow = await query("get", "select/product_by_name_term", [p.name, p.search_term]);
      const newProductId = newProdRow?.id;

      if (newProductId) {
        await query("run", "insert/seed_prices_for_new_product", [newProductId]);
        inserted++;
        console.log(`Seeded prices for NEW product ${p.name} (id=${newProductId})`);
      }
    }

    const unchecked = await query("all", "select/unchecked_prices", []);
    remainingCount = unchecked.length;

    res.json({ ok: true, productsProcessed: products.length, newProductsInsertedAndSeeded: inserted, remainingCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});


// ---- price refresh via stored links (validated rows only) ----

// tiny helper: get price number from page using seller selectors
async function fetchPriceFromLinkWithSellerSelectors(seller, link) {
  try {
    puppeteer.use(StealthPlugin());
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );

    await page.goto(link, { waitUntil: "domcontentloaded", timeout: 30000 });

    // prefer sale price, then regular
    const price = await page.evaluate(({ priceSel, saleSel }) => {
      const pick = (txt) => {
        if (!txt) return null;
        const m = txt.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
        return m ? parseFloat(m[0]) : null;
      };
      const sale = saleSel ? document.querySelector(saleSel)?.textContent : "";
      const reg  = priceSel ? document.querySelector(priceSel)?.textContent : "";
      const item = document.querySelector("[itemprop='price']")?.getAttribute?.("content")
                || document.querySelector("[itemprop='price']")?.textContent
                || "";
      return pick(sale) ?? pick(reg) ?? pick(item) ?? null;
    }, { priceSel: seller.price_selector, saleSel: seller.sale_selector });

    await page.close();
    await browser.close();
    return price;
  } catch (e) {
    console.error("fetchPriceFromLink error:", e?.message || e);
    return null;
  }
}

// Refresh prices for validated rows using stored links.
// Use: POST /refresh-prices            (all sellers)
//   or: POST /refresh-prices?seller=ID (one seller)
app.post("/refresh-prices", async (req, res) => {
  const oneSellerId = (req.query.seller || "").trim();

  const sellers = oneSellerId
    ? [await query("get", "select/seller_id", [oneSellerId])]
    : await query("all", "select/all_sellers", []);

  const pairs = oneSellerId
    ? await query("all", "select/validated_pairs_by_seller", [oneSellerId])
    : await query("all", "select/validated_pairs", []);

  const limit = pLimit(4);
  let updated = 0;

  const sellerById = {};
  sellers?.forEach((s) => { if (s) sellerById[s.id] = s; });

  await Promise.all(
    (pairs || []).map(({ seller_id, product_id, link }) =>
      limit(async () => {
        if (!link) return;
        const seller = sellerById[seller_id] || (await query("get", "select/seller_id", [seller_id]));
        if (!seller) return;

        const price = await fetchPriceFromLinkWithSellerSelectors(seller, link);
        if (price == null) return;

        try {
          await query("run", "insert/price_history", [seller_id, product_id, price, link]);
        } catch { /* history table may not exist; ignore */ }

        await query("run", "update/price_only_validated", [
          price, link, seller_id, product_id,
        ]);
        updated++;
      })
    )
  );

  res.json({ ok: true, updated, total: pairs?.length || 0 });
});


// ---------------------------
// NEW: AUTO-VALIDATE & REPORT-WRONG (API)
// ---------------------------

// Auto-validate the FIRST candidate for each unchecked pair.
// Usage:
//   POST /auto-validate
//   POST /auto-validate?seller=123
//   POST /auto-validate?product=456
app.post("/auto-validate", async (req, res) => {
  // read from body (form POST) first, then query as fallback
  const sellerFilterRaw  = (req.body?.seller  ?? req.query?.seller  ?? "").toString().trim();
  const productFilterRaw = (req.body?.product ?? req.query?.product ?? "").toString().trim();

  // optional: normalize to integers if you like
  const sellerFilter  = sellerFilterRaw && !Number.isNaN(Number(sellerFilterRaw)) ? Number(sellerFilterRaw) : null;
  const productFilter = productFilterRaw && !Number.isNaN(Number(productFilterRaw)) ? Number(productFilterRaw) : null;

  let uncheckedSql = `
    SELECT pr.seller_id, pr.product_id
    FROM prices pr
    WHERE pr.validated IS NULL
  `;
  const args = [];
  if (sellerFilter !== null) { uncheckedSql += " AND pr.seller_id = ?"; args.push(sellerFilter); }
  if (productFilter !== null) { uncheckedSql += " AND pr.product_id = ?"; args.push(productFilter); }

  // If you intended "exactly this one pair" when both are provided, this already enforces that.
  // You can also add LIMIT 1 if you only want one row even if duplicates exist.

  const uncheckedPairs = await new Promise((resolve, reject) => {
    db.all(uncheckedSql, args, (err, rows) => err ? reject(err) : resolve(rows || []));
  });

  if (!uncheckedPairs.length) {
    return res.json({ ok: true, processed: 0, validated: 0, skipped: 0, remainingCount });
  }

  const [sellers, products] = await Promise.all([
    query("all", "select/all_sellers", []),
    query("all", "select/all_products", []),
  ]);
  const sellersById = Object.fromEntries(sellers.map(s => [s.id, s]));
  const productsById = Object.fromEntries(products.map(p => [p.id, p]));

  const limit = pLimit(4);
  let validated = 0, skipped = 0;

  await Promise.all(uncheckedPairs.map(({ seller_id, product_id }) => limit(async () => {
    const seller = sellersById[seller_id];
    const product = productsById[product_id];
    if (!seller || !product) { skipped++; return; }

    try {
      const candidates = await searchSeller(seller, product);
      const first = candidates?.[0];
      if (!first || !first.link) { skipped++; return; }

      await query("run", "update/auto_validate_price", [
        first.price ?? null,
        first.link,
        seller_id,
        product_id,
      ]);

      validated++;
    } catch (e) {
      console.error("auto-validate error:", e?.message || e);
      skipped++;
    }
  })));

  await (async () => {
    const unchecked = await query("all", "select/count_unsorted", []);
    remainingCount = unchecked.length;
  })();

  res.json({
    ok: true,
    processed: uncheckedPairs.length,
    validated,
    skipped,
    remainingCount
  });
});


// --- Report wrong by LINK (no IDs needed) ---

// Simple form page (optional; handy from /product or /admin)
app.get("/report-by-link", (req, res) => {
  const link = (req.query.link || "").toString();
  const productName = (req.query.productName || "").toString();
  const sellerName = (req.query.sellerName || "").toString();

  const html = `
    <div style="max-width:640px;margin:24px auto;font-family:system-ui,Segoe UI,Arial">
      <a href="/admin"><button>⬅ Back to Admin</button></a>
      <h2>Report wrong by link</h2>
      <form method="POST" action="/report-wrong-by-link" style="display:flex; flex-direction:column; gap:8px; max-width:520px;">
        <label>Item Link (paste the retailer URL)
          <input name="link" value="${link}" placeholder="https://store.example.com/item/123" required />
        </label>
        <label>Reason (optional)
          <textarea name="reason" rows="4" placeholder="What’s wrong? e.g., wrong kit, OOS page, etc."></textarea>
        </label>
        <div style="font-size:14px;color:#666;">
          ${sellerName ? `Seller: ${sellerName}` : ""} ${productName ? ` — Product: ${productName}` : ""}
        </div>
        <button type="submit" style="width:200px; padding:10px; background:#e74c3c; color:#fff; border:none; border-radius:8px;">
          Unvalidate by Link
        </button>
      </form>
    </div>
  `;
  res.send(html);
});

// POST endpoint that unvalidates by link
app.post("/report-wrong-by-link", async (req, res) => {
  const link = (req.body?.link ?? req.query?.link ?? "").toString().trim();
  const reason = (req.body?.reason ?? req.query?.reason ?? "").toString().trim();
  if (!link) return res.status(400).send("link is required");

  try {
    // optional logging table (safe to attempt; ignore errors if not present)
    try {
      await query("run", "create/bug_reports");
      await query("run", "insert/bug_report_minimal", [link, reason || null]);
    } catch {}

    // unvalidate every row that matches this link
    await query("run", "update/unvalidate_by_link", [link]);

    // refresh the counter
    const unchecked = await query("all", "select/count_unsorted", []);
    remainingCount = unchecked.length;

    res.send(`
      <div style="max-width:640px;margin:24px auto;font-family:system-ui,Segoe UI,Arial">
        <p>Reported. Any row with this link is now back in the Tinder queue:</p>
        <p style="word-break:break-all;"><code>${link}</code></p>
        <div style="display:flex; gap:8px;">
          <a href="/tinder"><button>Go to Tinder</button></a>
          <a href="/admin"><button>Back to Admin</button></a>
        </div>
      </div>
    `);
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to report by link.");
  }
});


// Simple “Report wrong” form (frontend-friendly too)
app.get("/report", (req, res) => {
  const s = (req.query.s || "").trim();
  const p = (req.query.p || "").trim();
  const productName = req.query.productName ? String(req.query.productName) : "";
  const sellerName  = req.query.sellerName ? String(req.query.sellerName) : "";

  const html = `
    <div style="max-width:640px;margin:24px auto;font-family:system-ui,Segoe UI,Arial">
      <a href="/admin"><button>⬅ Back to Admin</button></a>
      <h2>Report wrong pairing</h2>
      <form method="POST" action="/report-wrong" style="display:flex; flex-direction:column; gap:8px; max-width:520px;">
        <label>Seller ID <input name="seller" value="${s}" placeholder="seller_id" required/></label>
        <label>Product ID <input name="product" value="${p}" placeholder="product_id" required/></label>
        <label>Reason (optional) <textarea name="reason" rows="4" placeholder="What’s wrong? e.g., wrong kit, OOS page, etc."></textarea></label>
        <div style="font-size:14px;color:#666;">${sellerName || ""} ${productName ? "— " + productName : ""}</div>
        <button type="submit" style="width:160px; padding:10px; background:#e74c3c; color:#fff; border:none; border-radius:8px;">Send report</button>
      </form>
    </div>
  `;
  res.send(html);
});

// Report wrong: records the report and unvalidates the pair.
app.post("/report-wrong", async (req, res) => {
  const s = (req.body.seller || req.query.seller || "").trim();
  const p = (req.body.product || req.query.product || "").trim();
  const reason = (req.body.reason || req.query.reason || "").trim();
  if (!s || !p) return res.status(400).send("seller and product are required");

  try {
    // optional logging table (safe to attempt)
    try {
      await query("run", "create/bug_reports");
      await query("run", "insert/bug_report", [s, p, reason || null]);
    } catch { /* ignore if missing */ }

    await query("run", "update/unvalidate_price", [s, p]);
    await recomputeRemaining();

    res.send(`<div style="max-width:640px;margin:24px auto;font-family:system-ui,Segoe UI,Arial">
      <p>Reported. The pair (${s}, ${p}) is back in the Tinder queue.</p>
      <div style="display:flex; gap:8px;">
        <a href="/tinder"><button>Go to Tinder</button></a>
        <a href="/admin"><button>Back to Admin</button></a>
      </div>
    </div>`);
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to report.");
  }
});

// ---------------------------
// ADMIN PANEL (buttons/forms)
// ---------------------------
app.get("/admin", async (req, res) => {
  const unchecked = await query("all", "select/count_unsorted", []);
  const count = unchecked.length;

  const html = `
  <div style="max-width:900px;margin:24px auto;font-family:system-ui,Segoe UI,Arial">
    <h1 style="margin:0 0 12px 0;">Admin Panel</h1>
    <div style="margin-bottom:16px;color:#555;">Remaining unchecked prices: <b>${count}</b></div>

    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px;">
      <a href="/"><button>Home</button></a>
      <a href="/tinder"><button>Tinder</button></a>
      <a href="/export"><button>Export Data.ts</button></a>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px,1fr)); gap:16px;">
      <!-- Auto-Validate -->
      <div style="border:1px solid #ddd; border-radius:10px; padding:12px;">
        <h3 style="margin:0 0 8px 0;">Auto-Validate (first hit)</h3>
        <form method="POST" action="/auto-validate" style="display:flex; flex-direction:column; gap:8px;">
          <input name="seller" placeholder="Seller ID (optional)" />
          <input name="product" placeholder="Product ID (optional)" />
          <button type="submit" style="background:#2ecc71;color:#fff;border:none;border-radius:8px;padding:8px 12px;">Run Auto-Validate</button>
        </form>
      </div>

      <!-- Refresh Prices -->
      <div style="border:1px solid #ddd; border-radius:10px; padding:12px;">
        <h3 style="margin:0 0 8px 0;">Refresh Prices (validated only)</h3>
        <form method="POST" action="/refresh-prices" style="display:flex; flex-direction:column; gap:8px;">
          <input name="seller" placeholder="Seller ID (optional)" />
          <button type="submit" style="background:#3498db;color:#fff;border:none;border-radius:8px;padding:8px 12px;">Refresh</button>
        </form>
      </div>

      <!-- Seed New Seller -->
      <div style="border:1px solid #ddd; border-radius:10px; padding:12px;">
        <h3 style="margin:0 0 8px 0;">Seed Rows for New Seller</h3>
        <form method="POST" action="/seed/new-seller" style="display:flex; flex-direction:column; gap:8px;">
          <input name="seller" placeholder="Seller ID" required />
          <button type="submit" style="background:#8e44ad;color:#fff;border:none;border-radius:8px;padding:8px 12px;">Seed Seller Rows</button>
        </form>
      </div>

      <!-- Seed New Product -->
      <div style="border:1px solid #ddd; border-radius:10px; padding:12px;">
        <h3 style="margin:0 0 8px 0;">Seed Rows for New Product</h3>
        <form method="POST" action="/seed/new-product" style="display:flex; flex-direction:column; gap:8px;">
          <input name="product" placeholder="Product ID" required />
          <button type="submit" style="background:#8e44ad;color:#fff;border:none;border-radius:8px;padding:8px 12px;">Seed Product Rows</button>
        </form>
      </div>

      <!-- Import Sellers -->
      <div style="border:1px solid #ddd; border-radius:10px; padding:12px;">
        <h3 style="margin:0 0 8px 0;">Import Sellers (JSON)</h3>
        <form method="POST" action="/admin/import-sellers-from-json">
          <button type="submit" style="background:#16a085;color:#fff;border:none;border-radius:8px;padding:8px 12px;">Import & Seed New Sellers</button>
        </form>
      </div>

      <!-- Import Products -->
      <div style="border:1px solid #ddd; border-radius:10px; padding:12px;">
        <h3 style="margin:0 0 8px 0;">Import Products (JSON)</h3>
        <form method="POST" action="/admin/import-products-from-json">
          <button type="submit" style="background:#16a085;color:#fff;border:none;border-radius:8px;padding:8px 12px;">Import & Seed New Products</button>
        </form>
      </div>

      <!-- Report Wrong -->
      <div style="border:1px solid #ddd; border-radius:10px; padding:12px;">
        <h3 style="margin:0 0 8px 0;">Report Wrong Pair</h3>
        <form method="POST" action="/report-wrong" style="display:flex; flex-direction:column; gap:8px;">
          <input name="seller" placeholder="Seller ID" required />
          <input name="product" placeholder="Product ID" required />
          <textarea name="reason" rows="3" placeholder="Reason (optional)"></textarea>
          <button type="submit" style="background:#e74c3c;color:#fff;border:none;border-radius:8px;padding:8px 12px;">Submit Report</button>
        </form>
      </div>
    </div>
  </div>
  `;
  res.send(html);
});

// ---------------------------
// DEBUG DB
// ---------------------------
app.post("/db", (req, res) => {
  const action = req.body?.action;
  const queryStr = req.body?.query;
  console.log(`Received ${action} command`);
  if (action === "update") {
    updateDB().then(() => res.redirect("/"));
  } else if (action === "clear") {
    clearDB().then(() => res.redirect("/"));
  } else if (action === "setup") {
    setupDB().then(() => res.redirect("/"));
  } else if (action === "run") {
    db.run(queryStr, (err) => {
      if (err) console.log(`Error: ${err}`);
      res.redirect("/");
    });
  } else if (action === "log") {
    db.get(queryStr, (err, row) => {
      console.log(row);
      if (err) console.log(`Error: ${err}`);
      res.redirect("/");
    });
  } else if (action === "log_all") {
    db.all(queryStr, (err, rows) => {
      console.log(rows);
      if (err) console.log(`Error: ${err}`);
      res.redirect("/");
    });
  } else res.json({ success: false, message: "undefined command" });
});

// ---------------------------
// START SERVERS
// ---------------------------
http.createServer(app).listen(80);
//https.createServer(options, app).listen(443);
