import type { HTMLAttributes, HTMLInputTypeAttribute, ReactNode } from 'react'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/shared/components/ui/input-group'
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
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  step?: string | number
  min?: string | number
  /** Short text shown inside the input on the right (e.g. "%", "PCS"). */
  endAddon?: ReactNode
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
  inputMode,
  step,
  min,
  endAddon,
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
          inputMode,
          'aria-invalid': fieldState.invalid || undefined,
          'aria-describedby': describedBy,
          className: inputClassName,
        }
        const onChange = (value: string) => field.onChange(transform ? transform(value) : value)

        let inputEl: ReactNode
        if (type === 'textarea') {
          inputEl = <Textarea {...common} onChange={(e) => onChange(e.target.value)} />
        } else if (type === 'password-toggle') {
          inputEl = <PasswordInput {...common} onChange={(e) => onChange(e.target.value)} />
        } else if (endAddon) {
          inputEl = (
            <InputGroup>
              <InputGroupInput {...common} type={type} step={step} min={min} onChange={(e) => onChange(e.target.value)} />
              <InputGroupAddon align="inline-end">
                <InputGroupText>{endAddon}</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          )
        } else {
          inputEl = <Input {...common} type={type} step={step} min={min} onChange={(e) => onChange(e.target.value)} />
        }

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
            {inputEl}
            {description && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
            <FieldError id={`${id}-error`} errors={[fieldState.error]} />
          </Field>
        )
      }}
    />
  )
}
