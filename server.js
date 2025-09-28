import express from "express";
import https from "https";
import http from "http";
import fs from "fs";
import sqlite3 from "sqlite3";
import pLimit from "p-limit";

import { scrape, searchSeller } from "./client/src/scraper.js";
import { fuzzy } from "./client/src/search.js";
import { resolve } from "path";

// https shit im too lazy to actually use this yet
var options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.cert"),
};

// set up express sir
var app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // allow JSON requests too

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
  const unchecked = await query("all", "select/unchecked_prices", []);
  remainingCount = unchecked.length;
  console.log(`📊 Starting unchecked prices: ${remainingCount}`);
};
initRemainingCount();



const setupDB = async () => {
  console.log("⚙️  Setting up database... please wait.");

  await clearDB();
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
  res.send(debugDB + homeButton + searchBar);
});

app.get("/search", (req, res) => {
  query("all", "select/all_products", [], (products) => {
    var text =
      debugDB +
      homeButton +
      searchBar +
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
    text += "</div>";
    res.send(text);
  });
});

app.get("/product", (req, res) => {
  query("get", "select/product_id", [req.query?.q], (product) =>
    query("all", "select/display_prices", [product?.id], (prices) => {
      var text =
        debugDB + homeButton + searchBar + `<div>Product: \'${product.name}\'`;
      prices?.sort((a, b) => a.price - b.price);
      prices?.forEach((price) => {
        text +=
          `<div><a href=\'${price.link}\'>` +
          price.seller_name +
          " price: " +
          price.price +
          "</a></div>";
      });
      text += "</div>";
      res.send(text);
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
  if (remainingCount > 0) remainingCount--; // 🔥 decrement here
  res.redirect("/tinder");
});

// invalidate
app.get("/invalidate", async (req, res) => {
  await query("run", "update/invalidate_price", [req.query.s, req.query.p]);
  lastAction = { seller: req.query.s.trim(), product: req.query.p.trim() };
  if (remainingCount > 0) remainingCount--; // 🔥 decrement here
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

  console.log(`↩️ Undid last action for seller=${lastAction.seller}, product=${lastAction.product}`);
  lastAction = null;
  res.redirect("/tinder");
});

// tinder manual verification
app.get("/tinder", async (req, res) => {
  
  const price = await query("get", "select/unchecked_prices");
  if (!price) {
    return res.send("<h2>No unchecked prices left!</h2>" + homeButton);
  }
  const seller = await query("get", "select/seller_id", [price.seller_id]);
  const product = await query("get", "select/product_id", [price.product_id]);
  const products = await searchSeller(seller, product);

  const validateLink = `/validate?s=${seller.id}&p=${product.id}`;
  const invalidateLink = `/invalidate?s=${seller.id}&p=${product.id}`;

  if (!products || products?.length === 0) {
    res.redirect(invalidateLink);
  }

  const imgStringProducts = products.map((p) => ({
    ...p,
    img: p.img.toString("base64"),
  }));
  

  const text = `
    <div style="font-size: 48px; margin-bottom: 20px;">Is this ${product.name}?</div>
<div style="font-size: 20px; margin-bottom: 20px; text-align:center;">
    Remaining unchecked prices: ${remainingCount}
  </div>
    <div style="text-align: center; margin-bottom: 10px;">
      <a id="productLink" href="${products[0].link}" target="_blank" style="font-size: 20px; color: #3498db; text-decoration: underline;">
        ${products[0].link}
      </a>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 20px;">
      <button class="yuckBtn" onclick="yuck()">❌ Yuck</button>
      <img id="productImage">
      <button class="yumBtn" onclick="yum()">✅ Yum</button>
    </div>

    <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 20px;">
      <button class="backBtn" onclick="window.location.href='/undo'">⬅ Undo Last</button>
    </div>

    <style>
      button {
        font-size: 22px;
        font-weight: bold;
        padding: 12px 24px;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .yuckBtn {
        background-color: #e74c3c;
        color: white;
      }
      .yuckBtn:hover { background-color: #c0392b; }

      .yumBtn {
        background-color: #2ecc71;
        color: white;
      }
      .yumBtn:hover { background-color: #27ae60; }

      .backBtn {
        background-color: #f1c40f;
        color: black;
      }
      .backBtn:hover { background-color: #d4ac0d; }

      #productImage {
        display: block;
        width: 100%;
        height: auto;
        max-width: 70vw;
        max-height: 80vh;
        object-fit: contain;
        border: 2px solid #ddd;
        border-radius: 12px;
        margin: 0 auto;
      }
    </style>

    <script>
      let count = 0;
      const products = ${JSON.stringify(imgStringProducts)};

      function updateImage() {
        if (!products[count]) return;

        if (products[count].img) {
          const base64 = products[count].img;
          document.getElementById("productImage").src = \`data:image/jpeg;base64,\${base64}\`;
        }

        if (products[count].link) {
          const linkEl = document.getElementById("productLink");
          linkEl.href = products[count].link;
          linkEl.textContent = products[count].link;
        }
      }

      updateImage();

      function yuck() {
        window.location.href="${invalidateLink}";
      }

      function yum() {
        window.location.href=\`${validateLink}&link=\${encodeURIComponent(products[count].link)}&price=\${encodeURIComponent(products[count].price)}\`;
      }
    </script>`;
  res.send(homeButton + text);
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
