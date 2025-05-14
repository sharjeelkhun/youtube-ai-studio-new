import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AnalyticsTab({ channelData }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>View your channel performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-muted-foreground">
              Analytics data will be displayed here. This is a preview mode placeholder.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
