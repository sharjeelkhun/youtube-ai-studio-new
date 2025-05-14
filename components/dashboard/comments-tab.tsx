"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function CommentsTab({ channelData }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
          <CardDescription>Manage and respond to comments on your videos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-muted-foreground">
              Comments data will be displayed here. This is a preview mode placeholder.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
