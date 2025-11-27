import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98]",
        destructive:
          "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:from-red-400 hover:to-rose-500 active:scale-[0.98]",
        outline:
          "border dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-cyan-500/50 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-cyan-500/50",
        secondary:
          "dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-slate-900",
        ghost:
          "dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white text-slate-600 hover:bg-slate-200/50 hover:text-slate-900",
        link:
          "text-cyan-500 underline-offset-4 hover:underline hover:text-cyan-400",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
