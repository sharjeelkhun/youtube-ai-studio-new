import { Sidebar } from "@/components/sidebar"
import { YouTubeChannelProvider } from "@/contexts/youtube-channel-context"

export default function DashboardLayout({ children }) {
  return (
    <YouTubeChannelProvider>
      <div className="flex min-h-screen">
        <div className="hidden md:block">
          <Sidebar className="h-screen w-64" />
        </div>
        <main className="flex-1">{children}</main>
      </div>
    </YouTubeChannelProvider>
  )
}
