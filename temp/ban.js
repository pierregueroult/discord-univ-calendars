const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription(
      "Commande Administrateur : Commande pour bannir un utilisateur"
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Choisis l'utilisateur")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Rentre la raison du ban")
        .setRequired(true)
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") ?? "Aucune raison donnée";

    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      await interaction.reply({
        content:
          "Tu n'as malheuresement pas les persmissions pour utiliser cette commande. Si tu penses que tu devrais les avoir, renverse le pouvoir en place. Non je déconne, demande à un admin de faire le boulot à ta place.",
        ephemeral: true,
      });
    }

    if (!user) {
      await interaction.reply({
        content:
          "L'utilisateur que tu as rentré n'est pas valide beau gosse d'admin. Si tu penses que t'as raison, viens te battre en 1v1 contre le dev qu'on rigole un peu. Non je rigole, en fait faut juste mettre un utilisateur valide.",
        ephemeral: true,
      });
      return;
    }

    if (!interaction.guild.members.cache.has(user.id)) {
      await interaction.reply({
        content:
          "L'utilisateur que tu as rentré n'est pas dans le serveur beau gosse d'admin. Si tu penses que t'as raison, viens te battre en 1v1 contre le dev qu'on rigole un peu. Non je rigole, en fait faut juste mettre un utilisateur dans le serveur.",
        ephemeral: true,
      });
      return;
    }

    if (
      interaction.guild.members.cache.get(user.id).roles.highest.position >=
      interaction.member.roles.highest.position
    ) {
      await interaction.reply({
        content:
          "L'utilisateur que tu as rentré a un rôle supérieur ou égal au tien beau gosse d'admin. Si tu penses que t'as raison, viens te battre en 1v1 contre le dev qu'on rigole un peu. Non je rigole, en fait faut juste mettre un utilisateur avec un rôle inférieur au tien.",
        ephemeral: true,
      });
      return;
    }

    // ban the user
    const button = new ButtonBuilder()
      .setCustomId("confirm_ban")
      .setLabel("Confirmer le bannissement")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🙌");
    const cancel = new ButtonBuilder()
      .setCustomId("cancel_ban")
      .setLabel("Annuler")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("❌");

    const row = new ActionRowBuilder().addComponents(cancel, button);

    await interaction.reply({
      content: `Tu es sur le point de bannir ${user.username}#${user.discriminator} pour la raison suivante : ${reason}. Es-tu sûr de vouloir continuer ?`,
      components: [row],
      ephemeral: true,
    });

    const filter = (i) => i.user.id === interaction.user.id;

    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 15000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "confirm_ban") {
        await i.update({
          content: `L'utilisateur ${user.username}#${user.discriminator} a été banni pour la raison suivante : ${reason}.`,
          components: [],
        });
        await user.send(
          `Tu as été banni du serveur ${interaction.guild.name} pour la raison suivante : ${reason}.`
        );
        await user.ban({ reason: reason });
      } else if (i.customId === "cancel_ban") {
        await i.update({
          content: `Le bannissement de l'utilisateur ${user.username}#${user.discriminator} a été annulé.`,
          components: [],
        });
      }
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time") {
        await interaction.editReply({
          content: `Le bannissement de l'utilisateur ${user.username}#${user.discriminator} a été annulé car tu n'as pas répondu à temps.`,
          components: [],
        });
      }
    });
  },
};
