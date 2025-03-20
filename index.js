const readline = require("node:readline");
const cheerio = require("cheerio");
const https = require("https");
const fs = require("fs");
const { resolve } = require("node:path");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(`Paste UNTITLED.STREAM URL: `, async (url) => {
  url = "https://untitled.stream/library/project/8KqqxISbQrxrAoWY1WSxA";

  let albumData = await getAlbumData(url);
  let downloadUrl = await generateDownloadUrl(
    albumData.tracks[0].downloadablePath
  );

  downloadFile("file.mp3", albumData.tracks[0].title, downloadUrl);

  rl.close();
});

async function getAlbumData(url) {
  const $ = await cheerio.fromURL(url);
  // TODO: Better way to do the object parse.
  // Don't like this method but this is the only way I found to get all the data.
  let rawAlbumData = $('script:contains("tracks")').html();
  rawAlbumData = JSON.parse(
    rawAlbumData.replace("window.__remixContext = ", "").replace(";", "").trim()
  );
  let rawProject =
    rawAlbumData.state.loaderData["routes/library.project.$projectSlug"].project
      .project;
  let rawTracks =
    rawAlbumData.state.loaderData["routes/library.project.$projectSlug"].project
      .tracks;

  let albumData = {
    title: rawProject.title,
    artist_name: rawProject.artist_name,
    cover_url: rawProject.artwork_url,
    token: rawAlbumData.state.loaderData.root.env.SUPABASE_ANON_PUBLIC,
    tracks: [],
  };

  rawTracks.forEach((track) => {
    let downloadablePath = getDownloadablePath(
      track.owner_auth_id,
      getFilename(track.audio_fallback_url)
    );

    albumData.tracks.push({
      title: track.title,
      filename: getFilename(track.audio_fallback_url),
      downloadablePath,
      //downloadableUrl: getDownloadableUrl(downloadablePath),
    });
  });

  return albumData;
}

function getFilename(trackUrl) {
  return trackUrl.split("/").pop();
}

function getDownloadablePath(ownerAuthId, filename) {
  return (
    "/api/storage/buckets/private-transcoded-audio/objects/" +
    ownerAuthId +
    "%2F" +
    filename +
    "/signedUrl"
  );
}

/*function getDownloadableUrl(path) {
  return "https://untitled.stream" + path;
}*/

function generateDownloadUrl(downloadablePath) {
  // POST request to get the download link.
  //console.log(downloadablePath);
  return new Promise((resolve, reject) => {
    let body = JSON.stringify({ expiresIn: 10800 });

    let options = {
      hostname: "untitled.stream",
      port: 443,
      path: downloadablePath.startsWith("/")
        ? downloadablePath
        : `/${downloadablePath}`,
      method: "POST",
      headers: {
        Host: "untitled.stream",
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body, "utf8"),
        Accept: "*/*",
      },
    };

    let req = https.request(options, (res) => {
      //console.log("statusCode:", res.statusCode);
      //console.log("headers:", res.headers);

      let data = "";
      let downloadUrl = "";

      res.on("data", (d) => {
        data += d;
      });

      res.on("end", () => {
        try {
          downloadUrl = JSON.parse(data).url;
          resolve(downloadUrl);
        } catch (e) {
          console.error("Error parsing JSON:", e.message);
        }
      });
    });

    req.on("error", (e) => {
      console.error("Request error:", e.message);
    });

    req.write(body);
    req.end();
  });
}

function downloadFile(path, name, url) {
  let file = fs.createWriteStream(path);
  let request = https.get(url, function (response) {
    response.pipe(file);
  });
}
