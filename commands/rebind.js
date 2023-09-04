const {
  SlashCommandBuilder,
  PermissionsBitField,
  PermissionFlagsBits,
} = require("discord.js");
const promoParams = require("../utils/promoParams");
const groupParams = require("../utils/groupParams");
const isValidInteger = require("../utils/isValidInteger");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rebind")
    .setDescription(
      "Commande Administrateur : Commande pour asssigner des nouveaux liens aux emplois du temps."
    )
    .addStringOption((option) =>
      option
        .setName("promo")
        .setDescription("Choisis la promo")
        .setRequired(true)
        .addChoices(...promoParams)
    )
    .addStringOption((option) =>
      option
        .setName("tp")
        .setDescription("Choisis le TP")
        .setRequired(true)
        .addChoices(...groupParams)
    )
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription("Rentre le code de l'emploi du temps")
        .setRequired(true)
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    // we extract the promo and the link from the prompt
    const promo = interaction.options.getString("promo");
    const tp = interaction.options.getString("tp");
    const code = interaction.options.getString("code");

    const complete_promo = promo + "_" + tp;

    // if he is not admin then return
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      await interaction.reply(
        "Tu n'as malheuresement pas les persmissions pour utiliser cette commande. Si tu penses que tu devrais les avoir, renverse le pouvoir en place. Non je déconne, demande à un admin de faire le boulot à ta place."
      );
      return;
    }

    // if the link is not valid then return
    if (isValidInteger(parseInt(code)) === false) {
      await interaction.reply(
        "Le code que tu as rentré n'est pas valide beau gosse d'admin. Si tu penses que t'as raison, viens te battre en 1v1 contre le dev qu'on rigole un peu. Non je rigole, en fait faut juste mettre un nombre valide."
      );
      return;
    }

    // we look if the promo exists in the database
    const promoExists = await prisma.calendarUrl.count({
      where: {
        promo: complete_promo,
      },
    });

    if (promoExists === 0) {
      // if it doesn't exist then we create it
      await prisma.calendarUrl.create({
        data: {
          promo: complete_promo,
          code: parseInt(code),
          updatedAt: new Date(),
        },
      });
    } else {
      // if it exists then we update it
      await prisma.calendarUrl.update({
        where: {
          promo: complete_promo,
        },
        data: {
          code: parseInt(code),
        },
      });
    }

    await interaction.reply(
      `${interaction.user.username}, le lien pour la promo *${complete_promo}* a été mis à jour avec succès.`
    );
  },
};
