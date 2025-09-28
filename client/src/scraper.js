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
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--dns-prefetch-disable",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-spki-list",
    ],
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
  );

  const searchUrl =
    seller.base_url +
    seller.search_url.replace(/\*/g, encodeURIComponent(product.search_term));

  try {
    await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });
  } catch {}

  // Optional: autoscroll to trigger lazy lists (safe no-op if not needed)
  try {
    await page.evaluate(async () => {
      const delay = (ms) => new Promise(r => setTimeout(r, ms));
      let last = 0;
      for (let i = 0; i < 8; i++) {
        window.scrollTo(0, document.body.scrollHeight);
        await delay(400);
        const h = document.body.scrollHeight;
        if (h === last) break;
        last = h;
      }
      window.scrollTo(0, 0);
    });
  } catch {}

  try {
    if (seller.product_selector) {
      await page.waitForSelector(seller.product_selector, { timeout: 8000 });
    }
  } catch {}

  const products = await page.$$eval(
    seller.product_selector,
    (nodes, sel) => {
      const toAbs = (href) => {
        if (!href) return null;
        try { return new URL(href, sel.base_url).toString(); } catch { return href; }
      };
      const firstFromSrcset = (srcset) => {
        if (!srcset) return null;
        const first = srcset.split(",")[0]?.trim().split(" ")[0];
        return first || null;
      };
      const num = (txt) => {
        if (!txt) return null;
        const m = txt.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
        return m ? parseFloat(m[0]) : null;
      };

      return nodes.map((el) => {
        // ---- link ----
        let linkEl =
          (sel.link && el.querySelector(sel.link)) ||
          el.querySelector("a") ||
          null;
        const link = toAbs(linkEl?.getAttribute?.("href") || linkEl?.href || null);

        // ---- image ----
        let imgEl =
          (sel.img && el.querySelector(sel.img)) ||
          el.querySelector("img") ||
          null;
        // if selector points to a container, dive once
        if (imgEl && imgEl.tagName && imgEl.tagName.toLowerCase() !== "img") {
          imgEl = imgEl.querySelector("img") || imgEl;
        }
        const src =
          imgEl?.getAttribute?.("src") ||
          imgEl?.getAttribute?.("data-src") ||
          firstFromSrcset(imgEl?.getAttribute?.("srcset")) ||
          firstFromSrcset(imgEl?.getAttribute?.("data-srcset")) ||
          null;
        const imgLink = toAbs(src);

        // ---- price ----
        const saleText = sel.sale ? el.querySelector(sel.sale)?.textContent : "";
        const priceText = sel.price ? el.querySelector(sel.price)?.textContent : "";
        const itemPropText = el.querySelector("[itemprop='price']")?.getAttribute?.("content")
          || el.querySelector("[itemprop='price']")?.textContent
          || "";
        const anyPriceText = el.querySelector(".price")?.textContent || "";

        // priority: sale > regular > itemprop > any price container
        const price =
          num(saleText) ??
          num(priceText) ??
          num(itemPropText) ??
          num(anyPriceText);

        // also grab a name if handy (useful for debugging)
        const name =
          el.querySelector(sel.name)?.textContent?.trim() ||
          el.querySelector("a")?.textContent?.trim() ||
          "";

        return { link, imgLink, price, name };
      })
      // keep items that at least have a link; price can be null (Tinder can show "—")
      .filter(r => !!r.link);
    },
    {
      base_url: seller.base_url,
      name: seller.name_selector,
      link: seller.link_selector,
      img: seller.image_selector,
      price: seller.price_selector,
      sale: seller.sale_selector,
    }
  );

  // Server-side fetch image buffers (optional)
  const final = [];
  for (const cand of products) {
    let buf = null;
    if (cand.imgLink) {
      try {
        const r = await fetch(cand.imgLink);
        buf = Buffer.from(await r.arrayBuffer());
      } catch {}
    }
    final.push({ link: cand.link, price: cand.price, img: buf });
  }

  console.log(`[searchSeller] got ${products.length} cards for "${product.name}" at ${seller.name}`);
  await page.close();
  await browser.close();
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
