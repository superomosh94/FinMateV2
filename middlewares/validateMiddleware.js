const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }

    req.flash('error', errorMessages[0]);
    return res.redirect('back');
  }

  next();
};

const validate = (validations) => {
  return async (req, res, next) => {
    console.log("Validate middleware started");
    await Promise.all(validations.map(validation => validation.run(req)));
    console.log("Validation finished");
    handleValidationErrors(req, res, next);
  };
};

module.exports = {
  handleValidationErrors,
  validate
};
