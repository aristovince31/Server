//Module Imports
const express = require('express');
const process = require('process');
const userRoute = require('./routes/userRoute');
const availabilities = require('./routes/eventsRoute');
const appointments = require('./routes/appointmentsRoute');
const forgotPassword = require('./routes/forgotPasswordRoute');
const loggedInUser = require('./middlewares/auth');
const cookieParser = require('cookie-parser');
const {start} = require('./database/startDb');
const cors = require('cors');

const app = express();
   
start(8000);

//MiddleWare 
app.use(cors({origin: ['http://127.0.0.1:3001', 'http://127.0.0.1:5173'], credentials: true}));
app.use(cookieParser());
app.use(express.urlencoded({extended: false}));
app.use(express.json());

//Routes
app.use("/users", userRoute);
app.use("/events", availabilities);
app.use("/appointments", appointments);
app.use("/forgotPassword", forgotPassword);


//Set Listening Port to 3000
const port = process.env.port | 3000;
app.listen(port, () => {
    console.log(`Server Started at ${port}`);
})