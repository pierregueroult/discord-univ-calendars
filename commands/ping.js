const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription(
      "Mesure la latence du bot, parce qu'il est hébergé sur un vieux dell optiplex donc c'est pas ouf."
    )
    .setDMPermission(false),
  async execute(interaction) {
    await interaction.reply("Pong ! ");

    const reply = await interaction.fetchReply();
    await interaction.editReply(
      `Pong ! \n Le bot a ${
        reply.createdTimestamp - interaction.createdTimestamp
      }ms de latence (${
        reply.createdTimestamp - interaction.createdTimestamp > 500
          ? "C'est un peu long, non ?"
          : "Ça va, c'est pas encore trop miteux"
      })`
    );
  },
};
