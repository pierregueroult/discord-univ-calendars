const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const createFileFromUrl = require("../utils/createFileFromUrl");
const sleep = require("../utils/sleep");
const getEventsFromFile = require("../utils/getEventsFromFile");
const getWeekNumber = require("../utils/getWeekNumber");
const generateImage = require("../utils/generateImage");
const sortEvents = require("../utils/sortEvents");

process.removeAllListeners("warning");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timetable")
    .setDescription(
      "Utilise cette commande pour récupérer ton emploi du temps de la semaine."
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
        .addIntegerOption((option) =>
          option.setName("semaine").setDescription("Choisis la semaine")
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
        .addIntegerOption((option) =>
          option.setName("semaine").setDescription("Choisis la semaine")
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

    const weekNumber =
      typeof interaction.options.getInteger("semaine") === "number"
        ? interaction.options.getInteger("semaine")
        : getWeekNumber(now);

    const weekEvents = events.filter((event) => {
      return (
        getWeekNumber(event.start) === weekNumber &&
        event.start.getFullYear() === now.getFullYear()
      );
    });

    const separatedWeekEvents = [];

    for (let i = 0; i < 5; i++) {
      separatedWeekEvents.push(
        weekEvents.filter((event) => {
          return event.start.getDay() === i + 1;
        })
      );
    }

    const sortedWeekEvents = separatedWeekEvents.map((dayEvents) => {
      return sortEvents(dayEvents);
    });

    sortedWeekEvents.map((dayEvents) => {
      for (let i = 0; i < dayEvents.length; i++) {
        if (dayEvents[i].title.startsWith("Rentrée")) {
          dayEvents.splice(i, 1);
        }
      }
    });

    const lastUpdate = codeData.updatedAt.toLocaleString().replace(" ", " à ");

    await interaction.editReply(
      "**🕹️ [INFO] :** Succés de la commande, passez une bonne journée :)"
    );

    await interaction.followUp({
      content: `**📆 [EMPLOI DU TEMPS] :** \n\n (${completePromo
        .split("_")
        .join("")
        .toUpperCase()}, Mis à jour le ${lastUpdate})`,
      files: [await generateImage(sortedWeekEvents)],
    });
    return;
  },
};
