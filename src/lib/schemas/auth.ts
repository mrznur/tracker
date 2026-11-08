import { z } from 'zod';

/**
 * Login form schema — used on the login page (client) and the credentials
 * provider authorizer (server) so validation is identical on both sides.
 */
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

/**
 * Change-password schema — shared between the change-password form (client)
 * and the changePasswordAction server action.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });
