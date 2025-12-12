
'use client'

import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { Button } from "@/components/ui/button"
import { ChannelIndicator } from "@/components/channel-indicator"
import { UserNav } from "@/components/user-nav"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"

export function TopBar() {
  const { channel, loading, isConnected } = useYouTubeChannel()
  const pathname = usePathname()

  // Simple breadcrumb logic
  const getBreadcrumbs = () => {
    const paths = pathname?.split('/').filter(Boolean) || []
    return paths.map((path, index) => {
      const href = `/${paths.slice(0, index + 1).join('/')}`
      const label = path.charAt(0).toUpperCase() + path.slice(1)
      const isLast = index === paths.length - 1
      return { href, label, isLast }
    })
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-4 shadow-sm transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center">
                <BreadcrumbItem className="hidden md:block">
                  {crumb.isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!crumb.isLast && <BreadcrumbSeparator className="hidden md:block" />}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4">
        <div className="hidden md:flex flex-1 justify-center max-w-xl">
          {/* Optional: Add Search command menu here later */}
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="w-[150px] h-8 bg-muted animate-pulse rounded-lg" />
          ) : (
            <div className="hidden md:block">
              <ChannelIndicator
                isConnected={isConnected}
                channelTitle={channel?.title}
                channelThumbnail={channel?.thumbnail}
              />
            </div>
          )}

          <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />

          {!isConnected && !loading && (
            <Button
              variant="default"
              size="sm"
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 px-5 h-9 font-medium"
              onClick={async () => {
                const response = await fetch('/api/youtube/connect')
                const data = await response.json()
                if (data.authUrl) window.location.href = data.authUrl
              }}
            >
              Connect Channel
            </Button>
          )}
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
}
