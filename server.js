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
  scrape().then(result => {
    res.send(result[0]);
  })
})

http.createServer(app).listen(80);
//https.createServer(options, app).listen(443);