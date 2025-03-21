const cheerio = require("cheerio");
const https = require("https");

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

module.exports = {
    getAlbumData
}