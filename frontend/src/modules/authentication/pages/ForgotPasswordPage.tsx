import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, LoaderCircle, MailCheck, Send } from 'lucide-react'
import { FormAlert } from '@/shared/components/FormAlert'
import { FormTextField } from '@/shared/components/form/FormTextField'
import { Button } from '@/shared/components/ui/button'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { applyServerErrors } from '@/shared/utils/form-errors'
import { AuthCard } from '../components/AuthCard'
import { useForgotPassword } from '../hooks/useAuthMutations'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas/auth.schemas'

const GENERIC_MESSAGE = 'If an account exists for that email, a password reset link is on its way.'

export function ForgotPasswordPage() {
  useDocumentTitle('Forgot password')
  const forgot = useForgotPassword()
  const [sentMessage, setSentMessage] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<string[]>([])
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setFormErrors([])
    try {
      const message = await forgot.mutateAsync(values)
      setSentMessage(message ?? GENERIC_MESSAGE)
    } catch (error) {
      setFormErrors(applyServerErrors(error, form.setError, { fields: ['email'] }).unmatched)
    }
  })

  const backLink = (
    <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to sign in
    </Link>
  )

  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter the email you sign in with and we'll send you a secure reset link."
      footer={backLink}
    >
      <AnimatePresence mode="wait" initial={false}>
        {sentMessage ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border bg-success/5 p-6 text-center"
            role="status"
          >
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
              <MailCheck className="size-6" aria-hidden="true" />
            </div>
            <p className="font-medium">Check your inbox</p>
            <p className="mt-1 text-sm text-muted-foreground">{sentMessage}</p>
            <Button variant="ghost" size="sm" className="mt-4" onClick={() => setSentMessage(null)}>
              Use a different email
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            exit={{ opacity: 0 }}
            onSubmit={onSubmit}
            noValidate
            className="space-y-5"
            aria-label="Request password reset"
          >
            <FormAlert messages={formErrors} />
            <FormTextField
              control={form.control}
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              autoFocus
            />
            <Button type="submit" size="lg" className="h-10 w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <LoaderCircle className="animate-spin" data-icon="inline-start" />
              ) : (
                <Send data-icon="inline-start" />
              )}
              Send reset link
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthCard>
  )
}

export default ForgotPasswordPage
