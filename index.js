const readline = require("node:readline");
const cheerio = require("cheerio");
const https = require("https");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(`Paste UNTITLED.STREAM URL: `, async (url) => {
  url = "https://untitled.stream/library/project/8KqqxISbQrxrAoWY1WSxA";

  const $ = await cheerio.fromURL(url);
  const rawAlbumData = $('script:contains("tracks")').html();
  const stringAlbumData = rawAlbumData.replace(/.*?=\s*|\s*;$/g, '');
  const albumData = JSON.parse(stringAlbumData);

  console.log(albumData)
  
  rl.close();
});
