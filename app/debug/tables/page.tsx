"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function TablesDebugPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkTables = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/debug/tables")

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error checking tables:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkTables()
  }, [])

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Database Tables Debug</CardTitle>
          <CardDescription>Check if your Supabase tables exist and are properly configured</CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Checking tables...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              <div className="rounded-md border p-4">
                <h3 className="text-lg font-medium">Auth Status</h3>
                <p className="text-sm text-muted-foreground mt-1">{data?.auth}</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tables</h3>

                {data?.tables &&
                  Object.entries(data.tables).map(([tableName, info]: [string, any]) => (
                    <div key={tableName} className="rounded-md border p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{tableName}</h4>
                        {info.exists ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>

                      <div className="mt-2 text-sm">
                        {info.exists ? (
                          <p className="text-green-600">Table exists</p>
                        ) : (
                          <p className="text-red-600">Table does not exist: {info.error}</p>
                        )}

                        {info.exists && (
                          <p className={info.hasData ? "text-green-600" : "text-amber-600"}>
                            {info.hasData ? "Has data" : "No data found"}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button onClick={checkTables} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              "Check Tables Again"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
