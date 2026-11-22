import { Link, useSearchParams } from 'react-router'
import { ArrowLeft, Ruler, Settings2, Tags } from 'lucide-react'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { CategoriesTab } from '../components/CategoriesTab'
import { UnitsTab } from '../components/UnitsTab'

type CatalogTab = 'categories' | 'units'

export function CatalogPage() {
  useDocumentTitle('Catalog settings')
  const [params, setParams] = useSearchParams()
  const tab: CatalogTab = params.get('tab') === 'units' ? 'units' : 'categories'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalog settings"
        icon={Settings2}
        description="Categories and units of measure shared by all products."
        actions={
          <Button variant="outline" asChild>
            <Link to="/products">
              <ArrowLeft data-icon="inline-start" />
              Back to products
            </Link>
          </Button>
        }
      />
      <Tabs value={tab} onValueChange={(v) => setParams(v === 'units' ? { tab: 'units' } : {}, { replace: true })}>
        <TabsList>
          <TabsTrigger value="categories">
            <Tags aria-hidden="true" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="units">
            <Ruler aria-hidden="true" />
            Units
          </TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="mt-4">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="units" className="mt-4">
          <UnitsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CatalogPage
