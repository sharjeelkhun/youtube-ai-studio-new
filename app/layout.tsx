import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { YouTubeChannelProvider } from "@/contexts/youtube-channel-context"
import { Toaster } from "@/components/ui/toaster"
import { DebugButton } from "@/components/debug-button"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "YouTube Dashboard",
  description: "Manage your YouTube channel with advanced analytics and AI-powered suggestions",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <YouTubeChannelProvider>
              {children}
              <Toaster />
              <DebugButton />
            </YouTubeChannelProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
