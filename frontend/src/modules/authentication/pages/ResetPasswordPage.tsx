import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, KeyRound, LoaderCircle } from 'lucide-react'
import { FormAlert } from '@/shared/components/FormAlert'
import { FormTextField } from '@/shared/components/form/FormTextField'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { FieldGroup } from '@/shared/components/ui/field'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { applyServerErrors } from '@/shared/utils/form-errors'
import { AuthCard } from '../components/AuthCard'
import { PasswordChecklist } from '../components/PasswordChecklist'
import { useResetPassword } from '../hooks/useAuthMutations'
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas/auth.schemas'

export function ResetPasswordPage() {
  useDocumentTitle('Reset password')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const reset = useResetPassword()
  const [formErrors, setFormErrors] = useState<string[]>([])
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, email, password: '', password_confirmation: '' },
  })
  const password = useWatch({ control: form.control, name: 'password' })

  const onSubmit = form.handleSubmit(async (values) => {
    setFormErrors([])
    try {
      const message = await reset.mutateAsync(values)
      toast.success(message ?? 'Your password has been reset. You can now sign in.')
      navigate('/login', { replace: true })
    } catch (error) {
      const { unmatched } = applyServerErrors(error, form.setError, {
        fields: ['email', 'password', 'password_confirmation'],
        rename: { token: 'email' },
      })
      setFormErrors(unmatched)
    }
  })

  return (
    <AuthCard
      title="Set a new password"
      description="Choose a strong password you haven't used before."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to sign in
        </Link>
      }
    >
      {!token ? (
        <Alert variant="destructive">
          <KeyRound />
          <AlertTitle>Invalid reset link</AlertTitle>
          <AlertDescription>
            This link is missing its token. Request a new one from the{' '}
            <Link to="/forgot-password" className="underline">
              forgot password
            </Link>{' '}
            page.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-5" aria-label="Reset password">
          <FormAlert messages={formErrors} />
          <FieldGroup className="gap-4">
            <FormTextField control={form.control} name="email" label="Email" type="email" autoComplete="email" />
            <FormTextField
              control={form.control}
              name="password"
              label="New password"
              type="password-toggle"
              autoComplete="new-password"
              autoFocus
            />
            <PasswordChecklist value={password} />
            <FormTextField
              control={form.control}
              name="password_confirmation"
              label="Confirm new password"
              type="password-toggle"
              autoComplete="new-password"
            />
          </FieldGroup>
          <Button type="submit" size="lg" className="h-10 w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
            Reset password
          </Button>
        </form>
      )}
    </AuthCard>
  )
}

export default ResetPasswordPage
