import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// DESIGN.md §Components: input 규칙(흰 바탕, 1px input 선, 둥글기 sm). 글이 늘면 높이도 는다(field-sizing-content).
// tone="me": 독자가 쓰는 긴 글. "내가 쓴 글" 잉크와 body-reading 단계 (DESIGN.md text-me).
const textareaVariants = cva(
  "flex field-sizing-content min-h-24 w-full rounded-sm border border-input bg-popover px-3 py-2 transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive",
  {
    variants: {
      tone: {
        default: "text-body-md text-foreground",
        me: "text-body-reading text-ink-me",
      },
    },
    defaultVariants: { tone: "default" },
  }
)

function Textarea({
  className,
  tone,
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ tone }), className)}
      {...props}
    />
  )
}

export { Textarea }
