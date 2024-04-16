require('dotenv').config()
const nodemailer = require('nodemailer');
const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;

async function createTransport()
{
    const oauth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    )

    oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN
    });

    const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
            if (err) {
                reject("Failed to create access token :(");
            }
            resolve(token);
        });
    });

    const transporter = await nodemailer.createTransport({
        service: "gmail",
        auth: {
             type: "OAuth2",
             user: process.env.EMAIL,
             clientId: process.env.CLIENT_ID,
             clientSecret: process.env.CLIENT_SECRET,
             refreshToken: process.env.REFRESH_TOKEN,
             accessToken: accessToken
        }
    })

    return transporter;
}


const sendMail = async (email, token) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Password Reset',
        text: `Please use the following security code for the your account ${email}:\n\n Secret Code: ${token}\n\nIf you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake. 
        \n\nThanks,\nThe HighStyle HairStyle team`
    }
    try {
        const transporter = await createTransport();
        console.log(transporter);
        console.log(await transporter.sendMail(mailOptions));
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = {sendMail};