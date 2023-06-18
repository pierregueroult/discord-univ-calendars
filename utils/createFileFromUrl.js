const fs = require("node:fs");
const https = require("node:https");

function createFileFromUrl(url, path, name, ext) {
  const file = fs.createWriteStream(
    path + name + ext // "./calendars/" + complete_promo + ".ics"
  );

  https.get(url, function (response) {
    response.pipe(file);

    file.on("error", function (err) {
      console.log(err);
      fs.unlink(name + ext);
    });

    file.on("finish", function () {
      file.close();
    });
  });
}

module.exports = createFileFromUrl;
