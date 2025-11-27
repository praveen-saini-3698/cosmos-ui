import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-lg border px-4 py-2 text-sm transition-all duration-200",
        "dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:placeholder:text-slate-500",
        "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  )
}

export { Input }
