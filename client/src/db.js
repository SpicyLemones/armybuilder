import fs from "fs";
import sqlite3 from "sqlite3";

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

// initial manual data, eventually we should move this to a file but for now its jose mode bitch
const setupDB = async () => {
  await clearDB();
  await query("run", "create/products");
  await query("run", "create/prices");
  await query("run", "create/sellers");

  const sellersString = fs.readFileSync("./db/json/sellers.json");
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

  const productsString = fs.readFileSync("./db/json/products.json");
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
