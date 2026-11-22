import { BrandMark } from './BrandMark'

export function FullScreenLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background" role="status" aria-live="polite">
      <div className="relative">
        <span className="absolute inset-0 -m-2 animate-ping rounded-2xl bg-primary/20 motion-reduce:animate-none" />
        <BrandMark size={48} />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export function SectionLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Loading">
      <span className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
    </div>
  )
}
