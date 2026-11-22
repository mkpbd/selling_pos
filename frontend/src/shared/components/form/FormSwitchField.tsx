import type { ReactNode } from 'react'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '@/shared/components/ui/field'
import { Switch } from '@/shared/components/ui/switch'

interface FormSwitchFieldProps<TIn extends FieldValues, TCtx, TOut extends FieldValues> {
  control: Control<TIn, TCtx, TOut>
  name: Path<TIn>
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}

export function FormSwitchField<TIn extends FieldValues, TCtx, TOut extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
}: FormSwitchFieldProps<TIn, TCtx, TOut>) {
  const id = `field-${String(name).replace(/\./g, '-')}`
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          orientation="horizontal"
          data-invalid={fieldState.invalid || undefined}
          className="rounded-lg border bg-muted/30 p-3"
        >
          <FieldContent>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError errors={[fieldState.error]} />
          </FieldContent>
          <Switch
            id={id}
            checked={Boolean(field.value)}
            onCheckedChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            disabled={disabled}
            aria-invalid={fieldState.invalid || undefined}
          />
        </Field>
      )}
    />
  )
}
