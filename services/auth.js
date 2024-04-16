const jwt = require('jsonwebtoken');
const process = require('process');


function createSign(user)
{
    let payload = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        loginType: user.loginType,
    };
    return  jwt.sign(payload, process.env.SECRET_KEY, {expiresIn: '24h'});
}

function verifySign(token)
{
    try
    {
        return jwt.verify(token, process.env.SECRET_KEY);
    }
    catch(err)
    {
        return {error : {details: "Invalid token or expired"}};
    }
}

module.exports = {createSign, verifySign};