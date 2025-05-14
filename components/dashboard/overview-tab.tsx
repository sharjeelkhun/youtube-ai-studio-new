import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, Users, Video, Eye, ThumbsUp, MessageSquare } from "lucide-react"

// Format numbers with commas
const formatNumber = (num) => {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0"
}

export function OverviewTab({ channelData }) {
  // Mock data for preview mode
  const mockStats = {
    views: 125000,
    watchTime: 7500,
    subscribers: channelData?.subscribers || 10500,
    videos: channelData?.videos || 42,
    likes: 8700,
    comments: 1200,
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(mockStats.subscribers)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500">+2.5%</span> from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
          <Video className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(mockStats.videos)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500">+3</span> new this month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(mockStats.views)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500">+12.5%</span> from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Watch Time (hours)</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(mockStats.watchTime)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500">+7.2%</span> from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
          <ThumbsUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(mockStats.likes)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500">+18.2%</span> from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(mockStats.comments)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500">+5.3%</span> from last month
          </p>
        </CardContent>
      </Card>
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Channel Information</CardTitle>
          <CardDescription>Details about your YouTube channel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Channel Name</h3>
                <p className="text-sm">{channelData?.title || "Demo YouTube Channel"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Channel ID</h3>
                <p className="text-sm">{channelData?.id || "UC123456789"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="text-sm">
                  {channelData?.description || "This is a demo YouTube channel for preview mode"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                <p className="text-sm">
                  {channelData?.last_updated
                    ? new Date(channelData.last_updated).toLocaleDateString()
                    : new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
