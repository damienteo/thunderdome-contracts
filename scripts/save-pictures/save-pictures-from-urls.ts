const fs = require("fs"),
  http = require("http"),
  https = require("https");

const Stream = require("stream").Transform;

import { POKEMON_DETAILS } from "../../constants/constants";

const downloadImageFromURL = (url: string, filename: string) => {
  let client = http;
  if (url.toString().indexOf("https") === 0) {
    client = https;
  }

  client
    .request(url, function (response: any) {
      const data = new Stream();

      response.on("data", function (chunk: any) {
        data.push(chunk);
      });

      response.on("end", function () {
        fs.writeFileSync(filename, data.read());
      });
    })
    .end();
};

const downloadPictures = async () => {
  const generateMethods = POKEMON_DETAILS.map((element, index) =>
    downloadImageFromURL(
      element.image,
      `images/${element.description}-${element.name}.png`
    )
  );

  await Promise.all(generateMethods);
};

downloadPictures();
