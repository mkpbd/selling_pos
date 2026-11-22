import type { HTMLInputTypeAttribute, ReactNode } from 'react'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { PasswordInput } from '../PasswordInput'

interface FormTextFieldProps<TIn extends FieldValues, TCtx, TOut extends FieldValues> {
  control: Control<TIn, TCtx, TOut>
  name: Path<TIn>
  label: ReactNode
  description?: ReactNode
  type?: HTMLInputTypeAttribute | 'password-toggle' | 'textarea'
  placeholder?: string
  autoComplete?: string
  autoFocus?: boolean
  disabled?: boolean
  required?: boolean
  maxLength?: number
  className?: string
  inputClassName?: string
  /** Transform the raw input before storing (e.g. uppercase). */
  transform?: (value: string) => string
  labelAction?: ReactNode
}

/** Label + input + description + error, wired to react-hook-form with accessible ids. */
export function FormTextField<TIn extends FieldValues, TCtx, TOut extends FieldValues>({
  control,
  name,
  label,
  description,
  type = 'text',
  placeholder,
  autoComplete,
  autoFocus,
  disabled,
  required,
  maxLength,
  className,
  inputClassName,
  transform,
  labelAction,
}: FormTextFieldProps<TIn, TCtx, TOut>) {
  const id = `field-${String(name).replace(/\./g, '-')}`
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const describedBy =
          [description ? `${id}-description` : null, fieldState.error ? `${id}-error` : null].filter(Boolean).join(' ') ||
          undefined
        const common = {
          id,
          name: field.name,
          value: field.value == null ? '' : String(field.value),
          onBlur: field.onBlur,
          ref: field.ref,
          placeholder,
          autoComplete,
          autoFocus,
          disabled: disabled ?? field.disabled,
          maxLength,
          required,
          'aria-invalid': fieldState.invalid || undefined,
          'aria-describedby': describedBy,
          className: inputClassName,
        }
        const onChange = (value: string) => field.onChange(transform ? transform(value) : value)

        return (
          <Field data-invalid={fieldState.invalid || undefined} className={className}>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel htmlFor={id}>
                {label}
                {required && (
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                )}
              </FieldLabel>
              {labelAction}
            </div>
            {type === 'textarea' ? (
              <Textarea {...common} onChange={(e) => onChange(e.target.value)} />
            ) : type === 'password-toggle' ? (
              <PasswordInput {...common} onChange={(e) => onChange(e.target.value)} />
            ) : (
              <Input {...common} type={type} onChange={(e) => onChange(e.target.value)} />
            )}
            {description && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
            <FieldError id={`${id}-error`} errors={[fieldState.error]} />
          </Field>
        )
      }}
    />
  )
}
