import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, ThumbsUp, MessageSquare } from "lucide-react"

export function VideosTab({ channelData }) {
  // Mock data for preview mode
  const mockVideos = [
    {
      id: "video1",
      title: "How to Get Started with YouTube",
      views: 12500,
      likes: 870,
      comments: 120,
      published_at: "2023-05-15T10:30:00Z",
    },
    {
      id: "video2",
      title: "10 Tips for Growing Your Channel",
      views: 8700,
      likes: 650,
      comments: 85,
      published_at: "2023-06-22T14:15:00Z",
    },
    {
      id: "video3",
      title: "Content Creation Masterclass",
      views: 15200,
      likes: 1250,
      comments: 210,
      published_at: "2023-07-10T09:45:00Z",
    },
    {
      id: "video4",
      title: "YouTube Algorithm Explained",
      views: 22800,
      likes: 1870,
      comments: 315,
      published_at: "2023-08-05T16:20:00Z",
    },
    {
      id: "video5",
      title: "How to Edit Videos Like a Pro",
      views: 9600,
      likes: 720,
      comments: 95,
      published_at: "2023-09-18T11:10:00Z",
    },
  ]

  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Videos</CardTitle>
          <CardDescription>Manage and analyze your YouTube videos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end">
                    <Eye className="mr-1 h-4 w-4" />
                    Views
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end">
                    <ThumbsUp className="mr-1 h-4 w-4" />
                    Likes
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end">
                    <MessageSquare className="mr-1 h-4 w-4" />
                    Comments
                  </div>
                </TableHead>
                <TableHead className="text-right">Published</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockVideos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell className="font-medium">{video.title}</TableCell>
                  <TableCell className="text-right">{formatNumber(video.views)}</TableCell>
                  <TableCell className="text-right">{formatNumber(video.likes)}</TableCell>
                  <TableCell className="text-right">{formatNumber(video.comments)}</TableCell>
                  <TableCell className="text-right">{formatDate(video.published_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
