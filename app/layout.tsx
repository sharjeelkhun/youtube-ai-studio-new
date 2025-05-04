import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { YouTubeChannelProvider } from "@/contexts/youtube-channel-context"
import dynamic from "next/dynamic"

// Dynamically import AuthProvider to avoid SSR issues
const AuthProvider = dynamic(() => import("@/contexts/auth-context").then((mod) => mod.AuthProvider), {
  ssr: false,
})

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "YouTube AI Studio",
  description: "AI-powered YouTube content optimization platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <YouTubeChannelProvider>
              {children}
              <Toaster />
            </YouTubeChannelProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
