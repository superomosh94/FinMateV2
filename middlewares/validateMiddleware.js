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
function validateExpense(req, res, next) {
  const { amount, description, category } = req.body;
  
  if (!amount || !description || !category) {
    return res.render('individualUser/expenses/add', {
      title: 'Add Expense',
      user: req.user,
      currentPage: 'expenses',
      formData: req.body,
      error: 'Amount, description, and category are required fields'
    });
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return res.render('individualUser/expenses/add', {
      title: 'Add Expense',
      user: req.user,
      currentPage: 'expenses',
      formData: req.body,
      error: 'Amount must be a positive number'
    });
  }

  next();
}

module.exports = { validateExpense };

module.exports = {
  handleValidationErrors,
  validate,
  validateExpense
};

