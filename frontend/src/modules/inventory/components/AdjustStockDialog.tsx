import { useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { ArrowRight, ClipboardCheck, LoaderCircle, Minus, Plus } from 'lucide-react'
import { FormAlert } from '@/shared/components/FormAlert'
import { FormSelectField } from '@/shared/components/form/FormSelectField'
import { FormTextField } from '@/shared/components/form/FormTextField'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { FieldError, FieldGroup, FieldLegend, FieldSet } from '@/shared/components/ui/field'
import { ERROR_CODES } from '@/shared/constants/error-codes'
import { normalizeError } from '@/shared/services/http'
import { cn } from '@/shared/utils/cn'
import {
  addDecimal,
  formatQuantity,
  formatSignedQuantity,
  isDecimalString,
  normalizeDecimal,
  QUANTITY_SCALE,
  subtractDecimal,
} from '@/shared/utils/decimal'
import { applyServerErrors } from '@/shared/utils/form-errors'
import { uuid } from '@/shared/utils/id'
import { ADJUSTMENT_TYPE_META, REASON_LABELS } from '../constants'
import { useAdjustStock } from '../hooks/useInventory'
import {
  createAdjustmentSchema,
  REASONS_BY_TYPE,
  type AdjustmentFormOutput,
  type AdjustmentFormValues,
} from '../schemas/adjustment.schema'
import { ADJUSTMENT_TYPES, type AdjustmentInput, type AdjustmentType, type StockItem } from '../types'

interface AdjustStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: StockItem | null
  defaultType?: AdjustmentType
}

