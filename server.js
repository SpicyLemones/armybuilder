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

app.get('/', (req, res) => {
  const query = 'primaris crusader squad';
  scrape(query).then(result => {
    var text = `<div>Search query: \'${query}\'`;
    result.forEach(site => {
      text += '<div>' + site.site + ' price: ' + site.price + ', ' + site.link + '</div>';
    })
    text += '</div>';
    res.send(text);
  })
})

http.createServer(app).listen(80);
//https.createServer(options, app).listen(443);