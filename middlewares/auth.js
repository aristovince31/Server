const { createSign, verifySign } = require("../services/auth");

/**
 * Middleware to check if the user is logged in
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
async function loggedInUser(req, res, next) {
    if (req.cookies && req.cookies.uuid){
      let user = await verifySign(req.cookies.uuid);
      if (user) {
        delete user.iat;
        delete user.exp;
        req.user = user;
      }
      else
      {
        res.status(400).json({});
      }
    }
    next();
}
/**
 * Middleware to restrict access to certain roles
 * @param {Array} authorizedRoles - Roles that are authorized to access the route
 */
function restrictAccess(authorizedRoles) {
  return (req, res, next) => {
    if (!authorizedRoles.includes(req.user.loginType)) {
      res.status(403).json({});
      return;
    }
    next(req, res, next);
  };
}

module.exports = loggedInUser;
