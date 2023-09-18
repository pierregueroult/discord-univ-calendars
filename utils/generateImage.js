const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const path = require("path");

process.noDeprecation = true;

GlobalFonts.registerFromPath(
  path.join(__dirname, "../fonts/Lexend.ttf"),
  "Lexend"
);

async function generateImage(events) {
  const canvas = createCanvas(1920, 1150);
  const ctx = canvas.getContext("2d");

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

  ctx.fillStyle = "#ffffff";

  const hourHeight = (canvas.height - 80) / 11;

  ctx.font = "regular 30px Lexend";

  ctx.textAlign = "center";

  days.forEach((day, index) => {
    // setting up days
    ctx.font = "bold 50px Lexend";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(day, (canvas.width / 5) * index + canvas.width / 5 / 2, 50);

    events[index].forEach((event, i) => {
      // font reset
      ctx.font = "bold 30px Lexend";

      if (
        event.title.split(" ")[0] !== undefined &&
        event.title.split(" ")[1] !== undefined
      ) {
        event.number =
          event.title.split(" ")[0] + " " + event.title.split(" ")[1];
      } else {
        event.number = event.title;
      }

      var name = event.title.split(" ");

      if (name.length > 2) {
        name.shift();
        name.shift();
      }

      event.name = name.join(" ");

      // chose color depending on event
      var numInString = event.title.match(/\d+/g);
      if (numInString != null) {
        ctx.fillStyle = `hsl(${
          parseInt(numInString.join("")) * 30
        }, 100%, 65%)`;
      } else {
        if (event.title.startsWith("Examen")) {
          ctx.fillStyle = "yellow";
        } else if (event.title.startsWith("SAE Autonomie")) {
          ctx.fillStyle = "orange";
        } else {
          ctx.fillStyle = "green";
        }
      }

      // get start and end date
      var startDate = new Date(event.start);
      var endDate = new Date(event.end);
      var duration = new Date(endDate - startDate);

      event.teacher = event.description
        .split("\n")
        .filter((part) => part.length > 5)
        .filter((part) => !part.includes("CM"))
        .filter((part) => !part.includes("BUT"))
        .filter((part) => !part.includes("."))
        .filter((part) => !part.includes("TD"))
        .filter((part) => !part.includes("TP"))
        .filter((part) => !part.includes("RT"))
        .filter((part) => !part.includes("MMI"))
        .join(" ")
        .replace(/\([^)]*\)/g, "");

      // draw event
      ctx.beginPath();
      ctx.roundRect(
        (canvas.width / 5 + 2) * index,
        80 +
          (startDate.getHours() +
            startDate.getMinutes() / 60 -
            8.5 +
            0.15 * i) *
            hourHeight,
        canvas.width / 5 - 8,
        (duration.getHours() - 1 + duration.getMinutes() / 60) * hourHeight,
        30
      );
      ctx.fill();
      ctx.fillStyle = "#000000";

      // draw event text
      if (event.title.search(/\d/) === -1) {
        // if no number in title (ex: SAE Autonomie) then draw normally
        ctx.fillText(
          event.title,
          (canvas.width / 5) * index + canvas.width / 5 / 2,
          80 +
            (startDate.getHours() +
              startDate.getMinutes() / 60 -
              8.5 +
              0.15 * i) *
              hourHeight +
            35
        );
      } else {
        // else draw title with number in bold and bigger

        ctx.fillText(
          event.number,
          (canvas.width / 5) * index + canvas.width / 5 / 2,
          80 +
            (startDate.getHours() +
              startDate.getMinutes() / 60 -
              8.5 +
              0.15 * i) *
              hourHeight +
            35
        );

        // font reset
        ctx.font = "regular 15px Lexend";

        // draw the rest of the title
        ctx.fillText(
          event.name,
          (canvas.width / 5) * index + canvas.width / 5 / 2,
          80 +
            (startDate.getHours() +
              startDate.getMinutes() / 60 -
              8.5 +
              0.15 * i) *
              hourHeight +
            55
        );
      }

      ctx.font = "regular 25px Lexend";

      ctx.fillText(
        `${startDate.getHours()}:${
          startDate.getMinutes() < 10
            ? "0" + startDate.getMinutes()
            : startDate.getMinutes()
        } - ${endDate.getHours()}:${
          endDate.getMinutes() < 10
            ? "0" + endDate.getMinutes()
            : endDate.getMinutes()
        }`,
        (canvas.width / 5) * index + canvas.width / 5 / 2,
        80 +
          (startDate.getHours() +
            startDate.getMinutes() / 60 -
            8.5 +
            0.15 * i) *
            hourHeight +
          115
      );

      ctx.font = "bold 18px Lexend";

      ctx.fillText(
        event.teacher === ""
          ? event.location
          : event.location + " - " + event.teacher,
        (canvas.width / 5) * index + canvas.width / 5 / 2,
        80 +
          (startDate.getHours() +
            startDate.getMinutes() / 60 -
            8.5 +
            0.15 * i) *
            hourHeight +
          85
      );

      ctx.textAlign = "right";
      ctx.font = "bold 30px Lexend";
      ctx.fillStyle = "#ffffff";

      ctx.fillText(
        "Généré par BDE - Labete#2793",
        canvas.width - 20,
        canvas.height - 5
      );
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
    });
  });

  return await canvas.encode("png");
}

module.exports = generateImage;
