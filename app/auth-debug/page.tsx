"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthDebugPage() {
  const { user, session, isLoading } = useAuth()
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkApiStatus = async () => {
    setIsChecking(true)
    try {
      const response = await fetch("/api/debug/auth-status")
      const data = await response.json()
      setApiStatus(data)
    } catch (error) {
      console.error("Error checking API status:", error)
      setApiStatus({ status: "error", message: "Failed to fetch API status" })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkApiStatus()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-2xl font-bold">Authentication Debug</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Client Auth State</CardTitle>
            <CardDescription>Current authentication state from the Auth Context</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading auth state...</p>
            ) : (
              <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
                {JSON.stringify(
                  {
                    authenticated: !!session,
                    user: user
                      ? {
                          id: user.id,
                          email: user.email,
                        }
                      : null,
                    user_metadata: session?.user?.user_metadata || null,
                    session: session
                      ? {
                          expires_at: session.expires_at,
                        }
                      : null,
                  },
                  null,
                  2,
                )}
              </pre>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">This information comes from the client-side Auth Context.</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Auth Check</CardTitle>
            <CardDescription>Authentication status from the server API</CardDescription>
          </CardHeader>
          <CardContent>
            {isChecking ? (
              <p>Checking API status...</p>
            ) : (
              <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">{JSON.stringify(apiStatus, null, 2)}</pre>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={checkApiStatus} disabled={isChecking}>
              {isChecking ? "Checking..." : "Refresh Status"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
