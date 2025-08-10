import puppeteer from "puppeteer";

async function scrapeSite(seller, page, item) {
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
    (items, selectors) =>
      items.map((el) => ({
        name: el.querySelector(selectors.name_selector)?.innerText.trim(),
        link: el.querySelector(selectors.link_selector)?.href.trim(),
        price: el.querySelector(selectors.price_selector)?.innerText.trim(),
        sale: el.querySelector(selectors.sale_selector)?.innerText.trim(),
      })),
    {
      name_selector: seller.name_selector,
      link_selector: seller.link_selector,
      price_selector: seller.price_selector,
      sale_selector: seller.sale_selector,
    }
  );

  return items;
}

export async function scrape(sellers, items) {
  // puppeteer setup
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

  // for each item, scrape all sellers
  const results = [];
  for (const item of items) {
    for (const seller of sellers) {
      console.log(`Looking for \'${item.name}\' at ${seller.name}...`);
      // scrape the site for all results
      const result = await scrapeSite(seller, page, item);
      // just take the first one
      const first = result?.[0];
      results.push({
        seller_id: seller.id,
        item_id: item.id,
        price: first?.sale ? first?.sale : first?.price,
        link: first?.link,
      });
    }
  }

  await browser.close();

  return results;
}
