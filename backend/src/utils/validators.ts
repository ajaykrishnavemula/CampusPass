/**
 * Input validation schemas using Joi
 */

import Joi from 'joi';

// ============================================
// Authentication Schemas
// ============================================

export const loginSchema = Joi.object({
  id: Joi.string()
    .required()
    .min(3)
    .max(50)
    .trim()
    .messages({
      'string.empty': 'ID is required',
      'string.min': 'ID must be at least 3 characters',
      'string.max': 'ID cannot exceed 50 characters',
      'any.required': 'ID is required',
    }),
  password: Joi.string()
    .required()
    .min(6)
    .max(100)
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
      'string.max': 'Password cannot exceed 100 characters',
      'any.required': 'Password is required',
    }),
});

// ============================================
// Permit Schemas
// ============================================

export const createPermitSchema = Joi.object({
  id: Joi.string()
    .required()
    .trim()
    .messages({
      'string.empty': 'Student ID is required',
      'any.required': 'Student ID is required',
    }),
  name: Joi.string()
    .required()
    .min(2)
    .max(100)
    .trim()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required',
    }),
  phoneNumber: Joi.string()
    .required()
    .pattern(/^[0-9]{10}$/)
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Phone number must be exactly 10 digits',
      'any.required': 'Phone number is required',
    }),
  outTime: Joi.date()
    .required()
    .iso()
    .messages({
      'date.base': 'Out time must be a valid date',
      'date.format': 'Out time must be in ISO 8601 format',
      'any.required': 'Out time is required',
    }),
  inTime: Joi.date()
    .required()
    .iso()
    .greater(Joi.ref('outTime'))
    .messages({
      'date.base': 'In time must be a valid date',
      'date.format': 'In time must be in ISO 8601 format',
      'date.greater': 'In time must be after out time',
      'any.required': 'In time is required',
    }),
  purpose: Joi.number()
    .required()
    .integer()
    .min(0)
    .max(5)
    .messages({
      'number.base': 'Purpose must be a number',
      'number.integer': 'Purpose must be an integer',
      'number.min': 'Purpose must be between 0 and 5',
      'number.max': 'Purpose must be between 0 and 5',
      'any.required': 'Purpose is required',
    }),
  hostel: Joi.string()
    .required()
    .valid('h1', 'h2', 'h3', 'h4')
    .messages({
      'string.empty': 'Hostel is required',
      'any.only': 'Hostel must be one of: h1, h2, h3, h4',
      'any.required': 'Hostel is required',
    }),
});

export const updatePermitSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters',
    }),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .messages({
      'string.pattern.base': 'Phone number must be exactly 10 digits',
    }),
  outTime: Joi.date()
    .iso()
    .messages({
      'date.base': 'Out time must be a valid date',
      'date.format': 'Out time must be in ISO 8601 format',
    }),
  inTime: Joi.date()
    .iso()
    .messages({
      'date.base': 'In time must be a valid date',
      'date.format': 'In time must be in ISO 8601 format',
    }),
  purpose: Joi.number()
    .integer()
    .min(0)
    .max(5)
    .messages({
      'number.base': 'Purpose must be a number',
      'number.integer': 'Purpose must be an integer',
      'number.min': 'Purpose must be between 0 and 5',
      'number.max': 'Purpose must be between 0 and 5',
    }),
  hostel: Joi.string()
    .valid('h1', 'h2', 'h3', 'h4')
    .messages({
      'any.only': 'Hostel must be one of: h1, h2, h3, h4',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export const verifyPermitSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({
      'string.empty': 'Permit ID is required',
      'any.required': 'Permit ID is required',
    }),
  type: Joi.number()
    .required()
    .integer()
    .valid(0, 1)
    .messages({
      'number.base': 'Type must be a number',
      'any.only': 'Type must be 0 (out) or 1 (in)',
      'any.required': 'Type is required',
    }),
  inApprovedBy: Joi.string()
    .when('type', {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'any.required': 'In approved by is required when type is 1',
    }),
  outApprovedBy: Joi.string()
    .when('type', {
      is: 0,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'any.required': 'Out approved by is required when type is 0',
    }),
});

