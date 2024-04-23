const jwt = require('jsonwebtoken');
const process = require('process');

/**
 * Create a sign for the user
 * @param {object} user - user object
 * @returns {string} token
 */
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

/**
 * Verify the sign for the user
 * @param {string} token - token
 * @returns {object} user
 */
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