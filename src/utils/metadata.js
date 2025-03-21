const axios = require('axios');
const NodeID3 = require("node-id3");

function addMetadata(filePath, trackData, albumData) {
  return new Promise(async (resolve, reject) => {
    const res = await axios({
      url: albumData.cover_url,
      responseType: "arraybuffer",
    });

    const tags = {
      title: trackData.title,
      artist: albumData.artist_name,
      album: albumData.title,
      image: {
        imageBuffer: Buffer.from(res.data),
        mime: "image/jpeg",
        description: "cover",
        type: 3,
      },
    };

    NodeID3.write(tags, filePath, (err) => {
      if (err) {
        console.error("Error when modifying metadata:", err);
        reject(err);
      } else {
        console.log(trackData.title + ": Added metadata.");
        resolve();
      }
    });
  });
}

module.exports = {
    addMetadata
}