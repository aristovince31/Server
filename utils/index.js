const crypto = require("crypto");
const week = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * To check whether the time is present between the two time slots using epoch time.
 * @param {string} startTime startTime in format hh:mm.
 * @param {string} endTime endTime in format hh:mm.
 * @param {string} givenTimeBreak givenTime in format hh:mm-hh-mm.
 * @returns {boolean} returns time present between the two time slots.
 */
function toCheckTimePresentBetweenTwoTimeSlots(
  startTime,
  endTime,
  givenTimeBreak
) {
  let ModStartTime =
      new Date().toLocaleDateString("en-CA", { timeZone: "UTC" }) +
      " " +
      startTime,
    ModEndTime =
      new Date().toLocaleDateString("en-CA", { timeZone: "UTC" }) +
      " " +
      endTime;
  let givenTimeArr = givenTimeBreak.split("-");
  if (Number(givenTimeArr[0].split(":")[1]) <= 9) {
    givenTimeArr[0] =
      givenTimeArr[0].split(":")[0] + ":0" + givenTimeArr[0].split(":")[1];
  }
  if (Number(givenTimeArr[1].split(":")[1]) <= 9) {
    givenTimeArr[1] =
      givenTimeArr[1].split(":")[0] + ":0" + givenTimeArr[1].split(":")[1];
  }
  let givenStartTime =
      new Date().toLocaleDateString("en-CA", { timeZone: "UTC" }) +
      " " +
      givenTimeArr[0],
    givenEndTime =
      new Date().toLocaleDateString("en-CA", { timeZone: "UTC" }) +
      " " +
      givenTimeArr[1];
  if (
    (new Date(ModStartTime).getTime() < new Date(givenStartTime).getTime() &&
      new Date(givenStartTime).getTime() < new Date(ModEndTime).getTime()) ||
    (new Date(ModStartTime).getTime() < new Date(givenEndTime).getTime() &&
      new Date(givenEndTime).getTime() < new Date(ModEndTime).getTime()) ||
    (new Date(ModStartTime).getTime() === new Date(givenStartTime).getTime() &&
      new Date(givenEndTime).getTime() === new Date(ModEndTime).getTime())
  ) {
    return true;
  }
  return false;
}

/**
 * Generate the unique id for the event.
 * @returns {string} returns the unique id for the event.
 */
function generateID() {
  return crypto.randomUUID();
}
module.exports = {
  toCheckTimePresentBetweenTwoTimeSlots,
  generateID,
  week,
  months,
};