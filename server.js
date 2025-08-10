import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';

import { scrape } from './scraper.js'

var options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.cert')
}

var app = express();

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

app.get('/', (req, res) => {
  res.send(homeButton + searchBar);
});

app.get('/search', (req, res) => {
  scrape(req.query.q).then(result => {
    var text = homeButton + searchBar + `<div>Search query: \'${req.query.q}\'`;
    result.forEach(site => {
      text += `<div><a href=\'${site.link}\'>` + site.site + ' price: ' + site.price + '</a></div>';
    })
    text += '</div>';
    res.send(text);
  })
});

http.createServer(app).listen(80);
//https.createServer(options, app).listen(443);