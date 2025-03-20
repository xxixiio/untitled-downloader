const readline = require("node:readline");
const fs = require("fs");

const cheerio = require("cheerio");
const https = require("https");
const axios = require('axios');

const NodeID3 = require("node-id3");

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
  if (!url || !url.trim() || !url.startsWith("https://untitled.stream/library/project/")) {
    console.error("Error: Invalid URL. Please provide a valid untitled.stream project URL.");
    return;
  }
  
  if (!path || !path.trim()) {
    console.error("Error: Invalid path. Please provide a valid directory path.");
    return;
  }

  let createdFiles = [];

  let albumData = await getAlbumData(url);
  console.log(`Downloading album: ${albumData.title} by ${albumData.artist_name}`);
  console.log(`Found ${albumData.tracks.length} tracks to download...`);

  // Use Promise.all with map instead of forEach to properly wait for all downloads
  await Promise.all(albumData.tracks.map(async (trackData) => {
    try {
      let downloadUrl = await generateDownloadUrl(
        trackData.downloadablePath
      );

      // Remove slashes from title since they can cause pathing errors.
      let filePath = await downloadFile(
        path,
        trackData.title.replace(/\//g, ""),
        downloadUrl
      );

      trackData.path = filePath;

      // Add metadata to the file after download is complete
      await addMetadata(filePath, trackData, albumData);

      createdFiles.push(trackData);
      console.log(`Completed: ${trackData.title}`);
    } catch (error) {
      console.error(`Error processing track ${trackData.title}:`, error);
    }
  }));
  
  console.log(`\nDownload complete! Downloaded ${createdFiles.length}/${albumData.tracks.length} tracks.`);
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
  return new Promise((resolve, reject) => {
    path = path.endsWith("/") ? path : path + "/"; // Add trailing slash if not present.
    const filePath = path + name + ".mp3";
    let file = fs.createWriteStream(filePath);
    
    console.log(`Downloading: ${name}`);
    
    let request = https.get(url, function (response) {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Download finished: ${name}`);
        resolve(filePath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file if there was an error
        reject(err);
      });
    });
    
    request.on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

function addMetadata(filePath, trackData, albumData) {
  return new Promise(async (resolve, reject) => {
    const res = await axios({
      url: albumData.cover_url,
      responseType: 'arraybuffer',
    });

    const tags = {
      title: trackData.title,
      artist: albumData.artist_name,
      album: albumData.title,
      image: {
        imageBuffer: Buffer.from(res.data),
        mime: 'image/jpeg',
        description: 'cover',
        type: 3
      }

    };

    NodeID3.write(tags, filePath, (err) => {
      if (err) {
        console.error('Error when modifying metadata:', err);
        reject(err);
      } else {
        console.log(trackData.title + ': Added metadata.');
        resolve();
      }
    });
  });
}
