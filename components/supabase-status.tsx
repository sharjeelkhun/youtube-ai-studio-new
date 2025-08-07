"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ExclamationTriangleIcon, CheckCircledIcon } from "@radix-ui/react-icons"

export function SupabaseStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const checkConnection = async () => {
      if (!supabase) {
        setStatus("error")
        setErrorMessage("Supabase credentials are missing. Please check your environment variables.")
        return
      }

      try {
        // Try to get the session to test the connection
        const { error } = await supabase.auth.getSession()

        if (error) {
          setStatus("error")
          setErrorMessage(error.message)
        } else {
          setStatus("connected")
        }
      } catch (err: any) {
        setStatus("error")
        setErrorMessage(err.message || "Failed to connect to Supabase")
      }
    }

    checkConnection()
  }, [])

  if (status === "checking") {
    return (
      <Alert className="mb-4">
        <AlertTitle>Checking Supabase connection...</AlertTitle>
      </Alert>
    )
  }

  if (status === "error") {
    return (
      <Alert variant="destructive" className="mb-4">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>Supabase Connection Error</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-4 bg-green-50">
      <CheckCircledIcon className="h-4 w-4 text-green-500" />
      <AlertTitle>Connected to Supabase</AlertTitle>
      <AlertDescription>Your application is successfully connected to Supabase.</AlertDescription>
    </Alert>
  )
}
