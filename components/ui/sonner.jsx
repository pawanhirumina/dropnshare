"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";
import { CheckCircle2, Info, AlertTriangle, XCircle, Loader2 } from "lucide-react"

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      icons={{
        success: (
          <CheckCircle2 className="size-4 text-green-500" />
        ),
        info: (
          <Info className="size-4 text-blue-500" />
        ),
        warning: (
          <AlertTriangle className="size-4 text-yellow-500" />
        ),
        error: (
          <XCircle className="size-4 text-red-500" />
        ),
        loading: (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ),
      }}
      {...props} />
  );
}

export { Toaster }
