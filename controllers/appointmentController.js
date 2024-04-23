const dynamodb = require("../database/connection");
const {
  week,
  generateID,
  toCheckTimePresentBetweenTwoTimeSlots,
} = require("../utils/index");
const { validateAppointment } = require("../utils/validation");
const moment = require("moment");

var params = {
  TableName: "Appointments",
  KeySchema: [
    {
      AttributeName: "appointmentDate",
      KeyType: "HASH",
    },
    {
      AttributeName: "appointmentId",
      KeyType: "RANGE",
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: "appointmentDate",
      AttributeType: "N",
    },
    {
      AttributeName: "appointmentId",
      AttributeType: "S",
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
};

/*
Get the appointments by date for the particular user
date is passed as params in route in milliseconds
*/
function getAppointmentByDate() {
  return async (req, res) => {
    try {
      let KeyConditionExpression = `appointmentDate = :date`;
      let FilterExpression = `contains(combinedIds, :value)`;
      let ExpressionAttributeValues = {
        ":value": req.params.userId,
        ":date": Number(req.params.date),
      };
      let response = await dynamodb.queryItems(
        "Appointments",
        KeyConditionExpression,
        ExpressionAttributeValues,
        "appointmentId, eventId, timeSlot, personName, personPhone, ownerId, eventName",
        FilterExpression
      );
      res.status(200).json(response);
    } catch (error) {
      console.error("Error getting item:", error);
      res.status(500).json({});
    }
  };
}
/**
Get the appointments by events and date
@param {string} id - event id 
@param {string} appointmentDate - appointment date in milliseconds
**/
async function getAppointmentByEventsAndDate(id, appointmentDate) {
  try {
    let KeyConditionExpression = `appointmentDate = :date`;
    let FilterExpression = `contains(combinedIds, :value)`;
    let ExpressionAttributeValues = {
      ":value": id,
      ":date": Number(appointmentDate),
    };
    let response = await dynamodb.queryItems(
      "Appointments",
      KeyConditionExpression,
      ExpressionAttributeValues,
      "timeSlot",
      FilterExpression
    );
    if (response.length === 0) {
      return {};
    } else {
      return response;
    }
  } catch (error) {
    console.error("Error getting item:", error);
    return {};
  }
}
/*
Add the appointment for the particular event for user
*/
function addAppointment() {
  return async (req, res) => {
    try {
      if (!(await validateAppointmentDetails(req, res))) {
        return;
      }
      let appointment = req.body;
      appointment.appointmentId = generateID();
      await dynamodb.createTableIfNotExists("Appointments", params);
      appointment.combinedIds = `${req.body.eventId},${req.body.userId},${req.body.ownerId}`;
      delete appointment.userId;
      appointment.createdAt = moment().unix();
      await dynamodb.addItem("Appointments", appointment);
      res.status(200).json({});
    } catch (error) {
      console.error("Error adding item:", error);
      res.status(500).json({});
    }
  };
}
/*
Update the appointment for the particular event for user
*/
function updateAppointment() {
  return async (req, res) => {
    try {
      if (!(await validateAppointmentDetails(req, res))) {
        return;
      }
      let { appointmentId, appointmentDate, ...data } = req.body;
      delete data.userId;
      delete data.eventId;
      data.updatedAt = moment().unix();
      await dynamodb.updateItem(
        "Appointments",
        {
          appointmentDate: appointmentDate,
          appointmentId: appointmentId
        },
        data,
        "attribute_exists(appointmentId)"
      );
      res.status(200).json({});
    } catch (error) {
      console.error("Error updating item:", error);
      res.status(500).json({});
    }
  };
}
/*
Delete the appointment for the particular event for user
*/
function deleteAppointment() {
  return async (req, res) => {
    try {
      await dynamodb.deleteItem("Appointments", {
        appointmentDate: Number(req.body.date),
        appointmentId: req.body.appointmentId,
      });
      res
        .status(200)
        .json({ message: "Item deleted successfully", data: req.body.id });
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({});
    }
  };
}
/**
 * To validate the appointment details
 * @param {object} req request object
 * @param {object} res response object
 * @returns {boolean} true if valid, false if invalid
 */
async function validateAppointmentDetails(req, res) {
  let validate = validateAppointment(req.body);
  if (validate.error) {
    res.status(400).json(validate.error.details[0].message);
    return false;
  }
  const { getEventsByIdAndOwner } = require("./eventController");
  let eventDetails = await getEventsByIdAndOwner(
    req.body.eventId,
    req.body.ownerId
  );
  if (eventDetails.length === 0) {
    res.status(404).json("Event not exists");
    return false;
  }
  if (
    !(
      moment(req.body.appointmentDate).isSameOrAfter(
        moment(eventDetails[0].startDate)
      ) &&
      moment(req.body.appointmentDate).isSameOrBefore(
        moment(eventDetails[0].endDate)
      )
    )
  ) {
    res.status(400).json("Appointment date is not in event date range");
    return;
  }
  let day =
    eventDetails[0].selectWeek[
      week[new Date(req.body.appointmentDate).getDay()]
    ];
  let currentEventTime = req.body.timeSlot.split("-");
  if (day) {
    if (
      !toCheckTimePresentBetweenTwoTimeSlots(
        day.startTime,
        day.endTime,
        `${currentEventTime[0]}-${currentEventTime[1]}`
      )
    ) {
      res.status(400).json("Appointment time is not in event time");
      return;
    }
    if (
      moment
        .duration(
          moment(currentEventTime[1], "HH:mm").diff(
            moment(currentEventTime[0], "HH:mm")
          )
        )
        .asMilliseconds() !==
      moment
        .duration(
          moment(eventDetails[0].slotDuration, "HH:mm").diff(
            moment("00:00", "HH:mm")
          )
        )
        .asMilliseconds()
    ) {
      res
        .status(400)
        .json(
          "Duration of appointment time is not equal to event time slot duration"
        );
      return;
    }
    if (eventDetails[0].ownerId !== req.body.ownerId) {
      res
        .status(400)
        .json("Owner of event and owner of appointment are different");
      return;
    }
  } else {
    res.status(400).json("Event not exists");
    return;
  }
  return true;
}
module.exports = {
  getAppointmentByDate,
  addAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentByEventsAndDate,
};
