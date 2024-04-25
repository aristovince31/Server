const dynamodb = require("../database/connection");
const {
  generateID,
  toCheckTimePresentBetweenTwoTimeSlots,
} = require("../utils/index");
const {week} = require("../utils/index")
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

/*
Get the events by date for the particular user
date is passed as params in route in milliseconds
*/
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

/*
Get the events by owner id
ownerId is passed as params in route
*/
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

/*
Get the events by event id
eventId is passed as params in route
*/
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

/*
Get the time slots for the particular event and date
eventId and date is passed as params in route
*/
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
/*
Add the event done by the owner
*/
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
      event.createdAt = moment().unix();
      if (await dynamodb.createTableIfNotExists("Events", params)) {
        await dynamodb.addItem("Events", event);
        res.status(200).json({});
        return;
      }
      if(moment(req.body.endDate).isBefore(moment(req.body.startDate)))
      {
        present = true;
      }
      currentDate = moment(req.body.startDate)
      coveredWeek = [];
      while(currentDate.isSameOrBefore(moment(req.body.endDate)))
      {
        if(!coveredWeek.includes(currentDate.day()))
        {
          coveredWeek.push(currentDate.day());
        }
        currentDate.add(1, 'days');
      }
      Object.keys(req.body.selectWeek).map((x) => week.indexOf(x)).forEach((x) => {
        if(!coveredWeek.includes(x))
        {
          present = true;
        }
      })
      if (!present) {
        await dynamodb.addItem("Events", event);
        res.status(200).json(req.body.id);
      } else {
        res
          .status(400)
          .json("Not Acceptable Data");
        return;
      }
    } catch (error) {
      console.error("Error adding item:", error);
      res.status(500).json({});
    }
  };
}
/*
Update the event done by the owner by the keys of event id and owner id
*/
function updateEvent() {
  return async (req, res) => {
    try {
      let { id, ownerId, ...data } = req.body;
      let key = { id: id, ownerId: ownerId };
      data.updatedAt = moment().unix();
      present = false;
      if(moment(req.body.endDate).isBefore(moment(req.body.startDate)))
      {
        present = true;
      }
      currentDate = moment(req.body.startDate)
      coveredWeek = [];
      while(currentDate.isSameOrBefore(moment(req.body.endDate)))
      {
        if(!coveredWeek.includes(currentDate.day()))
        {
          coveredWeek.push(currentDate.day());
        }
        currentDate.add(1, 'days');
      }
      Object.keys(req.body.selectWeek).map((x) => week.indexOf(x)).forEach((x) => {
        if(!coveredWeek.includes(x))
        {
          present = true;
        }
      })
      if(!present)
      {
        await dynamodb.updateItem(
          "Events",
          key,
          data,
          "attribute_exists(id) AND attribute_exists(ownerId)"
        );
        res.status(200).json(req.body.id);
        return;
      }
      else
      {
        res.status(400).json("Not Acceptable Data");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      res.status(500).json({});
    }
  };
}

/*
Delete the event done by the owner by the event id
*/
function deleteEvent() {
  return async (req, res) => {
    try {
      let response = await dynamodb.scanItems("Appointments", "eventId = :value", { ":value": req.body.id }, "eventId");
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

/*
Get the events by event id and owner id
*/

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