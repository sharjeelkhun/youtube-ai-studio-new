"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DbDebugPage() {
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkDbStatus = async () => {
    setIsChecking(true)
    setError(null)
    try {
      const response = await fetch("/api/debug/database")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setDbStatus(data)
    } catch (error: any) {
      console.error("Error checking database status:", error)
      setError(error.message || "Failed to check database status")
      setDbStatus(null)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkDbStatus()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-2xl font-bold">Database Debug</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Database Status</CardTitle>
          <CardDescription>Current database connection status</CardDescription>
        </CardHeader>
        <CardContent>
          {isChecking ? (
            <p>Checking database status...</p>
          ) : (
            <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
              {dbStatus ? JSON.stringify(dbStatus, null, 2) : "No data available"}
            </pre>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={checkDbStatus} disabled={isChecking}>
            {isChecking ? "Checking..." : "Refresh Status"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
