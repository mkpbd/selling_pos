import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { LoaderCircle, LogIn } from 'lucide-react'
import { FormAlert } from '@/shared/components/FormAlert'
import { FormTextField } from '@/shared/components/form/FormTextField'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/shared/components/ui/field'
import { applyServerErrors } from '@/shared/utils/form-errors'
import { useLogin } from '../hooks/useAuthMutations'
import { loginSchema, type LoginFormValues } from '../schemas/auth.schemas'
import type { Me } from '../types'

interface LoginFormProps {
  onSuccess?: (me: Me) => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const login = useLogin()
  const [formErrors, setFormErrors] = useState<string[]>([])
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setFormErrors([])
    try {
      const me = await login.mutateAsync(values)
      onSuccess?.(me)
    } catch (error) {
      // INVALID_CREDENTIALS / ACCOUNT_INACTIVE / TOO_MANY_REQUESTS have no field details.
      const { unmatched } = applyServerErrors(error, form.setError, { fields: ['email', 'password'] })
      setFormErrors(unmatched)
      form.resetField('password', { keepError: true })
    }
  })

  const pending = form.formState.isSubmitting

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Sign in" className="space-y-5">
      <FormAlert messages={formErrors} />
      <FieldGroup className="gap-4">
        <FormTextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="you@company.com"
          autoFocus
        />
        <FormTextField
          control={form.control}
          name="password"
          label="Password"
          type="password-toggle"
          autoComplete="current-password"
          placeholder="••••••••"
          labelAction={
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
            >
              Forgot password?
            </Link>
          }
        />
        <Controller
          control={form.control}
          name="remember"
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id="remember"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <FieldLabel htmlFor="remember" className="font-normal text-muted-foreground">
                Keep me signed in on this device
              </FieldLabel>
            </Field>
          )}
        />
      </FieldGroup>
      <Button type="submit" size="lg" className="h-10 w-full" disabled={pending} aria-busy={pending}>
        {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <LogIn data-icon="inline-start" />}
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
