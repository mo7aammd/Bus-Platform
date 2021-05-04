const Joi = require('joi');

module.exports = function (filledName, id) {
    const schema = {
      filledName: Joi.objectId().required()
    };
  
    return Joi.validate(id, schema);
}