const dynamodb = require("../database/connection");
const bcrypt = require("bcrypt");
const { generateID } = require("../utils/index");
const moment = require("moment");
const {validateUser, validateLogin, validateEmail} = require("../utils/validation");
let otp;

const { sendMail } = require("../services/forgotPassword");

var params = {
  TableName: "Users",
  KeySchema: [
    {
      AttributeName: "email",
      KeyType: "HASH",
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: "email",
      AttributeType: "S",
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
};

function login() {
  return async (req, res) => {
    try {
      let validate = validateLogin(req.body);
      if (validate.error) {
        res.status(400).json(validate.error.details[0].message);
        return;
      }
      let KeyConditionExpression = `email = :value`;
      let ExpressionAttributeValues = {
        ":value": req.body.email,
      };
      let response = await dynamodb.queryItems(
        "Users",
        KeyConditionExpression,
        ExpressionAttributeValues,
        "id, firstName, lastName, email, password, loginType"
      );
      if (response.length === 0) {
        res.status(404).json("User not found");
        return;
      }
      await bcrypt.compare(
        req.body.password,
        response[0].password,
        function (err, result) {
          if (err) {
            console.error("Error getting item:", err);
            res.status(500).json({});
          }
          if (result) {
            delete response[0].password;
            delete response[0].lastName;
            //res.cookie("uuid",createSign({id: response[0].id,loginType: response[0].loginType, firstName: response[0].firstName}), {httpOnly: true, secure: false, maxAge: 600000, sameSite: 'strict'});
            res.status(200).json(response[0]);
          } else {
            res.status(401).json({});
          }
        }
      );
    } catch (error) {
      console.error("Error getting item:", error);
      res.status(500).json({});
    }
  };
}

function addUser() {
  return async (req, res) => {
    try {
      console.log(req.body);
      let validate = validateUser(req.body);
      if (validate.error) {
        res.status(400).json(validate.error.details[0].message);
        return;
      }
      let KeyConditionExpression = "email = :value";
      let ExpressionAttributeValues = {
        ":value": req.body.email,
      };
      await dynamodb.createTableIfNotExists("Users", params);
      let response = await dynamodb.queryItems(
        "Users",
        KeyConditionExpression,
        ExpressionAttributeValues,
        "id"
      );
      if (response.length > 0) {
        res.status(409).json("User already exists");
        return;
      } else {
        req.body.id = generateID();
        req.body.password = await bcrypt.hash(req.body.password, 11);
        delete req.body.confirmPassword;
        req.body.createdAt = moment().unix();  
        let response = await dynamodb.addItem("Users", req.body);
        res.status(200).json({});
      }
    } catch (error) {
      console.error("Error adding item:", error);
      res.status(500).json({});
    }
  };
}

function updateUser() {
  return async (req, res) => {
    try {
      const validate = validateUser(req.body);
      if (validate.error) {
        res.status(400).json(validate.error.details[0].message);
        return;
      }
      let {email, password, ...data} = req.body;
      req.body.password = await bcrypt.hash(req.body.password, 11);
      delete req.body.confirmPassword;
      const response = await dynamodb.updateItem("Users", {email: email}, data, "attribute_exists(email)");
      res.clearCookie("uuid");
      res.status(200).json({});
    } catch (error) {
      console.error("Error updating item:", error);
      res.status(500).json({});
    }
  };
}

async function updatePassword(res, email, password, oneTimePassword) {
  try {
    if (otp !== Number(oneTimePassword)) {
      res.status(401).json("Invalid OTP");
    }
    let KeyConditionExpression = "email = :value";
    let ExpressionAttributeValues = {
      ":value": email,
    };

    let response1 = await dynamodb.queryItems(
      "Users",
      KeyConditionExpression,
      ExpressionAttributeValues,
      "id"
    );
    if (response1.length === 0) {
      res.status(404).json("User not found");
    } else {
      try {
        let hash = await bcrypt.hash(password, 11);
        await dynamodb.updateItem("Users", {email: email}, {password: hash}, 'attribute_exists(email)');
        res.status(200).json("Password Updated");
      } catch (error) {
        return res.status(500).json({});
      }
    }
  } catch (error) {
    return res.status(500).json({});
  }
}

async function forgotPassword(email) {
  try {
    let KeyConditionExpression = "email = :value";
    let ExpressionAttributeValues = {
      ":value": email,
    };
    let response = await dynamodb.queryItems(
      "Users",
      KeyConditionExpression,
      ExpressionAttributeValues,
      "id"
    );
    if (response.length === 0) {
      return "User not found";
    } else {
      otp = generateOTP();
      let response = await sendMail(email, otp);
      if (response) {
        return "OTP Sent";
      } else {
        return "Internal Server Error";
      }
    }
  } catch (error) {
    return error;
  }
}
function deleteUser() {
  return async (req, res) => {
    try {
      const validate = validateEmail(req.body);
      if (validate.error) {
        res.status(400).json(validate.error.details[0].message);
        return;
      }
      await dynamodb.deleteItem("Users", {email : req.body.email});
      res.clearCookie("uuid");
      res.status(200).json({});
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({});
    }
  };
}


function generateOTP() {
  return Math.ceil(Math.random() * 10000);
}

module.exports = {
  login,
  addUser,
  forgotPassword,
  updateUser,
  deleteUser,
  updatePassword
};