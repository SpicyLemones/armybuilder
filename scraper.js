import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

async function scrapeSeller(seller, page, item) {
  const search =
    seller.base_url + seller.search_url + encodeURIComponent(item.name);

  const response = await page.goto(search, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  //console.log("%s HTTP status: %d", seller.name, response.status());

  // grab all the items that show up on the page when we search
  const items = await page.$$eval(
    seller.item_selector,
    (items, args) =>
      items.map((el) => ({
        seller_id: args.seller_id,
        item_id: args.item_id,
        name: el.querySelector(args.name_selector)?.innerText.trim(),
        link: el.querySelector(args.link_selector)?.href.trim(),
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
      item_id: item.id,
      name_selector: seller.name_selector,
      link_selector: seller.link_selector,
      price_selector: seller.price_selector,
      sale_selector: seller.sale_selector,
    }
  );

  await page.close();

  return items;
}

export const scrape = async (sellers, items) => {
  // track time to update
  console.log("Scraping sellers...");
  const start = new Date();

  // puppeteer setup
  puppeteer.use(StealthPlugin());

  // for each item, scrape all sellers
  const browsers = [];
  const results = [];
  for (const item of items) {
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

    browsers.push(browser);

    for (const seller of sellers) {
      //console.log(`Looking for \'${item.name}\' at ${seller.name}`);
      // page for scraping
      const page = await browser.newPage();

      // set user agent to prevent bot detection
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
      );
      // scrape the site for all results
      results.push(scrapeSeller(seller, page, item));
    }
  }

  const resolved = await Promise.all(results);
  console.log(
    `Scraped all sellers in ${
      Math.round((new Date() - start) / 100) / 10
    } seconds`
  );

  await Promise.all(browsers.map((browser) => browser.close()));

  return resolved.map((result) => {
    // just do the first for now
    const first = result[0];
    return {
      seller_id: first.seller_id,
      item_id: first.item_id,
      price: first.sale ? first.sale : first.price,
      link: first.link,
    };
  });
};
