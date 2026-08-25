"use client"

import { Toaster as Sonner } from "sonner"
import { ToasterProps } from "sonner"

export function Toaster(props?: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      theme="dark"
      toastOptions={{
        classNames: {
          toast: "bg-white/10 backdrop-blur-sm border border-white/20 text-white",
          description: "text-white/80",
          actionButton: "bg-primary hover:bg-primary/90",
          cancelButton: "bg-white/10 hover:bg-white/20",
          closeButton: "text-white/60 hover:text-white",
        },
      }}
      {...props}
    />
  )
}