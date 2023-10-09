const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createFileFromUrl = require("../utils/createFileFromUrl");

const sleep = require("../utils/sleep");

const getEventsFromFile = require("../utils/getEventsFromFile");

const getWeekNumber = require("../utils/getWeekNumber");

const hslToHex = require("../utils/hslToHex");

const sortEvents = require("../utils/sortEvents");

process.removeAllListeners("warning");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ds")
    .setDescription(
      "Utilise cette commande pour afficher les prochains DSs dans ton emploi du temps"
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("mmi")
        .setDescription("La commande pour les MMI")
        .addStringOption((option) =>
          option
            .setName("année")
            .setDescription("Choisis ton année")
            .setRequired(true)
            .addChoices(
              {
                name: "1ère",
                value: "mmi1",
              },
              {
                name: "2ème",
                value: "mmi2",
              },
              {
                name: "3ème",
                value: "mmi3",
              }
            )
        )
        .addStringOption((option) =>
          option
            .setName("groupe")
            .setDescription("Choisis ton groupe")
            .setRequired(true)
            .addChoices(
              {
                name: "TP 1",
                value: "tp1",
              },
              {
                name: "TP 2",
                value: "tp2",
              },
              {
                name: "TP 3",
                value: "tp3",
              },
              {
                name: "TP 4",
                value: "tp4",
              },
              {
                name: "TP 5",
                value: "tp5",
              },
              {
                name: "TP 6",
                value: "tp6",
              }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rt")
        .setDescription("La commande pour les RT")
        .addStringOption((option) =>
          option
            .setName("année")
            .setDescription("Choisis ton année")
            .setRequired(true)
            .addChoices(
              {
                name: "1ère",
                value: "rt1",
              },
              {
                name: "2ème",
                value: "rt2",
              },
              {
                name: "3ème",
                value: "rt3",
              }
            )
        )
        .addStringOption((option) =>
          option
            .setName("groupe")
            .setDescription("Choisis ton groupe")
            .setRequired(true)
            .addChoices(
              {
                name: "TP A",
                value: "tpa",
              },
              {
                name: "TP B",
                value: "tpc",
              },
              {
                name: "TP C",
                value: "tpc",
              },
              {
                name: "TP D",
                value: "tpd",
              }
            )
        )
        .addBooleanOption((option) =>
          option
            .setName("alternance")
            .setDescription("Choisis si tu es en alternance")
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
  async execute(interaction) {
    await interaction.deferReply();

    var completePromo;

    if (interaction.options.getSubcommand() === "mmi") {
      completePromo = `${interaction.options.getString(
        "année"
      )}_${interaction.options.getString("groupe")}`;
    }

    if (interaction.options.getSubcommand() === "rt") {
      completePromo = `${interaction.options.getString(
        "année"
      )}_${interaction.options.getString("groupe")}_${
        interaction.options.getBoolean("alternance") ? "fa" : "fc"
      }`;
    }

    const now = new Date();

    const codeData = await prisma.calendarUrl.findUnique({
      where: {
        promo: completePromo,
      },
      select: {
        code: true,
        updatedAt: true,
      },
    });

    if (!codeData) {
      await interaction.editReply(
        `**🚨 [ERREUR] :** Désolé, cette emploi du temps est un DLC, il est payant. Nan je déconne c'est juste qu'il existe pas, si tu penses qu'il devrait hésite pas à contacter un développeur ou un admin (transmet lui ça ${completePromo}). :)`
      );
      return;
    }

    const updateDate = new Date(codeData.updatedAt);

    if (now.getTime() - updateDate.getTime() > 10800000) {
      await interaction.editReply(
        "**📅 [INFO] :** Mise à jour de l'emploi du temps ... "
      );
      // s'il n'est pas à jour depuis plus de 3h on le met à jour
      const code = codeData.code;
      const project_id = 0;
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const startYear = currentMonth < 6 ? currentYear - 1 : currentYear;
      const endYear = currentMonth < 6 ? currentYear : currentYear + 1;

      const url = `https://adecampus.univ-rouen.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=${code}&projectId=${project_id}&startDay=1&startMonth=09&startYear=${startYear}&endDay=30&endMonth=6&endYear=${endYear}&calType=ical`;

      createFileFromUrl(url, "./calendars/", completePromo, ".ics");

      await prisma.calendarUrl.update({
        where: {
          promo: completePromo,
        },
        data: {
          updatedAt: now,
        },
      });
    }

    await sleep(2000);

    const events = getEventsFromFile(`./calendars/${completePromo}.ics`);

    var dss = events.filter(
      (event) =>
        (event.title.includes("DS") || event.title.includes("Examen")) &&
        event.start > now
    );

    dss = sortEvents(dss);

    var embeds = [];

    for (var i = 0; i < dss.length; i++) {
      var teacher = dss[i].description
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

      var numInString = dss[i].title.match(/\d+/g);
      var color = "";

      if (numInString != null) {
        color = hslToHex(numInString.join("") * 30, 100, 65);
      } else {
        color = "#000000";
      }

      var weekNumber = getWeekNumber(dss[i].start);

      var date = dss[i].start;

      embeds.push(
        new EmbedBuilder()
          .setTitle(dss[i].title)
          .setDescription(teacher)
          .setFooter({
            text: `Semaine ${weekNumber} - ${date.toLocaleDateString(
              "fr-FR"
            )} - ${date.toLocaleTimeString("fr-FR")}`,
          })
          .setColor(color)
      );
    }

    if (embeds.length == 0) {
      embeds.push(new EmbedBuilder().setTitle("Aucun DS trouvé"));
    }
    if (embeds.length > 5) {
      embeds = embeds.slice(0, 5);
    }

    await interaction.followUp({
      content: "**🚨 [DS] :** Voici les prochains 5 examens :",
      embeds: embeds,
    });

    return;
  },
};
