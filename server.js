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
// type is "run" for anything that doesnt require a response,
// "get" for single row responses, "all" for all. idk what each
// is for but i made that too in case we fucking need it idk
// all the queries we want to use should be stored in .sql files
// in the db/queries directory, and run using this shorthand
// for example, if i wanna do "SELECT * FROM products" i should make
// a db/queries/select/all_products.sql file and put that query in it
// and then run query("all", "select/all_products"). nice very nice
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

// initial manual data, eventually we should move this to a file but for now its jose mode bitch
const setupDB = async () => {
  await clearDB();
  await query("run", "create/products");
  await query("run", "create/prices");
  await query("run", "create/sellers");

  const sellersString = fs.readFileSync("./client/src/db/json/sellers.json");
  const sellers = JSON.parse(sellersString);
  console.log(sellers);
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
};

// delete everything but maintain the structure
const clearDB = async () => {
  await query("run", "delete/products");
  await query("run", "delete/prices");
  await query("run", "delete/sellers");
};


// --------- db 


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
    <button type="submit">Export DB to mockData</button>
  </form>
</div>
`;


// ---------------------------
// FRONTEND PUBLIC API
// ---------------------------

// Get all products
app.get("/api/products", async (req, res) => {
  const products = await query("all", "select/all_products", []);
  res.json(products);
});

// Get single product by id
app.get("/api/products/:id", async (req, res) => {
  const product = await query("get", "select/product_id", [req.params.id]);
  if (!product) return res.status(404).json({ error: "Not found" });
  const prices = await query("all", "select/display_prices", [product.id]);
  res.json({ ...product, prices });
});

// Get all sellers
app.get("/api/sellers", async (req, res) => {
  const sellers = await query("all", "select/all_sellers", []);
  res.json(sellers);
});


//EXPORT KENZIE STUFF

app.get("/export", async (req, res) => {
  try {
    const products = await query("all", "select/all_products");

    const exportProducts = [];
    for (const product of products) {
      // fetch only validated prices for this product
      const prices = await query("all", "select/display_prices", [product.id]);

      exportProducts.push({
        id: product.id.toString(),
        name: product.name,
        game: "",        // placeholder -> 'warhammer40k' | 'ageofsigmar'
        faction: "",     // placeholder
        category: "",    // placeholder
        points: 0,       // placeholder
        retailers: prices.map((p) => ({
          store: p.seller_name,
          price: Number(p.price), // ensure number
          inStock: false,         // placeholder
          url: p.link,
        })),
      });
    }

    // helper: JSON → TS literal (removes quotes from keys)
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

export const mockProducts: Product[] = ${toTsLiteral(exportProducts)};
`;

    fs.writeFileSync("./client/src/data/mockData.ts", content);

    res.json({
      status: "ok",
      message: "Exported into client/src/data/mockData.ts",
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

// validate
app.get("/validate", async (req, res) => {
  await query("run", "update/validate_price", [
    req.query.link.trim(),
    req.query.price.trim(),
    req.query.s.trim(),
    req.query.p.trim(),
  ]);
  res.redirect("/tinder");
});

// invalidate
app.get("/invalidate", async (req, res) => {
  await query("run", "update/invalidate_price", [req.query.s, req.query.p]);
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
    <div style="font-size: 48px;">Is this ${product.name}?</div>
    <div>
      <button onclick="openLink()">Link</button>
      <button onclick="yuck()">Yuck</button>
      <button onclick="yum()">Yum</button>
    </div>
    <img id="productImage">

    <style>
      #productImage {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    </style>

    <script>
      let count = 0;
      const products = ${JSON.stringify(imgStringProducts)};
      
      function updateImage() {
        if (!products[count] || !products[count].img) return;
        const base64 = products[count].img;
        document.getElementById("productImage").src = \`data:image/jpeg;base64,\${base64}\`;
      }

      updateImage();

      function openLink() {
        window.open(products[count].link, '_blank');
      }

      function yuck() {
        count++;
        if (count >= products.length) {
          window.location.href="${invalidateLink}";
        }
        else updateImage();
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
