const readline = require("node:readline");
const cheerio = require("cheerio");
const https = require("https");
const { hostname } = require("node:os");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(`Paste UNTITLED.STREAM URL: `, async (url) => {
  url = "https://untitled.stream/library/project/8KqqxISbQrxrAoWY1WSxA";

  getAlbumData(url).then((data) => {
    postUrl("AAA", data.tracks[0].downloadablePath);
  });

  rl.close();
});

async function getAlbumData(url) {
  const $ = await cheerio.fromURL(url);
  let rawAlbumData = $('script:contains("tracks")').html();
  // TODO: Better way to do the object parse.
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
      //version_count: track.version_count,
      filename: getFilename(track.audio_fallback_url),
      downloadablePath,
      downloadableUrl: getDownloadableUrl(downloadablePath),
      /*audio_url: track.audio_url,
      audio_fallback_url: track.audio_fallback_url,*/
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

function getDownloadableUrl(path) {
  return "https://untitled.stream" + path;
}

function postUrl(path, downloadableUrl) {
  let body = JSON.stringify({ expiresIn: 10800 });
  let options = {
    hostname: "untitled.stream",
    port: 443,
    body,
    path: path,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": body.length,
    },
  };

  let req = https.request(options, (res) => {
    console.log("statusCode:", res.statusCode);
    console.log("headers:", res.headers);

    res.on("data", (d) => {
      process.stdout.write(d);
    });
  });

  req.on("error", (e) => {
    console.error(e);
  });

  req.write(body);
  req.end();
}
