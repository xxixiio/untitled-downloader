const readline = require("node:readline");
const cheerio = require("cheerio");
const https = require("https");
const fs = require("fs");
const NodeID3 = require('node-id3');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(`Paste UNTITLED.STREAM URL: `, async (url) => {
  rl.question(
    `Enter the path where the file should be saved: `,
    async (path) => {
      main(url, path);
      rl.close();
    }
  );
});

async function main(url, path) {
  url = "https://untitled.stream/library/project/8KqqxISbQrxrAoWY1WSxA";
  path = "/Users/basti/Music/test";

  let createdFiles = [];

  let albumData = await getAlbumData(url);

  albumData.tracks.forEach(async (trackData) => {
    let downloadUrl = await generateDownloadUrl(
      trackData.downloadablePath
    );

    // Remove slashes from title since they can cause pathing errors.
    let filePath = downloadFile(
      path,
      trackData.title.replace(/\//g, ""),
      downloadUrl
    );

    trackData.path = filePath;

    // Add metadata to the file.
    addMetadata(filePath, trackData, albumData);

    createdFiles.push(trackData);
    console.log(trackData)
  });
}

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
    cover_url: rawProject.artwork_signed_url,
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
      artist_name: rawProject.artist_name,
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
  path = path.endsWith("/") ? path : path + "/"; // Add trailing slash if not present.
  let file = fs.createWriteStream(path + name + ".mp3");
  let request = https.get(url, function (response) {
    response.pipe(file);
  });

  return path + name + ".mp3";
}

function addMetadata(filePath, trackData, albumData) {
  const tags = {
    title: trackData.title,
    artist: albumData.artist_name,
    album: albumData.title,
  };

  NodeID3.write(tags, filePath, (err) => {
    if (err) {
      console.error('Error when modifying metadata:', err);
    } else {
      console.log(trackData.title + ': Added metadata.');
    }
  });
}
