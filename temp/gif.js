const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gif")
    .setDescription("Commande qui balance un meme adapté au message")
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Description du meme")
        .setRequired(false)
    ),
  async execute(interaction) {
    const theme = interaction.options.getString("description");

    const gifFetch = await fetch(
      "https://tenor.googleapis.com/v2/search?q=" +
        theme +
        "&key=" +
        process.env.TENOR_KEY +
        "&limit=1"
    );

    const gif = await gifFetch.json();

    await interaction.reply({
      content:
        gif.results.length > 0 ? gif.results[0].url : "Pas de gif trouvé",
      ephemeral: gif.results.length > 0 ? false : true,
    });
  },
};
