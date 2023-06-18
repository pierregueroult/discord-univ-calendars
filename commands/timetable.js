const { SlashCommandBuilder } = require("discord.js");
const promoParams = require("../utils/promoParams");
const groupParams = require("../utils/groupParams");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const sortEvents = require("../utils/sortEvents");
const sleep = require("../utils/sleep");
const createFileFromUrl = require("../utils/createFileFromUrl");
const getEventsFromFile = require("../utils/getEventsFromFile");
const getWeekNumber = require("../utils/getWeekNumber");
const generateImage = require("../utils/generateImage");

process.removeAllListeners("warning");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timetable")
    .setDescription(
      "Utilise cette commande pour récupérer ton emploi du temps de la semaine."
    )
    .addStringOption((option) =>
      option
        .setName("promo")
        .setDescription("Choisis ta promo")
        .setRequired(true)
        .addChoices(...promoParams)
    )
    .addStringOption((option) =>
      option
        .setName("tp")
        .setDescription("Choisis ton TP")
        .setRequired(true)
        .addChoices(...groupParams)
    ),
  async execute(interaction) {
    // extract promo and tp from command
    await interaction.deferReply();

    // define complete promo
    const complete_promo =
      interaction.options.getString("promo") +
      "_" +
      interaction.options.getString("tp");
    const now = new Date();

    // get code from database
    const codeData = await prisma.calendarUrl.findUnique({
      where: {
        promo: complete_promo,
      },
      select: {
        code: true,
        updatedAt: true,
      },
    });

    // if code is not found
    if (!codeData) {
      await interaction.editReply(
        "**🚨 [ERREUR] :** Le code de cet emploi du temps n'a pas été mis à jour ! Demande à un admin de faire la commande '/rebind' pour ajouter ou mettre à jour le code."
      );
      return;
    }

    const now2 = new Date();
    const updateDate = new Date(codeData.updatedAt);

    // if code is not updated since 3 hours
    if (now2.getTime() - updateDate.getTime() > 10800000) {
      // we initialize all the variables we need
      const code = codeData.code;
      const project_id = 0;

      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const startYear = currentMonth < 6 ? currentYear - 1 : currentYear;
      const endYear = currentMonth < 6 ? currentYear : currentYear + 1;

      const url = `https://adecampus.univ-rouen.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=${code}&projectId=${project_id}&startDay=1&startMonth=09&startYear=${startYear}&endDay=30&endMonth=6&endYear=${endYear}&calType=ical`;

      createFileFromUrl(url, "./calendars/", complete_promo, ".ics");

      await prisma.calendarUrl.update({
        where: {
          promo: complete_promo,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      await interaction.editReply(
        `**📆 [EMPLOI DU TEMPS] :** L'emploi du temps a été mis à jour avec succés ! Chargement des données en cours ...`
      );
    } else {
      await interaction.editReply(
        `**📆 [EMPLOI DU TEMPS] :** Chargement des données en cours ...`
      );
    }

    await sleep(2000);

    const events = getEventsFromFile(`./calendars/${complete_promo}.ics`);

    const weekEvents = events.filter(
      (event) =>
        getWeekNumber(event.start) === getWeekNumber(now) &&
        event.start.getFullYear() === now.getFullYear()
    );

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

    const lastUpdate = codeData.updatedAt.toLocaleString().replace(" ", " à ");

    await interaction.followUp({
      content: `**📆 [EMPLOI DU TEMPS] :** \n\n (${complete_promo
        .split("_")
        .join("")
        .toUpperCase()}, Mis à jour le ${lastUpdate})`,
      files: [await generateImage(sortedWeekEvents)],
    });
  },
};
