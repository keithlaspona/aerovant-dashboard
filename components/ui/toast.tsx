"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "success" | "error" | "warning"
  duration?: number
}

interface ToastContextValue {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = React.useCallback((toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...toast, id }
    setToasts((prev) => [...prev, newToast])

    // Auto remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, toast.duration || 5000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  React.useEffect(() => {
    const handleShowToast = (event: CustomEvent) => {
      addToast(event.detail)
    }

    window.addEventListener("show-toast", handleShowToast)

    return () => {
      window.removeEventListener("show-toast", handleShowToast)
    }
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}

export function toast(props: Omit<ToastProps, "id">) {
  // This will be called from components
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: props,
      }),
    )
  }
}

function ToastContainer({ toasts, removeToast }: { toasts: ToastProps[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function Toast({ title, description, variant = "default", onClose }: ToastProps & { onClose: () => void }) {
  const variantStyles = {
    default: "bg-card border-border",
    success: "bg-green-50 dark:bg-green-950 border-green-500",
    error: "bg-red-50 dark:bg-red-950 border-red-500",
    warning: "bg-yellow-50 dark:bg-yellow-950 border-yellow-500",
  }

  return (
    <div
      className={cn("rounded-lg border-2 shadow-lg p-4 animate-in slide-in-from-right-full", variantStyles[variant])}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {title && <p className="font-semibold text-foreground mb-1">{title}</p>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
