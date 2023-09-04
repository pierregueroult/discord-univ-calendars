const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  userMention,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription(
      "Commande Administrateur : Commande pour supprimer des messages"
    )
    .addIntegerOption((option) =>
      option
        .setName("quantité")
        .setDescription("Choisis le nombre de messages à supprimer")
        .setRequired(true)
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const amount = interaction.options.getInteger("quantité");

    if (
      !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      await interaction.reply({
        content:
          "Tu n'as malheuresement pas les persmissions pour utiliser cette commande. Si tu penses que tu devrais les avoir, renverse le pouvoir en place. Non je déconne, demande à un admin de faire le boulot à ta place.",
        ephemeral: true,
      });
      return;
    }

    if (isNaN(amount)) {
      await interaction.reply({
        content:
          "La quantité que tu as rentré n'est pas valide beau gosse d'admin. Si tu penses que t'as raison, viens te battre en 1v1 contre le dev qu'on rigole un peu. Non je rigole, en fait faut juste mettre un nombre valide.",
        ephemeral: true,
      });
      return;
    }

    if (amount <= 0 || amount > 100) {
      await interaction.reply({
        content:
          "La quantité que tu as rentré n'est pas valide beau gosse d'admin. Si tu penses que t'as raison, viens te battre en 1v1 contre le dev qu'on rigole un peu. Non je rigole, en fait faut juste mettre un nombre entre 1 et 100.",
        ephemeral: true,
      });
      return;
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cancel_clear_messages")
        .setLabel("Annuler")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("❌"),
      new ButtonBuilder()
        .setCustomId("clear_messages")
        .setLabel("Supprimer")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🗑️")
    );

    await interaction.reply({
      content: `Tu es sur le point de supprimer ${amount} messages. Es-tu sûr de vouloir continuer ?`,
      components: [row],
      ephemeral: true,
    });

    const filter = (i) =>
      i.customId === "clear_messages" || i.customId === "cancel_clear_messages";
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 15000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "clear_messages") {
        await interaction.channel.bulkDelete(amount, true).catch((error) => {
          console.error(error);
          interaction.reply({
            content:
              "Il y a eu une erreur lors de la suppression des messages dans ce channel!",
            ephemeral: true,
          });
        });

        await interaction.editReply({
          content: `**${amount} message(s) ont été supprimés.**`,
          components: [],
        });

        // send a message
        await interaction.channel.send({
          content: `**${amount} message(s) ont été supprimés par ${userMention(
            interaction.user.id
          )}.**`,
        });
      } else {
        await interaction.editReply({
          content: `**${amount} message(s) n'ont pas été supprimés.**`,
          components: [],
        });
      }
    });

    collector.on("end", async (i) => {
      if (i.size === 0) {
        await interaction.editReply({
          content: `**${amount} messages n'ont pas été supprimés car tu as mis trop de temps à te décider.**`,
          components: [],
        });
      }
    });
  },
};
