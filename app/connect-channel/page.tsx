import { CheckCircle, Youtube } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectYouTubeButton } from "@/components/connect-youtube-button"

export default function ConnectChannelPage() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Connect YouTube Channel</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>Google Client ID is not configured</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="border-2 border-dashed w-full max-w-2xl transition-all duration-300 hover:border-red-200 hover:shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="rounded-full bg-red-50 w-20 h-20 mx-auto flex items-center justify-center mb-6">
            <Youtube className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
            Connect Your YouTube Channel
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Unlock powerful insights and analytics for your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 mt-4">
            <div className="grid gap-8">
              {[
                {
                  title: "Channel Analytics",
                  description: "View detailed analytics and performance metrics for your channel growth"
                },
                {
                  title: "Video Management",
                  description: "Efficiently manage and optimize your video content strategy"
                },
                {
                  title: "AI-Powered Insights",
                  description: "Get intelligent recommendations to improve your content and reach"
                }
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-lg transition-all duration-200 hover:bg-red-50">
                  <CheckCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <ConnectYouTubeButton />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
