import express from "express";
import https from "https";
import http from "http";
import fs from "fs";
import sqlite3 from "sqlite3";
import pLimit from "p-limit";

import { scrape, searchSeller } from "./src/scraper.js";
import { fuzzy } from "./src/search.js";
import { resolve } from "path";

// https shit im too lazy to actually use this yet
var options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.cert"),
};

// set up express sir
var app = express();
app.use(express.urlencoded({ extended: true }));

// set up sqlite sir
const db = new sqlite3.Database("./db/data.sqlite");

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
        file(`./db/queries/${queryName}.sql`, "utf8"),
        args,
        function (err) {
          if (err) return rej(err);
          callback?.(this);
          res(this);
        }
      );
    } else if (type === "get") {
      db.get(
        file(`./db/queries/${queryName}.sql`, "utf8"),
        args,
        (err, row) => {
          callback?.(row);
          res(row);
        }
      );
    } else if (type === "all") {
      db.all(
        file(`./db/queries/${queryName}.sql`, "utf8"),
        args,
        (err, rows) => {
          callback?.(rows);
          res(rows);
        }
      );
    } else if (type === "each") {
      db.each(
        file(`./db/queries/${queryName}.sql`, "utf8"),
        args,
        (err, rows) => {
          callback?.(rows);
          res(rows);
        }
      );
    }
  });
};

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

// database debug tool
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
</div>
`;

// home page
app.get("/", (req, res) => {
  res.send(debugDB + homeButton + searchBar);
});

// search page
app.get("/search", (req, res) => {
  // grab all products in the database
  query("all", "select/all_products", [], (products) => {
    var text =
      debugDB +
      homeButton +
      searchBar +
      `<div>Search query: \'${req.query.q}\'`;
    // fuzzy search
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
    // grab all known prices for that product from all sellers
    query("all", "select/display_prices", [product?.id], (prices) => {
      console.log(prices);
      var text =
        debugDB + homeButton + searchBar + `<div>Product: \'${product.name}\'`;
      // display each price from each seller as a link to the seller's page
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

app.get("/validate", async (req, res) => {
  console.log(req.query);
  await query("run", "update/validate_price", [
    req.query.link.trim(),
    req.query.price.trim(),
    req.query.s.trim(),
    req.query.p.trim(),
  ]);
  res.redirect("/tinder");
});

app.get("/invalidate", async (req, res) => {
  await query("run", "update/invalidate_price", [req.query.s, req.query.p]);
  res.redirect("/tinder");
});

app.get("/tinder", async (req, res) => {
  const price = await query("get", "select/unchecked_prices");
  console.log(price);
  const seller = await query("get", "select/seller_id", [price.seller_id]);
  console.log(seller);
  const product = await query("get", "select/product_id", [price.product_id]);
  console.log(product);
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

  //imgStringProducts.sort()

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
        width: 100%;   /* full viewport width */
        height: 100%;  /* full viewport height */
        object-fit: contain; /* fill the screen, cropping if needed */
      }
    </style>

    <script>
      let count = 0;
      const products = ${JSON.stringify(imgStringProducts)};
      
      function updateImage() {
        if (!products[count] || !products[count].img) return;
        const base64 = products[count].img;
        console.log(base64);
        document.getElementById("productImage").src = \`data:image/jpeg;base64,\${base64}\`;
      }

      updateImage();

      function openLink() {
        window.open(products[count].link, '_blank');
      }

      function yuck() {
        count++;
        if (count >= products.length) {
          window.location.href=\"${invalidateLink}\";
        }
        else updateImage();
      }

      function yum() {
        window.location.href=\`${validateLink}&link=\${encodeURIComponent(products[count].link)}&price=\${encodeURIComponent(products[count].price)}\`;
      }
    </script>`;
  res.send(homeButton + text);
});

// debug thing for manually messing with database
app.post("/db", (req, res) => {
  const action = req.body?.action;
  const query = req.body?.query;
  console.log(`Received ${action} command`);
  if (action === "update") {
    updateDB().then(() => {
      res.redirect("/");
    });
  } else if (action === "clear") {
    clearDB().then(() => {
      console.log("Database cleared.");
      res.redirect("/");
    });
  } else if (action === "setup") {
    setupDB().then(() => {
      console.log("Database set up.");
      res.redirect("/");
    });
  } else if (action === "run") {
    db.run(req.query.r, (err) => {
      console.log(query);
      if (err) console.log(`Error: ${err}`);
      res.redirect("/");
    });
  } else if (action === "log") {
    db.get(query, (err, row) => {
      console.log(query);
      console.log(row);
      if (err) console.log(`Error: ${err}`);
      res.redirect("/");
    });
  } else if (action === "log_all") {
    db.all(query, (err, rows) => {
      console.log(query);
      console.log(rows);
      if (err) console.log(`Error: ${err}`);
      res.redirect("/");
    });
  } else res.json({ success: false, message: "undefined command" });
});

http.createServer(app).listen(80);
//https.createServer(options, app).listen(443);
