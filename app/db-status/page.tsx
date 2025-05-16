"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DatabaseStatusPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [data, setData] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  const checkDatabaseStatus = async () => {
    setStatus("loading")
    try {
      const response = await fetch("/api/debug/database")
      const data = await response.json()

      setData(data)
      setStatus(data.status === "error" ? "error" : "success")
    } catch (error) {
      console.error("Error checking database status:", error)
      setStatus("error")
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await checkDatabaseStatus()
    setIsRefreshing(false)
  }

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Database Status</CardTitle>
          <CardDescription>Check the connection to your database</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Checking database connection...</p>
            </div>
          ) : status === "success" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">
                    {data?.message || "Database connection successful"}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {data?.database?.mock ? "Using mock data in preview mode" : "Connected to Supabase database"}
                  </p>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <h3 className="mb-2 text-sm font-medium">Environment Details:</h3>
                <pre className="max-h-40 overflow-auto rounded-md bg-gray-100 p-2 text-xs dark:bg-gray-800">
                  {JSON.stringify(data?.environment || {}, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-300">
                    {data?.message || "Database connection failed"}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400">{data?.error || "An unknown error occurred"}</p>
                </div>
              </div>

              {data && (
                <div className="rounded-md border p-4">
                  <h3 className="mb-2 text-sm font-medium">Debug Information:</h3>
                  <pre className="max-h-40 overflow-auto rounded-md bg-gray-100 p-2 text-xs dark:bg-gray-800">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
