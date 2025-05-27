"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { isMockClient } from "@/lib/supabase"

export default function SetupDatabasePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [isMock, setIsMock] = useState(false)

  useEffect(() => {
    setIsMock(isMockClient())
  }, [])

  const setupDatabase = async () => {
    setStatus("loading")
    setMessage("Setting up database...")

    try {
      if (isMock) {
        // Simulate database setup in demo mode
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setStatus("success")
        setMessage("Database setup successful (simulated)")
        return
      }

      const response = await fetch("/api/setup-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage("Database setup successful")
      } else {
        setStatus("error")
        setMessage(`Database setup failed: ${data.error}`)
      }
    } catch (error) {
      console.error("Database setup error:", error)
      setStatus("error")
      setMessage(`Database setup failed: ${error.message}`)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Database Setup</CardTitle>
          <CardDescription>Set up the database for your application</CardDescription>

          {isMock && (
            <Alert className="mt-2">
              <AlertDescription>Running in demo mode. Database setup will be simulated.</AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This will create the necessary tables and functions in your Supabase database.
          </p>

          {status === "loading" && (
            <Alert>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === "success" && (
            <Alert>
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <XCircle className="mr-2 h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <Button onClick={setupDatabase} className="w-full" disabled={status === "loading" || status === "success"}>
            {status === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up database...
              </>
            ) : (
              "Set up database"
            )}
          </Button>
        </CardContent>

        <CardFooter className="flex justify-center">
          {status === "success" ? (
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500">
              Go to login page
            </Link>
          ) : (
            <p className="text-sm text-gray-600">You need to set up the database before using the application.</p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
