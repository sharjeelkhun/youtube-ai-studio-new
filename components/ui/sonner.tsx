"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      richColors
      gap={8}
      style={{ marginBottom: '5rem' }} // Reduced clearance as per user request
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-zinc-950/90 dark:group-[.toaster]:bg-zinc-950/90 group-[.toaster]:text-white group-[.toaster]:backdrop-blur-xl group-[.toaster]:border-white/10 group-[.toaster]:border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:px-6 group-[.toaster]:py-3 group-[.toaster]:w-fit group-[.toaster]:mx-auto group-[.toaster]:min-w-[300px] group-[.toaster]:font-medium group-[.toaster]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
