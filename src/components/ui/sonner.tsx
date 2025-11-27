"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-slate-900 group-[.toaster]:text-white group-[.toaster]:border-slate-700 group-[.toaster]:shadow-xl",
          description: "group-[.toast]:text-slate-400",
          actionButton:
            "group-[.toast]:bg-cyan-500 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-slate-700 group-[.toast]:text-slate-300",
          error:
            "group-[.toaster]:!bg-red-950 group-[.toaster]:!border-red-800 group-[.toaster]:!text-red-100 [&>div>svg]:!text-red-400",
          success:
            "group-[.toaster]:!bg-emerald-950 group-[.toaster]:!border-emerald-800 group-[.toaster]:!text-emerald-100 [&>div>svg]:!text-emerald-400",
          warning:
            "group-[.toaster]:!bg-amber-950 group-[.toaster]:!border-amber-800 group-[.toaster]:!text-amber-100 [&>div>svg]:!text-amber-400",
          info:
            "group-[.toaster]:!bg-blue-950 group-[.toaster]:!border-blue-800 group-[.toaster]:!text-blue-100 [&>div>svg]:!text-blue-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
