const express = require('express');
const {forgotPassword, updatePassword} = require("../controllers/userControllers");
const {rateLimit} = require('express-rate-limit');
const {validateForgotPassword, validateResetPassword} = require('../utils/validation');


const router = express.Router();
const rateLimiter = rateLimit({
    windowMs: 60*60*1000,
    limit: 3,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: JSON.stringify({message: "Too many requests, please try again later."})
});

router.get("/email/:email", rateLimiter, async (req, res) => {
    try
    {
        let result = validateForgotPassword(req.params);
        if(result.error)
        {
            res.status(400).json(result.error.details[0].message);
            return;
        }
        let response = await forgotPassword(req.params.email);
        res.status(200).json(response);
    }
    catch(error)
    {
        res.status(500).json({});
    }
});

router.post("/",async (req, res) => {
    try
    {
        let result = validateResetPassword(req.body);
        if(result.error)
        {
            res.status(400).json(result.error.details[0].message);
            return;
        }
        await updatePassword(res, req.body.email, req.body.password, req.body.otp);
    }
    catch(error)
    {
        res.status(500).json({});
    }
});


module.exports = router;