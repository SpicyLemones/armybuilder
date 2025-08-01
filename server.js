var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');

var options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.cert')
}

var app = express();

app.get('/', (req, res) => {
  res.send('hi')
})

http.createServer(app).listen(80);
//https.createServer(options, app).listen(443);