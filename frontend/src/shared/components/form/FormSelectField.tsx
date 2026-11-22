import type { ReactNode } from 'react'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

export interface SelectOption {
  value: string
  label: ReactNode
  disabled?: boolean
}

const NONE = '__none__'

interface FormSelectFieldProps<TIn extends FieldValues, TCtx, TOut extends FieldValues> {
  control: Control<TIn, TCtx, TOut>
  name: Path<TIn>
  label: ReactNode
  options: SelectOption[]
  placeholder?: string
  /** Adds an explicit "none" option mapped to `null`. */
  noneLabel?: string
  description?: ReactNode
  required?: boolean
  disabled?: boolean
  loading?: boolean
}

/** shadcn Select wired to react-hook-form (string | null values). */
export function FormSelectField<TIn extends FieldValues, TCtx, TOut extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = 'Select…',
  noneLabel,
  description,
  required,
  disabled,
  loading,
}: FormSelectFieldProps<TIn, TCtx, TOut>) {
  const id = `field-${String(name).replace(/\./g, '-')}`
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const raw = typeof field.value === 'string' && field.value ? field.value : null
        return (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor={id}>
              {label}
              {required && (
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              )}
            </FieldLabel>
            <Select
              value={raw ?? (noneLabel ? NONE : '')}
              onValueChange={(v) => field.onChange(v === NONE ? null : v)}
              disabled={disabled || loading}
            >
              <SelectTrigger
                id={id}
                ref={field.ref}
                onBlur={field.onBlur}
                className="w-full"
                aria-invalid={fieldState.invalid || undefined}
                aria-describedby={fieldState.error ? `${id}-error` : undefined}
              >
                <SelectValue placeholder={loading ? 'Loading…' : placeholder} />
              </SelectTrigger>
              <SelectContent>
                {noneLabel && <SelectItem value={NONE}>{noneLabel}</SelectItem>}
                {options.map((o) => (
                  <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError id={`${id}-error`} errors={[fieldState.error]} />
          </Field>
        )
      }}
    />
  )
}
