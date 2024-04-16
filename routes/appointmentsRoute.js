const express = require('express');
const {getAppointmentByDate, addAppointment, updateAppointment, deleteAppointment, getAppointmentByMonth} = require('../controllers/appointmentController');

const route = express.Router();


route.get("/date/:userId/:date", getAppointmentByDate());

//route.get("/month/:eventId/:month", getAppointmentByMonth());

route.post("/", addAppointment());

route.put("/", updateAppointment());

route.delete("/", deleteAppointment());


module.exports = route;