const dynamodb = require("../database/connection");
const {
  generateID,
  toCheckTimePresentBetweenTwoTimeSlots,
} = require("../utils/index");
const { validateEvent } = require("../utils/validation");
const moment = require("moment");

var params = {
  TableName: "Events",
  KeySchema: [
    {
      AttributeName: "id",
      KeyType: "HASH",
    },
    {
      AttributeName: "ownerId",
      KeyType: "RANGE",
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: "id",
      AttributeType: "S",
    },
    {
      AttributeName: "ownerId",
      AttributeType: "S",
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
};

function getEventsByUser() {
  return async (req, res) => {
    try {
      let FilterExpression = `endDate >= :value1`;
      let ExpressionAttributeValues = {
        ":value1": Number(req.params.date),
      };
      const response = await dynamodb.scanItems(
        "Events",
        FilterExpression,
        ExpressionAttributeValues,
        "id, ownerId, eventName, startDate, endDate, selectWeek, slotDuration"
      );
      if (response.length === 0) {
        res.json([]);
        return;
      }
      res.status(200).json(response);
    } catch (error) {
      console.error("Error adding item:", error);
      res.status(500).json([]);
    }
  };
}

function getEventsByOwner() {
  return async (req, res) => {
    try {
      let FilterExpression = `ownerId = :value1`;
      let ExpressionAttributeValues = {
        ":value1": req.params.ownerId,
      };
      await dynamodb.createTableIfNotExists("Events", params);
      const response = await dynamodb.scanItems(
        "Events",
        FilterExpression,
        ExpressionAttributeValues,
        
      );
      res.status(200).json(response);
    } catch (error) {
      console.error("Error adding item:", error);
      res.status(500).json({});
    }
  };
}

function getEventsByEventId() {
  return async (req, res) => {
    try {
      let response = await dynamodb.queryItems(
        "Events",
        "id = :value",
        { ":value": req.params.eventId },
        "id, eventName, startDate, endDate, selectWeek, slotDuration"
      );
      if (response.length === 0) {
        res.status(400).json({});
        return;
      }
      if (!req.params.month) {
        res.status(200).json(response[0]);
        return;
      } else {
        let dates = getTheDatesOfEvents(response[0], req.params.month);
        res.status(200).json(dates);
      }
    } catch (error) {
      console.error("Error getting item:", error);
      res.status(500).json({});
    }
  };
}
function getEventsByTimeSlots() {
  return async (req, res) => {
    try {
      let KeyConditionExpression = "id = :value";
      let ExpressionAttributeValues = {
        ":value": req.params.eventId,
      };
      let response = await dynamodb.queryItems(
        "Events",
        KeyConditionExpression,
        ExpressionAttributeValues,
        "startDate, endDate, selectWeek, slotDuration"
      );
      let day = moment(Number(req.params.date)).format("ddd").toLowerCase();
      let timeSlots = [];
      if (
        moment(Number(req.params.date)).isBefore(
          moment(response[0].startDate)
        ) ||
        moment(Number(req.params.date)).isAfter(moment(response[0].endDate)) ||
        !response[0].selectWeek[day]
      ) {
        res.status(200).json([]);
        return;
      }
      let timings = response[0].selectWeek[day];
      let startTime = moment(timings.startTime, "HH:mm");
      let endTime = moment(timings.endTime, "HH:mm");
      let slotDuration = moment.duration(response[0].slotDuration);
      let currentSlot = moment(startTime);
      while (currentSlot.isSameOrBefore(endTime)) {
        let hourAhead = moment(currentSlot).add(slotDuration).format("HH:mm");
        if (hourAhead > endTime.format("HH:mm")) {
          break;
        }
        let temp = `${currentSlot.format("HH:mm")}-${hourAhead}`;
        if (
          !toCheckTimePresentBetweenTwoTimeSlots(
            currentSlot.format("HH:mm"),
            currentSlot.add(slotDuration).format("HH:mm"),
            `${timings.breakStart}-${timings.breakEnd}`
          )
        ) {
          timeSlots.push(temp);
        }
      }
      let { getAppointmentByEventsAndDate } =
        await require("./appointmentController");
      getAppointmentByEventsAndDate(req.params.eventId, req.params.date).then(
        (appointments) => {
          if (appointments.length > 0) {
            appointments.forEach((item) => {
              timeSlots = timeSlots.filter((slot) => {
                return slot !== item.timeSlot;
              });
            });
          }
          res.status(200).json(timeSlots);
        }
      );
    } catch (error) {
      console.error("Error getting item:", error);
      res.status(500).json([]);
    }
  };
}

function addEvent() {
  return async (req, res) => {
    try {
      let validate = validateEvent(req.body);
      let present = false;
      if (validate.error) {
        res.status(400).json(validate.error.details[0].message);
        return;
      }
      let event = req.body;
      event.id = generateID();
      let coveredMonths = ``;
      let flag = false;
      let currentDay = moment(req.body.startDate);
      let result = await toCalculateMonthsCovered(
        req,
        res,
        coveredMonths,
        flag,
        currentDay
      );
      if (!result) {
        return;
      }
      coveredMonths = result;
      event.coveredMonths = coveredMonths;
      event.createdAt = moment().unix();
      if (await dynamodb.createTableIfNotExists("Events", params)) {
        let response = await dynamodb.addItem("Events", event);
        res.status(200).json({});
        return;
      }
      if (!present) {
        let response = await dynamodb.addItem("Events", event);
        res.status(200).json(req.body.id);
      } else {
        res
          .status(400)
          .json("Availability already exists for the given date and time");
        return;
      }
    } catch (error) {
      console.error("Error adding item:", error);
      res.status(500).json({});
    }
  };
}

function updateEvent() {
  return async (req, res) => {
    try {
      let present = false;
      let { id, ownerId, ...data } = req.body;
      let key = { id: id, ownerId: ownerId };
      var coveredMonths = ``;
      let flag = false;
      let currentDay = moment(req.body.startDate);
      let result = await toCalculateMonthsCovered(
        req,
        res,
        coveredMonths,
        flag,
        currentDay
      );
      if (result.length === 0) {
        return;
      }
      coveredMonths = result;
      flag = result.flag;
      data.coveredMonths = coveredMonths;
      data.updatedAt = moment().unix();
      let response = await dynamodb.updateItem(
        "Events",
        key,
        data,
        "attribute_exists(id) AND attribute_exists(ownerId)"
      );
      res.status(200).json({});
      return;
    } catch (error) {
      console.error("Error adding item:", error);
      res.status(500).json({});
    }
  };
}

function deleteEvent() {
  return async (req, res) => {
    try {
      let response = await dynamodb.scanItems("Appointments", "eventId = :value", { ":value": req.body.id }, "eventId");
      console.log(response);
      if(response.length > 0) {
        res.status(400).json("Event is associated with appointments");
        return;
      }
      await dynamodb.deleteItem("Events", {
        id: req.body.id,
        ownerId: req.body.ownerId,
      });
      res.status(200).json({});
    } catch (error) {
      console.error("Error adding item:", error);
      res.status(500).json({});
    }
  };
}

async function toCalculateMonthsCovered(
  req,
  res,
  coveredMonths,
  flag,
  currentDay
) {
  while (currentDay.isSameOrBefore(moment(req.body.endDate))) {
    if (!coveredMonths.includes(currentDay.format("YYYY-MM"))) {
      coveredMonths += `${currentDay.format("YYYY-MM")},`;
    }
    if (
      flag ||
      req.body.selectWeek.hasOwnProperty(currentDay.format("ddd").toLowerCase())
    ) {
      flag = true;
    }
    currentDay.add(1, "days");
  }
  if (!flag) {
    res.status(400).json("Days can't be selected for the given week range");
    return;
  }
  return coveredMonths;
}


async function getEventsByIdAndOwner(id, ownerId) {
  let keyConditionExpression = `id = :value1 AND ownerId = :value2`;
  let ExpressionAttributeValues = {
    ":value1": id,
    ":value2": ownerId,
  };
  return await dynamodb.queryItems(
    "Events",
    keyConditionExpression,
    ExpressionAttributeValues,
    "startDate, endDate, selectWeek, slotDuration, ownerId"
  );
}
function getTheDatesOfEvents(Event, Month) {
  let dates = [];
  let startDate = moment(Event.startDate);
  let endDate = moment(Event.endDate);
  while (startDate.isSameOrBefore(endDate)) {
    if (
      startDate.format("YYYY-MM") === Month &&
      Event.selectWeek.hasOwnProperty(startDate.format("ddd").toLowerCase())
    ) {
      dates.push(startDate.format("YYYY-MM-DD"));
    }
    startDate.add(1, "days");
  }
  return dates;
}
module.exports = {
  getEventsByUser,
  getEventsByOwner,
  getEventsByEventId,
  addEvent,
  updateEvent,
  deleteEvent,
  getEventsByTimeSlots,
  getEventsByIdAndOwner,
};