export function AdjustStockDialog({ open, onOpenChange, item, defaultType = 'in' }: AdjustStockDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && item && (
          <AdjustStockForm key={item.product_id} item={item} defaultType={defaultType} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

const TYPE_ICONS: Record<AdjustmentType, typeof Plus> = { in: Plus, out: Minus, count: ClipboardCheck }

/** Resulting on-hand quantity for a valid input, else null. */
function previewQuantity(current: string, type: AdjustmentType, quantity: string): string | null {
  if (!quantity.trim() || !isDecimalString(quantity, QUANTITY_SCALE)) return null
  if (type === 'in') return addDecimal(current, quantity)
  if (type === 'out') return subtractDecimal(current, quantity)
  return normalizeDecimal(quantity, QUANTITY_SCALE)
}

function AdjustStockForm({ item, defaultType, onDone }: { item: StockItem; defaultType: AdjustmentType; onDone: () => void }) {
  const adjust = useAdjustStock()
  const [formErrors, setFormErrors] = useState<string[]>([])
  /**
   * One idempotency key per submission. A retry of the *same* payload (after a
   * network error, 5xx, or "in progress") reuses the key so the server applies
   * the adjustment at most once; any change to the payload gets a fresh key.
   */
  const attempt = useRef<{ key: string; fingerprint: string } | null>(null)
  const allowsDecimal = item.unit.allows_decimal
  const schema = useMemo(() => createAdjustmentSchema(allowsDecimal), [allowsDecimal])

  const form = useForm<AdjustmentFormValues, unknown, AdjustmentFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { type: defaultType, quantity: '', reason: REASONS_BY_TYPE[defaultType][0], note: '' },
  })
  const [type, quantity] = useWatch({ control: form.control, name: ['type', 'quantity'] })
  const next = previewQuantity(item.quantity, type, quantity)
  const delta = next !== null ? subtractDecimal(next, item.quantity) : null
  const negative = next !== null && next.startsWith('-')
  const unit = item.unit.code

  const submit = async (values: AdjustmentFormOutput) => {
    setFormErrors([])
    const input: AdjustmentInput = { product_id: item.product_id, ...values }
    const fingerprint = JSON.stringify(input)
    if (!attempt.current || attempt.current.fingerprint !== fingerprint) {
      attempt.current = { key: uuid(), fingerprint }
    }

    try {
      const result = await adjust.mutateAsync({ input, idempotencyKey: attempt.current.key })
      attempt.current = null
      toast.success(`${item.name}: now ${formatQuantity(result.stock.quantity)} ${unit}.`)
      onDone()
    } catch (error) {
      const e = normalizeError(error)
      switch (e.code) {
        case ERROR_CODES.INSUFFICIENT_STOCK: {
          const available = e.fieldError('available') ?? item.quantity
          form.setError('quantity', {
            type: 'server',
            message: `Not enough stock. Only ${formatQuantity(available)} ${unit} available.`,
          })
          return
        }
        case ERROR_CODES.NO_STOCK_CHANGE:
          form.setError('quantity', { type: 'server', message: 'The counted quantity equals current stock. Nothing to record.' })
          return
        case ERROR_CODES.PRODUCT_NOT_STOCKABLE:
          setFormErrors(['This product is inactive or does not track stock, so it cannot be adjusted.'])
          return
        case ERROR_CODES.IDEMPOTENCY_IN_PROGRESS:
          setFormErrors(['The previous attempt is still being processed. Wait a moment, then submit again.'])
          return
        case ERROR_CODES.IDEMPOTENCY_KEY_REUSED:
          attempt.current = null
          setFormErrors(['This submission changed while it was being retried. Please submit again.'])
          return
        default:
          setFormErrors(
            applyServerErrors(e, form.setError, { fields: ['type', 'quantity', 'reason', 'note'] }).unmatched.map((m) =>
              e.status === 0 ? `${m} Your adjustment was not lost: submit again to retry safely.` : m,
            ),
          )
      }
    }
  }

  const pending = form.formState.isSubmitting

  return (
    <>
      <DialogHeader>
        <DialogTitle>Adjust stock</DialogTitle>
        <DialogDescription>
          <span className="font-medium text-foreground">{item.name}</span> · <span className="font-mono">{item.sku}</span> · On hand{' '}
          <span className="font-semibold text-foreground tabular-nums">
            {formatQuantity(item.quantity)} {unit}
          </span>
        </DialogDescription>
      </DialogHeader>

      <form
        id="adjust-stock-form"
        // handleSubmit runs inside the event handler: the submit closure reads the idempotency ref.
        onSubmit={(event) => void form.handleSubmit(submit)(event)}
        noValidate className="space-y-4">
        <FormAlert messages={formErrors} />
        <FieldGroup className="gap-4">
          <Controller
            control={form.control}
            name="type"
            render={({ field, fieldState }) => (
              <FieldSet>
                <FieldLegend variant="label">Adjustment type</FieldLegend>
                <div role="radiogroup" aria-label="Adjustment type" className="grid gap-2 sm:grid-cols-3">
                  {ADJUSTMENT_TYPES.map((t) => {
                    const Icon = TYPE_ICONS[t]
                    const checked = field.value === t
                    return (
                      <label
                        key={t}
                        className={cn(
                          'flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-left transition-all has-focus-visible:ring-2 has-focus-visible:ring-ring',
                          checked ? 'border-primary bg-primary/5 shadow-xs' : 'hover:bg-muted/50',
                        )}
                      >
                        <input
                          type="radio"
                          name={field.name}
                          value={t}
                          checked={checked}
                          onChange={() => {
                            field.onChange(t)
                            const reason = form.getValues('reason')
                            if (!REASONS_BY_TYPE[t].includes(reason)) form.setValue('reason', REASONS_BY_TYPE[t][0])
                            form.clearErrors('quantity')
                          }}
                          className="sr-only"
                        />
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <Icon className={cn('size-4', checked ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
                          {ADJUSTMENT_TYPE_META[t].label}
                        </span>
                        <span className="text-xs text-muted-foreground">{ADJUSTMENT_TYPE_META[t].hint}</span>
                      </label>
                    )
                  })}
                </div>
                <FieldError errors={[fieldState.error]} />
              </FieldSet>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField
              control={form.control}
              name="quantity"
              label={type === 'count' ? 'Counted quantity' : 'Quantity'}
              type="number"
              inputMode={allowsDecimal ? 'decimal' : 'numeric'}
              step={allowsDecimal ? '0.001' : '1'}
              min="0"
              required
              autoFocus
              endAddon={unit}
              description={allowsDecimal ? 'Up to 3 decimals.' : 'Whole numbers only.'}
            />
            <FormSelectField
              control={form.control}
              name="reason"
              label="Reason"
              required
              options={REASONS_BY_TYPE[type].map((r) => ({ value: r, label: REASON_LABELS[r] }))}
            />
          </div>

          <div
            aria-live="polite"
            className={cn(
              'flex items-center justify-between gap-3 rounded-xl border px-4 py-3',
              negative ? 'border-destructive/40 bg-destructive/5' : 'bg-muted/40',
            )}
          >
            <span className="text-xs font-medium text-muted-foreground">Preview</span>
            <span className="flex items-center gap-2 text-sm tabular-nums">
              <span>{formatQuantity(item.quantity)}</span>
              <ArrowRight className="size-4 text-muted-foreground" aria-label="becomes" />
              <span className={cn('text-base font-bold', negative && 'text-destructive')}>
                {next !== null ? formatQuantity(next) : '—'}
              </span>
              <span className="text-xs text-muted-foreground">{unit}</span>
              {delta !== null && (
                <span className={cn('text-xs font-medium', delta.startsWith('-') ? 'text-destructive' : 'text-success')}>
                  ({formatSignedQuantity(delta)})
                </span>
              )}
            </span>
          </div>
          {negative && <p className="-mt-2 text-xs text-destructive">This would take stock below zero.</p>}

          <FormTextField control={form.control} name="note" label="Note" type="textarea" maxLength={500} placeholder="Optional: delivery ref, who counted…" />
        </FieldGroup>
      </form>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={pending}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" form="adjust-stock-form" disabled={pending} aria-busy={pending}>
          {pending && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
          Save adjustment
        </Button>
      </DialogFooter>
    </>
  )
}
