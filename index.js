const readline = require("node:readline");
const cheerio = require("cheerio");
const https = require("https");


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(`Paste UNTITLED.STREAM URL: `, async (url) => {
  url = "https://untitled.stream/library/project/8KqqxISbQrxrAoWY1WSxA";

  getAlbumData(url).then((data) => {
    console.log(data);
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
    albumData.tracks.push({
      title: track.title,
      //version_count: track.version_count,
      filename: getFilename(track.audio_fallback_url),
      url: downloadableUrl(track.owner_auth_id, getFilename(track.audio_fallback_url)),
      /*audio_url: track.audio_url,
      audio_fallback_url: track.audio_fallback_url,*/
    });
  });

  return albumData;
}

function getFilename(trackUrl) {
  return trackUrl.split("/").pop();
}

function downloadableUrl(ownerAuthId, filename) {
  return "https://untitled.stream/api/storage/buckets/private-transcoded-audio/objects/" + ownerAuthId + "%2F" + filename + "/signedUrl";
}
