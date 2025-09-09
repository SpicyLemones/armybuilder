import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import pLimit from "p-limit";

import imghash from "imghash";

const compareImages = async (a, b) => {
  const hashA = await imghash.hash(a, 16, "phash");
  const hashB = await imghash.hash(b, 16, "phash");

  let diff = 0;
  for (let i = 0; i < hashA.length; i++) {
    if (hashA[i] !== hashB[i]) diff++;
  }

  return diff;
};

export const searchSeller = async (seller, product) => {
  // initialise browser sir
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--dns-prefetch-disable",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-spki-list",
    ],
    // aids
    ignoreHTTPSErrors: true,
  });

  // initialise page sir
  const page = await browser.newPage();

  // set user agent to prevent bot detection
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
  );

  const search =
    seller.base_url +
    seller.search_url.replace(/\*/g, encodeURIComponent(product.search_term));

  try {
    const response = await page.goto(search, {
      waitUntil: "networkidle2",
      timeout: 10000,
    });
    if (response.status() !== 200)
      console.log("%s HTTP status: %d", search, response.status());
  } catch (err) {
    console.error(
      `Navigation timed out on ${seller.name} looking for ${product.name}`
    );
  }

  // grab all the products that show up on the page when we search
  const products = await page.$$eval(
    seller.product_selector,
    (products, selectors) =>
      products.map((el) => ({
        link: selectors.link ? el.querySelector(selectors.link)?.href : el.href,
        imgLink: selectors.img ? el.querySelector(selectors.img)?.src : el.src,
        price: parseFloat(
          el
            .querySelector(selectors.price)
            ?.innerText.trim()
            .replace(/[^0-9.-]+/g, "")
        ),
        sale: parseFloat(
          el
            .querySelector(selectors.sale)
            ?.innerText.trim()
            .replace(/[^0-9.-]+/g, "")
        ),
      })),
    {
      link: seller.link_selector,
      img: seller.image_selector,
      sale: seller.sale_selector,
      price: seller.price_selector,
    }
  );

  const final = [];

  for (let product of products) {
    final.push({
      link: product.link,
      price: product.sale ? product.sale : product.price,
      img: Buffer.from(await (await fetch(product.imgLink)).arrayBuffer()),
    });
  }

  return final;
};

async function scrapeSeller(seller, page, product) {
  const search =
    seller.base_url +
    seller.search_url.replace(/\*/g, encodeURIComponent(product.search_term));

  try {
    const response = await page.goto(search, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    if (response.status() !== 200)
      console.log("%s HTTP status: %d", search, response.status());
  } catch (err) {
    console.error(
      `Navigation timed out on ${seller.name} looking for ${product.name}`
    );
  }

  // grab all the products that show up on the page when we search
  const products = await page.$$eval(
    seller.product_selector,
    (products, args) =>
      products.map((el) => ({
        seller_id: args.seller_id,
        product_id: args.product_id,
        name: el.querySelector(args.name_selector)?.innerText.trim(),
        link: args.link_selector
          ? el.querySelector(args.link_selector)?.href.trim()
          : el.href.trim(),
        price: parseFloat(
          el
            .querySelector(args.price_selector)
            ?.innerText.trim()
            .replace(/[^0-9.-]+/g, "")
        ),
        sale: parseFloat(
          el
            .querySelector(args.sale_selector)
            ?.innerText.trim()
            .replace(/[^0-9.-]+/g, "")
        ),
      })),
    {
      seller_id: seller.id,
      product_id: product.id,
      name_selector: seller.name_selector,
      link_selector: seller.link_selector,
      price_selector: seller.price_selector,
      sale_selector: seller.sale_selector,
    }
  );

  return products;
}

export const scrape = async (sellers, products) => {
  // set up concurrency limit sir
  const limit = pLimit(4);

  // track time to update
  console.log("Scraping sellers...");
  const start = new Date();

  // puppeteer setup
  puppeteer.use(StealthPlugin());

  const scrapeTasks = products.map((product) =>
    limit(async () => {
      // create puppeteer browser
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--dns-prefetch-disable",
          "--ignore-certificate-errors",
          "--ignore-certificate-errors-spki-list",
        ],
        // aids
        ignoreHTTPSErrors: true,
      });

      // page for scraping
      const page = await browser.newPage();

      // set user agent to prevent bot detection
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
      );

      const results = [];

      for (const seller of sellers) {
        //console.log(`Looking for \'${product.name}\' at ${seller.name}`);

        // scrape the site for all results
        const result = await scrapeSeller(seller, page, product);

        // just grab first for now
        const first = result?.[0];
        results.push({
          seller_id: first?.seller_id,
          product_id: first?.product_id,
          price: first?.sale ? first?.sale : first?.price,
          link: first?.link,
        });
      }

      console.log(`Finished ${product.name}`);

      await page.close();

      await browser.close();

      return results;
    })
  );

  const results = await Promise.all(scrapeTasks);
  console.log(
    `Scraped all sellers in ${
      Math.round((new Date() - start) / 100) / 10
    } seconds.`
  );

  //console.log(results.flat());

  return results.flat();
};
