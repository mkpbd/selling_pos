import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { LoaderCircle } from 'lucide-react'
import { FormAlert } from '@/shared/components/FormAlert'
import { FormSelectField, type SelectOption } from '@/shared/components/form/FormSelectField'
import { FormSwitchField } from '@/shared/components/form/FormSwitchField'
import { FormTextField } from '@/shared/components/form/FormTextField'
import { Button } from '@/shared/components/ui/button'
import { FieldDescription, FieldLegend, FieldSet } from '@/shared/components/ui/field'
import { Separator } from '@/shared/components/ui/separator'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { ERROR_CODES } from '@/shared/constants/error-codes'
import { applyServerErrors } from '@/shared/utils/form-errors'
import { useCategories, useUnits } from '../hooks/useCatalog'
import { useCreateProduct, useUpdateProduct } from '../hooks/useProducts'
import {
  PRODUCT_FORM_FIELDS,
  productSchema,
  productToFormValues,
  type ProductFormOutput,
  type ProductFormValues,
} from '../schemas/product.schema'
import type { Product } from '../types'
import { MarginPreview } from './MarginPreview'

interface ProductFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
}

export function ProductFormSheet({ open, onOpenChange, product }: ProductFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-2xl">
        {open && <ProductForm key={product?.id ?? 'new'} product={product} onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  )
}

const money = { inputMode: 'decimal' as const, placeholder: '0.00' }

function ProductForm({ product, onDone }: { product?: Product | null; onDone: () => void }) {
  const isEdit = Boolean(product)
  const categories = useCategories()
  const units = useUnits()
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const [formErrors, setFormErrors] = useState<string[]>([])

  const form = useForm<ProductFormValues, unknown, ProductFormOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: productToFormValues(product),
  })
  const [cost, selling, tax] = useWatch({ control: form.control, name: ['cost_price', 'selling_price', 'tax_rate'] })

  // Active categories, plus the product's current one even if it has since been deactivated.
  const categoryOptions = useMemo<SelectOption[]>(() => {
    const list = categories.data ?? []
    const options: SelectOption[] = list.filter((c) => c.is_active).map((c) => ({ value: c.id, label: c.name }))
    const current = product?.category
    if (current && !options.some((o) => o.value === current.id)) {
      options.unshift({ value: current.id, label: `${current.name} (inactive)` })
    }
    return options
  }, [categories.data, product?.category])

  const unitOptions = useMemo<SelectOption[]>(
    () =>
      (units.data ?? []).map((u) => ({
        value: u.id,
        label: (
          <span>
            <span className="font-mono font-semibold">{u.code}</span> · {u.name}
            {u.allows_decimal && <span className="text-muted-foreground"> (decimal)</span>}
          </span>
        ),
      })),
    [units.data],
  )

  const onSubmit = form.handleSubmit(async (input) => {
    setFormErrors([])
    try {
      const saved = product ? await update.mutateAsync({ id: product.id, input }) : await create.mutateAsync(input)
      toast.success(isEdit ? `${saved.name} updated.` : `${saved.name} created.`)
      onDone()
    } catch (error) {
      setFormErrors(
        applyServerErrors(error, form.setError, {
          fields: PRODUCT_FORM_FIELDS,
          codeFields: { [ERROR_CODES.SKU_TAKEN]: 'sku', [ERROR_CODES.BARCODE_TAKEN]: 'barcode' },
        }).unmatched,
      )
    }
  })

  const pending = form.formState.isSubmitting

  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle>{isEdit ? `Edit ${product?.name}` : 'New product'}</SheetTitle>
        <SheetDescription>
          {isEdit ? 'Update catalogue details and pricing. Deactivate instead of deleting.' : 'Add an item you sell or stock.'}
        </SheetDescription>
      </SheetHeader>

      <form id="product-form" onSubmit={onSubmit} noValidate className="flex-1 space-y-6 overflow-y-auto p-4">
        <FormAlert messages={formErrors} />

        <FieldSet>
          <FieldLegend variant="label">Details</FieldLegend>
          <FormTextField control={form.control} name="name" label="Name" required maxLength={150} autoFocus={!isEdit} placeholder="Coca-Cola 500ml" />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField
              control={form.control}
              name="sku"
              label="SKU"
              required
              maxLength={40}
              placeholder="COKE-500"
              transform={(v) => v.toUpperCase()}
              inputClassName="font-mono uppercase"
              description="Letters, numbers, . _ -"
            />
            <FormTextField
              control={form.control}
              name="barcode"
              label="Barcode"
              maxLength={64}
              placeholder="8901234567890"
              inputMode="text"
              inputClassName="font-mono"
              description="Optional. Scan or type it."
            />
          </div>
          <FormTextField control={form.control} name="description" label="Description" type="textarea" maxLength={2000} />
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLegend variant="label">Classification</FieldLegend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelectField
              control={form.control}
              name="category_id"
              label="Category"
              options={categoryOptions}
              noneLabel="Uncategorised"
              loading={categories.isPending}
            />
            <FormSelectField
              control={form.control}
              name="unit_id"
              label="Unit"
              required
              options={unitOptions}
              placeholder="Select a unit"
              loading={units.isPending}
              description="Decimal units (e.g. KG) allow fractional stock."
            />
          </div>
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLegend variant="label">Pricing</FieldLegend>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormTextField control={form.control} name="cost_price" label="Cost price" required {...money} />
            <FormTextField control={form.control} name="selling_price" label="Selling price" required {...money} />
            <FormTextField control={form.control} name="tax_rate" label="Tax rate" inputMode="decimal" placeholder="0" endAddon="%" />
          </div>
          <MarginPreview cost={cost} selling={selling} tax={tax} />
          <FieldDescription>Prices are stored with 2 decimals. Margin = (selling − cost) ÷ selling.</FieldDescription>
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLegend variant="label">Settings</FieldLegend>
          <FormSwitchField
            control={form.control}
            name="track_stock"
            label="Track stock"
            description="Keep on-hand quantities per branch. Turn off for services or non-stock items."
          />
          <FormSwitchField control={form.control} name="is_active" label="Active" description="Inactive products can't be sold or adjusted." />
        </FieldSet>
      </form>

      <SheetFooter className="flex-row justify-end border-t">
        <SheetClose asChild>
          <Button variant="outline" disabled={pending}>
            Cancel
          </Button>
        </SheetClose>
        <Button type="submit" form="product-form" disabled={pending} aria-busy={pending}>
          {pending && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
          {isEdit ? 'Save changes' : 'Create product'}
        </Button>
      </SheetFooter>
    </>
  )
}
