const {
  SlashCommandBuilder,
  AttachmentBuilder,
  userMention,
} = require("discord.js");
const generateVoiceMessage = require("../utils/generateVoiceMessage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("voice")
    .setDescription(
      "Utilise cette commande pour envoyer un message vocal dans le chat."
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Rentre ton message vocal")
        .setRequired(true)
        .setMaxLength(200)
    )
    .setDMPermission(false),
  async execute(interaction) {
    const message = interaction.options.getString("message");

    if (message.length > 200) {
      return await interaction.reply({
        content: `Mon dieu mais t'as pas vu la longueur de ton message ? Il fait ${message.length} caractères, et le max c'est 200, t'es con ou quoi ?`,
        ephemeral: true,
      });
    }

    const file = await generateVoiceMessage(message);

    const attachment = new AttachmentBuilder(file, {
      name: `Message de ${interaction.user.username}.wav`,
    });

    await interaction.reply({
      content: `${userMention(interaction.user.id)} souhaite vous dire :`,
      files: [attachment],
    });
  },
};