// ============================================
// Student Management Schemas
// ============================================

export const remarkSchema = Joi.object({
  id: Joi.string()
    .required()
    .trim()
    .messages({
      'string.empty': 'Student ID is required',
      'any.required': 'Student ID is required',
    }),
});

export const setStatusSchema = Joi.object({
  id: Joi.array()
    .items(Joi.string().trim())
    .required()
    .min(1)
    .messages({
      'array.base': 'ID must be an array',
      'array.min': 'At least one student ID is required',
      'any.required': 'Student IDs are required',
    }),
  status: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'Status must be a boolean',
      'any.required': 'Status is required',
    }),
});

export const outgoingStudentsSchema = Joi.object({
  date: Joi.date()
    .required()
    .iso()
    .messages({
      'date.base': 'Date must be a valid date',
      'date.format': 'Date must be in ISO 8601 format',
      'any.required': 'Date is required',
    }),
  hostel: Joi.string()
    .optional()
    .valid('h1', 'h2', 'h3', 'h4')
    .messages({
      'any.only': 'Hostel must be one of: h1, h2, h3, h4',
    }),
});

// ============================================
// ID Parameter Schemas
// ============================================

export const idParamSchema = Joi.object({
  id: Joi.string()
    .required()
    .trim()
    .messages({
      'string.empty': 'ID parameter is required',
      'any.required': 'ID parameter is required',
    }),
});

export const hostelParamSchema = Joi.object({
  hostel: Joi.string()
    .required()
    .valid('h1', 'h2', 'h3', 'h4')
    .messages({
      'string.empty': 'Hostel parameter is required',
      'any.only': 'Hostel must be one of: h1, h2, h3, h4',
      'any.required': 'Hostel parameter is required',
    }),
});

// ============================================
// Validation Middleware Factory
// ============================================

/**
 * Creates a validation middleware for Fastify routes
 * @param schema - Joi schema to validate against
 * @param source - Source of data to validate ('body', 'params', 'query')
 * @returns Fastify preHandler middleware
 */
export const validate = (
  schema: Joi.ObjectSchema,
  source: 'body' | 'params' | 'query' = 'body'
) => {
  return async (request: any, reply: any) => {
    try {
      const dataToValidate = request[source];
      
      const validated = await schema.validateAsync(dataToValidate, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      
      // Replace the original data with validated data
      request[source] = validated;
    } catch (error: any) {
      const errors = error.details?.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      reply.code(400).send({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: errors || [{ message: error.message }],
      });
    }
  };
};

// ============================================
// Custom Validation Functions
// ============================================

/**
 * Validates if a date is in the future
 */
export const isFutureDate = (value: Date, helpers: any) => {
  if (value <= new Date()) {
    return helpers.error('date.future');
  }
  return value;
};

/**
 * Validates if a date is within a specific range
 */
export const isWithinDateRange = (
  value: Date,
  helpers: any,
  maxDays: number = 30
) => {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + maxDays);
  
  if (value > maxDate) {
    return helpers.error('date.maxRange', { maxDays });
  }
  return value;
};

// ============================================
// Validation Error Handler
// ============================================

/**
 * Formats Joi validation errors into a user-friendly format
 */
export const formatValidationError = (error: Joi.ValidationError) => {
  return {
    error: 'Validation Error',
    message: 'Invalid request data',
    details: error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type,
      value: detail.context?.value,
    })),
  };
};

// ============================================
// Export all schemas
// ============================================

export default {
  // Authentication
  loginSchema,
  
  // Permits
  createPermitSchema,
  updatePermitSchema,
  verifyPermitSchema,
  
  // Student Management
  remarkSchema,
  setStatusSchema,
  outgoingStudentsSchema,
  
  // Parameters
  idParamSchema,
  hostelParamSchema,
  
  // Middleware
  validate,
  
  // Utilities
  formatValidationError,
  isFutureDate,
  isWithinDateRange,
};
