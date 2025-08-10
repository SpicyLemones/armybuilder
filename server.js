import express from "express";
import https from "https";
import http from "http";
import fs from "fs";
import sqlite3 from "sqlite3";

import { scrape } from "./scraper.js";
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
const db = new sqlite3.Database("./db/data.sql");

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
// for example, if i wanna do "SELECT * FROM items" i should make
// a db/queries/select/all_items.sql file and put that query in it
// and then run query("all", "select/all_items"). nice very nice
const query = (type, queryName, args, callback) => {
  return new Promise((res, rej) => {
    if (type === "run") {
      db.run(file(`./db/queries/${queryName}.sql`, "utf8"), args, () => {
        callback?.(this);
        res(this);
      });
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

// initial manual data, eventually we should move this to a file but for now its jose mode bitch
const setupDB = () => {
  return new Promise((res, rej) => {
    db.serialize(async () => {
      await query("run", "create/items");
      await query("run", "create/prices");
      await query("run", "create/sellers");
      await query("run", "insert/seller", [
        "The Combat Company",
        "https://thecombatcompany.com",
        "/search?q=",
        "li.grid__item",
        ".full-unstyled-link",
        ".full-unstyled-link",
        ".price-item--regular",
        ".price-item--sale",
      ]);
      await query("run", "insert/seller", [
        "War For Less",
        "https://www.warforless.com.au/",
        "?rf=kw&kw=",
        ".card.thumbnail.card-body",
        ".card-title a",
        ".card-title a",
        ".price span",
        ".badge--sale span",
      ]);
      await query("run", "insert/seller", [
        "Gap Games",
        "https://www.gapgames.com.au/",
        "a/search?q=",
        "div.product",
        ".product__title a",
        ".product__image-wrapper",
        '[data-testid="product-card-current-price"]',
        ".product__price--on-sale",
      ]);
      await query("run", "insert/seller", [
        "Warhammer Official",
        "https://www.warhammer.com/en-AU/",
        "plp?search=",
        "div.product-card",
        ".full-unstyled-link",
        "a.product-card-image",
        '[data-testid="product-card-current-price"]',
        ".NOSALESBITCH",
      ]);

      await query("run", "insert/item", ["primaris crusader squad"]);

      res(this);
    });
  });
};

// delete everything but maintain the structure
const clearDB = () => {
  return new Promise((res, rej) => {
    db.serialize(async () => {
      await query("run", "delete/items");
      await query("run", "delete/prices");
      await query("run", "delete/sellers");
      res(this);
    });
  });
};

// asynchronously scrape all sellers for all items
const updateDB = async () => {
  console.log("Updating database...");
  const items = await query("all", "select/all_items");
  const sellers = await query("all", "select/all_sellers");
  const scraped = await scrape(sellers, items);
  scraped.forEach((price) => {
    query("run", "insert/price", [
      price.seller_id,
      price.item_id,
      price.price,
      price.link,
    ]);
  });
  console.log("Database update complete.");
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
  // look for the item in our data base
  query("get", "select/item_name", [req.query?.q], (item) =>
    // grab all known prices for that item from all sellers
    query("all", "select/display_prices", [item?.id], (prices) => {
      var text =
        debugDB +
        homeButton +
        searchBar +
        `<div>Search query: \'${req.query.q}\'`;
      // display each price from each seller as a link to the seller's page
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

// update database every 10 minutes
setInterval(updateDB, 600000);
