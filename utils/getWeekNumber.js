function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = Math.floor(
    (date - firstDayOfYear) / (24 * 60 * 60 * 1000)
  );
  return Math.ceil(pastDaysOfYear / 7);
}

module.exports = getWeekNumber;
