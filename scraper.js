import puppeteer from 'puppeteer'

const sites = [
    {
        name: 'The Combat Company',
        baseURL: 'https://thecombatcompany.com',
        searchURL: q => `/search?q=${encodeURIComponent(q)}`,
        itemSelector: '.card__information',
        nameSelector: '.full-unstyled-link',
        linkSelector: '.full-unstyled-link',
        priceSelector: '.price-item--regular',
        saleSelector: '.price-item--sale'
    }
];

async function scrapeSite(site, page, name) {
    const search = site.baseURL + site.searchURL(name);
    
    const response = await page.goto(search, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log("%s HTTP status: %d", site.name, response.status());
    
    const products = await page.$$eval('.card__information', (items, selectors) => 
        items.map(el => ({
            name: el.querySelector(selectors.nameSelector)?.innerText.trim(),
            link: el.querySelector(selectors.linkSelector)?.href.trim(),
            price: el.querySelector(selectors.priceSelector)?.innerText.trim(),
            sale: el.querySelector(selectors.saleSelector)?.innerText.trim()
        })), 
        {
            nameSelector: site.nameSelector,
            linkSelector: site.linkSelector,
            priceSelector: site.priceSelector,
            saleSelector: site.saleSelector
        }
    );

    return products;
}

export async function scrape() {
    // puppeteer setup
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list'],
        ignoreHTTPSErrors: true
    });
    const page = await browser.newPage();

    // set user agent to prevent bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    const results = [];
    for (const site of sites) {
        results.push(await scrapeSite(site, page, 'primaris crusader squad'));
    }

    await browser.close();

    return results;
}