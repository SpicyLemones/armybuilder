import puppeteer from 'puppeteer'

const sites = [
    {
        name: 'The Combat Company',
        baseURL: 'https://thecombatcompany.com',
        searchURL: q => `/search?q=${encodeURIComponent(q)}`,
        itemSelector: 'li.grid__item',
        nameSelector: '.full-unstyled-link',
        linkSelector: '.full-unstyled-link',
        priceSelector: '.price-item--regular',
        saleSelector: '.price-item--sale'
    },
    {
        name: 'Warhammer Official',
        baseURL: 'https://www.warhammer.com/en-AU/',
        searchURL: q => `plp?search=${encodeURIComponent(q)}`,
        itemSelector: 'div.product-card',
        nameSelector: '.full-unstyled-link',
        linkSelector: 'a.product-card-image',
        priceSelector: '[data-testid="product-card-current-price"]',
        saleSelector: '.NOSALESBITCH'
    },
    {
        name: 'Gap Games',
        baseURL: 'https://www.gapgames.com.au/',
        searchURL: q => `a/search?q=${encodeURIComponent(q)}`,
        itemSelector: 'div.product',
        nameSelector: '.product__title a',
        linkSelector: '.product__image-wrapper',
        priceSelector: '[data-testid="product-card-current-price"]',
        saleSelector: '.product__price--on-sale'
    },
    {
        name: 'War For Less',
        baseURL: 'https://www.warforless.com.au/',
        searchURL: q => `?rf=kw&kw=${encodeURIComponent(q)}`,
        itemSelector: '.card.thumbnail.card-body',
        nameSelector: '.card-title a',
        linkSelector: '.card-title a',
        priceSelector: '.price span',
        saleSelector: '.badge--sale span'
    }
];

async function scrapeSite(site, page, name) {
    const search = site.baseURL + site.searchURL(name);
    
    const response = await page.goto(search, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log("%s HTTP status: %d", site.name, response.status());
    
    const products = await page.$$eval(site.itemSelector, (items, selectors) => 
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

export async function scrape(query) {
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
        const result = await scrapeSite(site, page, query);
        const first = result?.[0];
        results.push({
            site: site.name,
            price: first?.sale ? first?.sale : first?.price,
            link: first?.link
        });
    }

    await browser.close();

    return results;
}