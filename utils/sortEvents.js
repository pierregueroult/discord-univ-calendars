function sortEvents(events) {
  function compareEventsByStart(a, b) {
    if (a.start < b.start) {
      return -1;
    }
    if (a.start > b.start) {
      return 1;
    }
    return 0;
  }
  events.sort(compareEventsByStart);
  return events;
}

module.exports = sortEvents;
