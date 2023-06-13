const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const promoParams = require("../utils/promoParams");
const groupParams = require("../utils/groupParams");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const https = require("node:https");
const Ical = require("ical.js");
const fs = require("node:fs");

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
    const promo = interaction.options.getString("promo");
    const tp = interaction.options.getString("tp");
    await interaction.deferReply();

    const complete_promo = promo + "_" + tp;

    const codeData = await prisma.calendarUrl.findUnique({
      where: {
        promo: complete_promo,
      },
      select: {
        code: true,
      },
    });

    if (
      codeData === null ||
      codeData === undefined ||
      codeData.code === null ||
      codeData.code === undefined
    ) {
      await interaction.editReply(
        "**🚨 [ERREUR] :** Le code de cet emploi du temps n'a pas été mis à jour ! Demande à un admin de faire la commande '/rebind' pour ajouter ou mettre à jour le code."
      );
      return;
    }

    const code = codeData.code;
    const project_id = 0;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const startYear = currentMonth < 6 ? currentYear - 1 : currentYear;
    const endYear = currentMonth < 6 ? currentYear : currentYear + 1;

    const url = `https://adecampus.univ-rouen.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=${code}&projectId=${project_id}&startDay=1&startMonth=09&startYear=${startYear}&endDay=30&endMonth=6&endYear=${endYear}&calType=ical`;

    const calendarFile = fs.createWriteStream(
      "./calendars/" + complete_promo + ".ics"
    );

    https.get(url, function (response) {
      response.pipe(calendarFile);

      calendarFile.on("error", function (err) {
        console.log(err);
        fs.unlink(complete_promo + ".ics");
      });

      calendarFile.on("finish", function () {
        calendarFile.close();
      });
    });

    async function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await interaction.editReply(
      `**📆 [EMPLOI DU TEMPS] :** L'emploi du temps a été mis à jour avec succés ! Chargement des données en cours ...`
    );

    await sleep(2000);

    // read file
    const data = fs.readFileSync(`./calendars/${complete_promo}.ics`, "utf8");

    // parse file
    const jcalData = Ical.parse(data);
    // get events
    const comp = new Ical.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");
    const events = vevents.map((vevent) => {
      const event = new Ical.Event(vevent);
      return {
        title: event.summary,
        description: event.description,
        location: event.location,
        start: event.startDate.toJSDate(),
        end: event.endDate.toJSDate(),
        uid: event.uid,
      };
    });

    const today = new Date();

    const todayEvents = events.filter((event) => {
      return (
        event.start.getDate() === today.getDate() &&
        event.start.getMonth() === today.getMonth() &&
        event.start.getFullYear() === today.getFullYear()
      );
    });

    function compareEventsByStart(a, b) {
      if (a.start < b.start) {
        return -1;
      }
      if (a.start > b.start) {
        return 1;
      }
      return 0;
    }

    todayEvents.sort(compareEventsByStart);

    const re = /(\((.*?)\))/g;
    const updateDate = re.exec(events[0].description)[2];

    // we answer our own message

    await interaction.followUp({
      content: `**📆 [EMPLOI DU TEMPS] :** ${
        todayEvents.length == 0
          ? "T'as pas cours aujourd'hui, grand chanceux va ! \n "
          : "Voici ton emploi du temps pour aujourd'hui : \n "
      }*(${updateDate}, dernière mise à jour)* \n`,
      embeds: todayEvents.map((event) => {
        return new EmbedBuilder()
          .setTitle(event.title)
          .setDescription(
            event.description.split("\n")[2] +
              " - " +
              event.description.split("\n")[3]
          )
          .setColor(Math.floor(Math.random() * 16777216))
          .addFields(
            { name: "Lieu", value: event.location, inline: true },
            {
              name: "Heure",
              value:
                event.start.getHours() +
                "h" +
                (event.start.getMinutes() > 10
                  ? event.start.getMinutes()
                  : "0" + event.start.getMinutes()) +
                " - " +
                event.end.getHours() +
                "h" +
                (event.end.getMinutes() > 10
                  ? event.end.getMinutes()
                  : "0" + event.end.getMinutes()),
              inline: true,
            },
            {
              name: "Professeur",
              value: event.description.split("\n")[4],
              inline: true,
            }
          );
      }),
    });
  },
};
