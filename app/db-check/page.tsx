"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { setupDatabase } from "../actions/setup-database"

export default function DbCheckPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [setupStatus, setSetupStatus] = useState<any>(null)
  const [setupLoading, setSetupLoading] = useState(false)

  useEffect(() => {
    async function checkDatabase() {
      try {
        setLoading(true)
        const response = await fetch("/api/db-check")

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setStatus(data)
      } catch (err: any) {
        console.error("Error checking database:", err)
        setError(err.message || "Failed to check database connection")
      } finally {
        setLoading(false)
      }
    }

    checkDatabase()
  }, [setupStatus])

  const handleSetupDatabase = async () => {
    try {
      setSetupLoading(true)
      setSetupStatus(null)
      const result = await setupDatabase()
      setSetupStatus(result)
    } catch (err: any) {
      console.error("Error setting up database:", err)
      setSetupStatus({ success: false, error: err.message || "Failed to set up database" })
    } finally {
      setSetupLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Database Connection Check</h1>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : error ? (
        <Card className="bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Connection Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className={status?.connected ? "bg-green-50" : "bg-red-50"}>
            <CardHeader>
              <CardTitle className={status?.connected ? "text-green-700" : "text-red-700"}>Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{status?.message}</p>
              {status?.error && <p className="mt-2 text-red-600">Error: {status.error}</p>}
            </CardContent>
          </Card>

          {status?.connected && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Tables</CardTitle>
                  <CardDescription>Public schema tables in your database</CardDescription>
                </CardHeader>
                <CardContent>
                  {status.tables.length > 0 ? (
                    <ul className="list-inside list-disc">
                      {status.tables.map((table: string) => (
                        <li key={table}>{table}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No tables found in public schema</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profiles Table</CardTitle>
                  <CardDescription>Columns in the profiles table</CardDescription>
                </CardHeader>
                <CardContent>
                  {status.profilesColumns.length > 0 ? (
                    <ul className="list-inside list-disc">
                      {status.profilesColumns.map((column: string) => (
                        <li key={column}>{column}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No columns found or profiles table doesn't exist</p>
                  )}
                  <p className="mt-4">Query test: {status.profilesQueryResult}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Database Setup</CardTitle>
                  <CardDescription>Create or update required tables and columns</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleSetupDatabase} disabled={setupLoading} className="mb-4">
                    {setupLoading ? "Setting up..." : "Setup Database"}
                  </Button>

                  {setupStatus && (
                    <div
                      className={`mt-4 p-4 rounded-md ${setupStatus.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                    >
                      <p>{setupStatus.success ? setupStatus.message : `Error: ${setupStatus.error}`}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
