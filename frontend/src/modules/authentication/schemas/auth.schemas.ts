import { z } from 'zod'
import { emailField } from '@/shared/validation/common'
import { strongPassword } from '@/shared/validation/password'

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required.'),
  remember: z.boolean(),
})
export type LoginFormValues = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: emailField,
})
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

const confirmed = <T extends { password: string; password_confirmation: string }>(data: T) =>
  data.password === data.password_confirmation

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'The reset link is invalid or incomplete.'),
    email: emailField,
    password: strongPassword,
    password_confirmation: z.string().min(1, 'Please confirm your password.'),
  })
  .refine(confirmed, { message: 'Passwords do not match.', path: ['password_confirmation'] })
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required.'),
    password: strongPassword,
    password_confirmation: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine(confirmed, { message: 'Passwords do not match.', path: ['password_confirmation'] })
  .refine((d) => d.password !== d.current_password, {
    message: 'New password must be different from the current one.',
    path: ['password'],
  })
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
