"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { isPreview } from "@/lib/supabase"

export default function SupabaseDebugPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [details, setDetails] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkConnection = async () => {
    setIsChecking(true)
    setStatus("loading")
    setMessage("Checking Supabase connection...")

    try {
      const response = await fetch("/api/debug/supabase")
      const data = await response.json()

      if (data.status === "success") {
        setStatus("success")
        setMessage(data.message)
      } else {
        setStatus("error")
        setMessage(data.message)
      }

      setDetails(data)
    } catch (error) {
      setStatus("error")
      setMessage("Failed to check Supabase connection")
      setDetails({ error: error.message })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Connection Debug</CardTitle>
          <CardDescription>Check your Supabase connection status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPreview && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Preview Mode</AlertTitle>
              <AlertDescription>Running in preview mode. Supabase connection will be simulated.</AlertDescription>
            </Alert>
          )}

          <Alert variant={status === "loading" ? "default" : status === "success" ? "default" : "destructive"}>
            {status === "loading" ? (
              <AlertCircle className="h-4 w-4" />
            ) : status === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {status === "loading" ? "Checking..." : status === "success" ? "Connected" : "Connection Error"}
            </AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>

          {details && (
            <div className="mt-4 rounded-md bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-medium">Connection Details:</h3>
              <pre className="overflow-auto text-xs">{JSON.stringify(details, null, 2)}</pre>
            </div>
          )}

          <Button onClick={checkConnection} disabled={isChecking}>
            {isChecking ? "Checking..." : "Check Connection Again"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
