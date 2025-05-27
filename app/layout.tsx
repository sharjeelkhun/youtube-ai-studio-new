import type React from "react"
import "./globals.css"
import { Metadata } from "next"
import { Providers } from "@/components/providers"

export const metadata: Metadata = {
  title: "YouTube AI Studio",
  description: "AI-powered YouTube analytics and management"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
