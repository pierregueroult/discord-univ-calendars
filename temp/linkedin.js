const {
  SlashCommandBuilder,
  userMention,
  EmbedBuilder,
} = require("discord.js");
const { PrismaClient } = require("@prisma/client");
const generateRandomColor = require("../utils/generateRandomColor");

const prisma = new PrismaClient();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("linkedin")
    .setDescription(
      "Enregistre ton compte linkedIn ou visualise ceux des membres du serveur"
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ajouter")
        .setDescription("Ajoute ton compte linkedIn")
        .addStringOption((option) =>
          option
            .setName("lien")
            .setDescription("Ajoute ici le lien de ton compte linkedIn")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("voir")
        .setDescription("Voir les comptes linkedIn des membres du serveur")
        .addUserOption((option) =>
          option
            .setName("membre")
            .setDescription(
              "A remplir si tu veux voir le compte linkedIn d'un membre en particulier"
            )
            .setRequired(false)
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "ajouter":
        addLinkedIn();
        break;
      case "voir":
        interaction.options.getUser("membre")
          ? viewMemberLinkedIn()
          : viewAllLinkedIn();
        break;
    }

    async function addLinkedIn() {
      const linkedIn = interaction.options.getString("lien");
      if (!linkedIn) {
        await interaction.reply({
          content: "Tu n'as pas renseigné de lien linkedIn :(",
          ephemeral: true,
        });
        return;
      }
      if (!linkedIn.startsWith("https://www.linkedin.com/in/")) {
        await interaction.reply({
          content: "Le lien que tu as renseigné n'est pas valide :(",
          ephemeral: true,
        });
        return;
      }
      const username = interaction.user.username;

      const isExisting = await prisma.linkedInUrl.count({
        where: {
          user: username,
        },
      });

      if (isExisting === 0) {
        await prisma.linkedInUrl.create({
          data: {
            user: username,
            link: linkedIn,
          },
        });
        await interaction.reply({
          content: `${username}, ton compte [linkedIn](${linkedIn}) a bien été enregistré`,
          ephemeral: false,
        });
      } else {
        await prisma.linkedInUrl.update({
          where: {
            user: username,
          },
          data: {
            link: linkedIn,
          },
        });
        await interaction.reply({
          content: `${username}, ton compte [linkedIn](${linkedIn}) a bien été mis à jour`,
          ephemeral: false,
        });
      }
    }

    async function viewMemberLinkedIn() {
      const member = interaction.options.getUser("membre");
      const username = member.username;

      if (!member) {
        await interaction.reply({
          content: "Le membre que tu as renseigné n'est pas valide 😒",
          ephemeral: true,
        });
        return;
      }

      if (member.bot) {
        await interaction.reply({
          content: "A quoi bon vouloir le linkedIn d'un bot ? 🤔",
          ephemeral: true,
        });
        return;
      }

      const linkedIn = await prisma.linkedInUrl.findUnique({
        where: {
          user: username,
        },
      });

      if (!linkedIn) {
        await interaction.reply({
          content: `${username} n'a pas renseigné de compte linkedIn, dommage pour lui/elle 😢`,
          ephemeral: true,
        });
        return;
      }

      const linkedInUsername = linkedIn.link.split("/")[4];

      await interaction.reply({
        // prettier-ignore
        content: `Voici le compte linkedIn de ${userMention(member.id)} (${member.username}) : [${linkedInUsername}](${linkedIn.link})`,
        ephemeral: false,
      });
    }

    async function viewAllLinkedIn() {
      const linkedInList = await prisma.linkedInUrl.count();

      if (linkedInList === 0) {
        await interaction.reply({
          content:
            "Personne n'a encore renseigné de compte linkedIn, bizarre non ? 🤔",
          ephemeral: true,
        });
        return;
      }

      const linkedIn = await prisma.linkedInUrl.findMany({
        select: {
          user: true,
          link: true,
        },
        take: 15,
        skip: 0,
      });

      var rows = [
        "## Liste des comptes linkedIn :",
        "Rappel : Pour ajouter ton compte linkedIn, utilise la commande `/linkedin ajouter`",
        "\n",
      ];
      var embeds = [];

      linkedIn.forEach(({ user, link }) => {
        const linkedInUsername = link.split("/")[4];

        // we look for the user in the guild cache and store it in a variable

        const member = interaction.guild.members.cache.find(
          (member) => member.user.username === user
        );

        if (!member) {
          return;
        }

        embeds.push(
          new EmbedBuilder()
            .setColor(member.user.accentColor || generateRandomColor())
            .setAuthor({
              name: member.user.username,
              iconURL: member.user.avatarURL(),
            })
            .setTitle(linkedInUsername)
            .setURL(link)
        );
      });

      await interaction.reply({
        content: rows.join("\n"),
        ephemeral: false,
        embeds: embeds,
      });
    }
  },
};
