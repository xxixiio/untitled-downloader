const readline = require("node:readline");
const cheerio = require("cheerio");
const https = require("https");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(`Paste UNTITLED.STREAM URL: `, (url) => {
  let rawHTML = getHTML(url);

  rl.close();
});

function getHTML(url) {
  https
    .get(url, function (res) {
      res.setEncoding("utf8");
      res.on("data", function (data) {
        return data;
      });
    })
    .on("error", function (err) {
      console.error(err);
    });
}
