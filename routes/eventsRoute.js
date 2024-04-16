const express = require("express");
const {getEventsByUser, getEventsByOwner, getEventsByEventId, addEvent, updateEvent, deleteEvent, getEventsByTimeSlots} = require('../controllers/eventController');

const route = express.Router();

route.get("/owner/:ownerId", getEventsByOwner());

route.get("/user/:date", getEventsByUser());

route.get("/month/:eventId/:month", getEventsByEventId());

route.get("/:eventId", getEventsByEventId());

route.get("/timeSlots/:eventId/:date", getEventsByTimeSlots());

route.post("/", addEvent());

route.put("/", updateEvent());

route.delete("/", deleteEvent());

module.exports = route;
