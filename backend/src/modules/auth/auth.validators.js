import { validateSchema, z } from '../../utils/validation.js';

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Email must be valid').transform((value) => value.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

const loginSchema = z.object({
  email: z.string().trim().email('Email must be valid').transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

export const authValidators = {
  validateRegister(input) {
    return validateSchema(registerSchema, input, 'Invalid register payload');
  },

  validateLogin(input) {
    return validateSchema(loginSchema, input, 'Invalid login payload');
  },
};
