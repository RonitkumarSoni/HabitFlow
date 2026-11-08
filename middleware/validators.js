const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Middleware to evaluate express-validator results
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      message: formattedErrors.map(e => e.message).join('. '),
      errors: formattedErrors
    });
  }
  next();
};

/**
 * Validates MongoDB ObjectId param
 */
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .custom(value => mongoose.Types.ObjectId.isValid(value))
    .withMessage(`Invalid ID format for parameter: ${paramName}`),
  handleValidationErrors
];

/**
 * Validation rules for user registration
 */
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Validation rules for creating a habit
 */
const validateCreateHabit = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('icon')
    .optional()
    .trim(),
  body('color')
    .optional()
    .trim(),
  body('frequency')
    .optional()
    .isIn(['daily'])
    .withMessage('Frequency must be "daily"'),
  body('reminderTime')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Reminder time must be in HH:mm 24-hour format (e.g. "08:30")'),
  handleValidationErrors
];

/**
 * Validation rules for updating a habit
 */
const validateUpdateHabit = [
  param('id')
    .custom(value => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid habit ID format'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('icon')
    .optional()
    .trim(),
  body('color')
    .optional()
    .trim(),
  body('frequency')
    .optional()
    .isIn(['daily'])
    .withMessage('Frequency must be "daily"'),
  body('reminderTime')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Reminder time must be in HH:mm 24-hour format (e.g. "08:30")'),
  body('isArchived')
    .optional()
    .isBoolean()
    .withMessage('isArchived must be a boolean'),
  handleValidationErrors
];

/**
 * Validation rules for toggling a check-in
 */
const validateToggleCheckIn = [
  param('id')
    .custom(value => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid habit ID format'),
  body('date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  handleValidationErrors
];

/**
 * Validation rules for check-ins query range
 */
const validateCheckInQuery = [
  param('id')
    .custom(value => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid habit ID format'),
  query('from')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('from query parameter must be in YYYY-MM-DD format'),
  query('to')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('to query parameter must be in YYYY-MM-DD format'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateObjectId,
  validateRegister,
  validateLogin,
  validateCreateHabit,
  validateUpdateHabit,
  validateToggleCheckIn,
  validateCheckInQuery
};

