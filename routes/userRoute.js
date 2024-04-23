const express = require("express");
const {login, addUser, updateUser, deleteUser} = require('../controllers/userControllers');

const route = express.Router();


route.get("/", (req, res) => {
    if (req.user) {
        res.status(200).json(req.user); 
        return;
    }
});

route.post("/login", login());

route.post("/register", addUser());

route.put("/", updateUser());

route.delete("/", deleteUser());

module.exports = route;
