const joi = require('joi');

/**
 * Validate the user object
 * @param {object} user user object
 * @returns {boolean} true if valid, false if invalid
 */
function validateUser(user) {
    const schema = joi.object({
        firstName: joi.string().min(3).required(),
        lastName: joi.string().min(3).required(),
        email: joi.string().email().required(),
        password: joi.string().min(8).max(20).required(),
        confirmPassword : joi.string().required().valid(joi.ref('password')),
        loginType: joi.string().valid('Owner', 'User').required()
    }).unknown(false).messages({
        'any.required': '{{#label}} is required',
        'string.empty': '{{#label}} cannot be empty',
        'string.min': '{{#label}} should have a minimum length of {#limit}',
        'string.max': '{{#label}} should have a maximum length of {#limit}',
        'string.email': '{{#label}} should be a valid email',
        'string.pattern.base': '{{#label}} is not in correct format',
        'any.only': '{{#label}} does not match with password'
    });
    const result = schema.validate(user);
    return result;
}

/**
 * Validate the login object
 * @param {object} user login object
 * @returns {boolean} true if valid, false if invalid
*/
function validateLogin(user) {
    const schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(10).max(20).required(),
    }).unknown(false).messages({
        'any.required': '{{#label}} is required',
        'string.empty': '{{#label}} cannot be empty',
        'string.min': '{{#label}} should have a minimum length of {#limit}',
        'string.max': '{{#label}} should have a maximum length of {#limit}',
        'string.email': '{{#label}} should be a valid email'
    });
    const result = schema.validate(user);
    return result;
}

/**
 * Validate the event object
 * @param {object} Event event object
 * @returns {boolean} true if valid, false if invalid
*/
function validateEvent(Event) {
    const daySchema = joi.object({
        startTime: joi.string().pattern(new RegExp(/^(0?[0-9]|1[0-9]|2[0-3]):[0-5]?[0-9]$/)).required(),
        endTime: joi.string().pattern(new RegExp(/^(0?[0-9]|1[0-9]|2[0-3]):[0-5]?[0-9]$/)).when('startTime', {is: joi.exist(), then: joi.required()}),
        breakStart: joi.string().pattern(new RegExp(/^(0?[0-9]|1[0-9]|2[0-3]):[0-5]?[0-9]$/)),
        breakEnd: joi.string().pattern(new RegExp(/^(0?[0-9]|1[0-9]|2[0-3]):[0-5]?[0-9]$/)).when('breakStart', {is: joi.exist(), then: joi.required()})
    }).unknown(false).messages({
        'any.required': '{{#label}} is required',
        'string.empty': '{{#label}} cannot be empty',
        'string.pattern.base': '{{#label}} is not in correct format'
    });
    const schema = joi.object({
        ownerId : joi.string().required(),
        eventName : joi.string().required(),
        startDate : joi.date().required(),
        endDate : joi.date().required(),          
        slotDuration : joi.string().pattern(new RegExp(/^(0?[0-9]|1[0-9]|2[0-3]):[0-5]?[0-9]$/)).required(),
        selectWeek : joi.object({
            sun : daySchema,
            mon : daySchema,
            tue : daySchema,
            wed : daySchema,
            thu : daySchema,
            fri : daySchema,
            sat : daySchema
        }).unknown(false).required(),
    }).unknown(false).messages({
        'any.required': '{{#label}} is required',
        'string.empty': '{{#label}} cannot be empty',
        'string.pattern.base': '{{#label}} is not in correct format'
    });
    const result = schema.validate(Event);
    return result;
}

/**
 * Validate the appointment object
 * @param {object} appointment appointment object
 * @returns {boolean} true if valid, false if invalid
*/
function validateAppointment(appointment) {
    const schema = joi.object({
        eventId: joi.string().required(),
        userId : joi.string().required(),
        ownerId : joi.string().required(),
        appointmentDate : joi.date().required(),
        personName : joi.string().required(),
        appointmentId: joi.string(),
        eventName: joi.string(),
        personPhone : joi.string().pattern(new RegExp(/^[0-9]{10}$/)).required(),
        timeSlot : joi.string().pattern(new RegExp(/^(0?[0-9]|1[0-9]|2[0-3]):[0-5]?[0-9]-((0?[0-9]|1[0-9]|2[0-3]):[0-5]?[0-9])$/)).required()
    }).unknown(false).messages({
        'any.required': '{{#label}} is required',
        'string.empty': '{{#label}} cannot be empty',
        'string.pattern.base': '{{#label}} is not in correct format'
    });
    const result = schema.validate(appointment);
    return result;
}

/**
 * Validate the email object
 * @param {object} id email object
 * @returns {boolean} true if valid, false if invalid
*/
function validateEmail(id) {
    const schema = joi.object({
        email: joi.string().email().required(),
    }).unknown(false).messages({
        'any.required': '{{#label}} is required',
        'string.empty': '{{#label}} cannot be empty',
        'string.email': '{{#label}} should be a valid email'
    });
    const result = schema.validate(id);
    return result;
}

/**
 * Validate the forgot password object
 * @param {object} user forgot password object
 * @returns {boolean} true if valid, false if invalid
*/
function validateForgotPassword(user) {
    const schema = joi.object({
        email: joi.string().email().required(),
    }).unknown(false).messages({
        'any.required': '{{#label}} is required',
        'string.empty': '{{#label}} cannot be empty',
        'string.email': '{{#label}} should be a valid email'
    });
    const result = schema.validate(user);
    return result;
}

/**
 * Validate the reset password object
 * @param {object} user reset password object
 * @returns {boolean} true if valid, false if invalid
*/
function validateResetPassword(user) {
    const schema = joi.object({
        email : joi.string().email().required(),
        otp : joi.number().required(),
        password: joi.string().min(10).max(20).required(),
        confirmPassword : joi.string().required().valid(joi.ref('password')),
    }).unknown(false).messages({
        'any.required': '{{#label}} is required',
        'string.empty': '{{#label}} cannot be empty',
        'string.min': '{{#label}} should have a minimum length of {#limit}',
        'string.max': '{{#label}} should have a maximum length of {#limit}',
        'string.email': '{{#label}} should be a valid email',
        'string.pattern.base': '{{#label}} is not in correct format',
        'any.only': '{{#label}} does not match with password'
    });
    const result = schema.validate(user);
    return result;
}
module.exports = { validateUser, validateLogin, validateEvent, validateAppointment, validateEmail, validateForgotPassword, validateResetPassword};