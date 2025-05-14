"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function DbDebugPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupResult, setSetupResult] = useState<any>(null)
  const [connectionDetails, setConnectionDetails] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkConnection() {
      try {
        setLoading(true)

        // Check if we're authenticated
        const { data: sessionData } = await supabase.auth.getSession()

        // Check if we can connect to Supabase
        const { data, error } = await supabase.from("_connection_test").select("*").limit(1).maybeSingle()

        // Get Supabase URL for debugging
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "Not available"

        setConnectionDetails({
          authenticated: !!sessionData.session,
          user: sessionData.session?.user?.email || "Not logged in",
          supabaseUrl,
          error: error
            ? {
                message: error.message,
                code: error.code,
                details: error.details,
              }
            : null,
        })

        setStatus({
          connected: !error || error.code === "PGRST116",
          message: error ? `Error: ${error.message}` : "Connected successfully",
          data,
        })
      } catch (err: any) {
        console.error("Connection check error:", err)
        setStatus({
          connected: false,
          message: `Error: ${err.message}`,
          error: err,
        })
      } finally {
        setLoading(false)
      }
    }

    checkConnection()
  }, [supabase])

  const handleSetupDatabase = async () => {
    try {
      setSetupLoading(true)
      setSetupResult(null)

      const response = await fetch("/api/db-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()
      setSetupResult(result)
    } catch (err: any) {
      console.error("Database setup error:", err)
      setSetupResult({
        success: false,
        error: `Error: ${err.message}`,
      })
    } finally {
      setSetupLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Database Connection Debug</h1>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className={status?.connected ? "bg-green-50" : "bg-red-50"}>
            <CardHeader>
              <CardTitle className={status?.connected ? "text-green-700" : "text-red-700"}>Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{status?.message}</p>

              <div className="mt-4 space-y-2">
                <h3 className="font-medium">Connection Details:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(connectionDetails, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Setup</CardTitle>
              <CardDescription>Create required tables in your Supabase database</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSetupDatabase} disabled={setupLoading} className="mb-4">
                {setupLoading ? "Setting up..." : "Setup Database"}
              </Button>

              {setupResult && (
                <Alert variant={setupResult.success ? "default" : "destructive"}>
                  <AlertTitle>{setupResult.success ? "Success" : "Error"}</AlertTitle>
                  <AlertDescription>
                    {setupResult.success ? setupResult.message : setupResult.error}

                    {setupResult.details && (
                      <pre className="mt-2 bg-gray-100 p-2 rounded text-sm overflow-auto">
                        {JSON.stringify(setupResult.details, null, 2)}
                      </pre>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
