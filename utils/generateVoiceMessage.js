const tts = require("discord-tts");

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function generateVoiceMessage(message) {
  const audioStream = await tts.getVoiceStream(message, {
    lang: "fr",
    slow: false,
  });

  const buffer = await streamToBuffer(audioStream);

  return buffer;
}

module.exports = generateVoiceMessage;
