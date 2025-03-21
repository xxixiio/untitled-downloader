const readline = require("node:readline");

const { generateDownloadUrl, downloadFile } = require("./utils/download");
const { getAlbumData } = require("./utils/parser");
const { addMetadata } = require("./utils/metadata");

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
  if (
    !url ||
    !url.trim() ||
    !url.startsWith("https://untitled.stream/library/project/")
  ) {
    console.error(
      "Error: Invalid URL. Please provide a valid untitled.stream project URL."
    );
    return;
  }

  if (!path || !path.trim()) {
    console.error(
      "Error: Invalid path. Please provide a valid directory path."
    );
    return;
  }

  let createdFiles = [];

  let albumData = await getAlbumData(url);
  console.log(
    `Downloading album: ${albumData.title} by ${albumData.artist_name}`
  );
  console.log(`Found ${albumData.tracks.length} tracks to download...`);

  // Use Promise.all with map instead of forEach to properly wait for all downloads
  await Promise.all(
    albumData.tracks.map(async (trackData) => {
      try {
        let downloadUrl = await generateDownloadUrl(trackData.downloadablePath);

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
    })
  );

  console.log(
    `\nDownload complete! Downloaded ${createdFiles.length}/${albumData.tracks.length} tracks.`
  );
}