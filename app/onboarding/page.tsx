"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Youtube, ArrowRight, Loader2, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [channelUrl, setChannelUrl] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const totalSteps = 3

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      // Complete onboarding
      router.push("/")
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleConnectYouTube = async () => {
    if (!channelUrl.includes("youtube.com")) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube channel URL",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)

    try {
      // Simulate API call to connect YouTube channel
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setIsConnected(true)

      toast({
        title: "Success",
        description: "Your YouTube channel has been connected successfully",
      })

      // Automatically move to next step after successful connection
      setTimeout(() => {
        handleNext()
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect your YouTube channel. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Welcome to YouTube AI Studio!",
        description: "Your account is now set up and ready to use.",
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <div className="container flex flex-1 items-center justify-center py-12">
        <Card className="mx-auto w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="mt-4 text-2xl">Set up your account</CardTitle>
            <CardDescription>Complete these steps to get started with YouTube AI Studio</CardDescription>
            <Progress value={(step / totalSteps) * 100} className="mt-4" />
            <div className="mt-2 text-xs text-muted-foreground">
              Step {step} of {totalSteps}
            </div>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Welcome to YouTube AI Studio</h3>
                <p className="text-muted-foreground">
                  We're excited to have you on board! Let's set up your account to get the most out of our platform.
                </p>
                <div className="rounded-lg border bg-card p-4">
                  <h4 className="font-medium">What you'll need:</h4>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-primary" />
                      Access to your YouTube channel
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-primary" />
                      Your channel URL
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-primary" />
                      Permission to connect third-party apps
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Connect your YouTube channel</h3>
                <p className="text-muted-foreground">
                  Connect your YouTube channel to get personalized insights and recommendations.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="channelUrl">YouTube Channel URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="channelUrl"
                      placeholder="https://www.youtube.com/c/yourchannel"
                      value={channelUrl}
                      onChange={(e) => setChannelUrl(e.target.value)}
                      disabled={isConnecting || isConnected}
                    />
                    <Button onClick={handleConnectYouTube} disabled={isConnecting || isConnected || !channelUrl}>
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isConnected ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Youtube className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {isConnected && (
                  <div className="rounded-lg bg-green-50 p-3 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <div className="flex items-center">
                      <Check className="mr-2 h-4 w-4" />
                      <span className="font-medium">Channel connected successfully!</span>
                    </div>
                  </div>
                )}
                <div className="rounded-lg border bg-card p-4">
                  <h4 className="font-medium">Why connect your channel?</h4>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    <li>• Get personalized content recommendations</li>
                    <li>• Analyze your channel performance</li>
                    <li>• Optimize your videos for better reach</li>
                    <li>• Track your growth over time</li>
                  </ul>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">You're all set!</h3>
                <p className="text-muted-foreground">
                  Your account is now connected and ready to use. Let's start optimizing your YouTube channel.
                </p>
                <div className="rounded-lg border bg-card p-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="mt-4 font-medium">Account setup complete!</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We're now importing your channel data. This may take a few minutes.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                Back
              </Button>
            ) : (
              <div></div>
            )}
            {step < totalSteps ? (
              <Button onClick={handleNext} disabled={step === 2 && !isConnected}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleCompleteOnboarding} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  <>
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
