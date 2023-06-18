const fs = require("fs");
const Ical = require("ical.js");

function getEventsFromFile(path) {
  const data = fs.readFileSync(path, "utf8");

  const jcalData = Ical.parse(data);

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

  return events;
}

module.exports = getEventsFromFile;
