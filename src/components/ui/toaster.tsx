"use client"

import { Toaster as Sonner } from "sonner"
import { ToasterProps } from "sonner"

export function Toaster(props?: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "bg-card backdrop-blur-sm border border-border text-foreground",
          description: "text-muted-foreground",
          actionButton: "bg-primary hover:bg-primary/90",
          cancelButton: "bg-muted hover:bg-muted/80",
          closeButton: "text-muted-foreground hover:text-foreground",
        },
      }}
      {...props}
    />
  )
}
