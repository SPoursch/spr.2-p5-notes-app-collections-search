import Image from 'next/image'

/**
 * Brand block at the top of the sidebar: the SalesBound mark, the brand name,
 * then the product name beneath it.
 *
 * The mark is the supplied asset rather than a drawn or typeset stand-in, so
 * it must exist at public/salesbound-logo.png. `object-contain` inside a fixed
 * square keeps it proportional whatever the source dimensions are, and the
 * intrinsic size is set to twice the rendered size so it stays crisp on
 * high-density displays.
 */
export function BrandHeader() {
  return (
    <div className="flex shrink-0 items-center gap-3 px-5 py-5">
      <Image
        src="/salesbound-logo.png"
        alt="SalesBound"
        width={80}
        height={80}
        priority
        className="size-10 shrink-0 rounded-xl object-contain"
      />

      <div className="min-w-0">
        <p className="truncate text-[17px] font-semibold leading-tight tracking-tight text-sidebar-foreground">
          SalesBound
        </p>
        <p className="truncate text-[13px] leading-tight text-sidebar-muted">
          NoteSpace
        </p>
      </div>
    </div>
  )
}
