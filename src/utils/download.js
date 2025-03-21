const fs = require("fs");
const https = require("https");

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

      file.on("finish", () => {
        file.close();
        console.log(`Download finished: ${name}`);
        resolve(filePath);
      });

      file.on("error", (err) => {
        fs.unlink(filePath, () => {}); // Delete the file if there was an error
        reject(err);
      });
    });

    request.on("error", (err) => {
      fs.unlink(filePath, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

module.exports = {
  generateDownloadUrl,
  downloadFile,
};
