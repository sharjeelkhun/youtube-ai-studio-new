"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Wand2 } from "lucide-react"
import { toast } from "sonner"

export function SeoGeneratorForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [total, setTotal] = useState(0)
    const [result, setResult] = useState<{ processed: number, failed: number } | null>(null)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setProgress(0)
        setResult(null)

        const formData = new FormData(event.currentTarget)
        const location = formData.get("location") as string
        const keywords = formData.get("keywords") as string
        const template = formData.get("template") as string // Optional instruction

        if (!location || !keywords) {
            toast.error("Please fill in required fields")
            setIsLoading(false)
            return
        }

        const keywordList = keywords.split(",").map(k => k.trim()).filter(k => k)
        setTotal(keywordList.length)

        try {
            // We'll send the whole batch to the API. 
            // For large batches (1000+), we should split it here or in the API. 
            // For now, let's assume we send chunks or the whole thing and the API handles it (streaming response would be better for progress).
            // Simplified: Just POST and wait.

            const response = await fetch("/api/admin/seo-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    location,
                    keywords: keywordList,
                    template
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Generation failed")
            }

            setResult({ processed: data.processed, failed: data.failed })
            toast.success(`Generated ${data.processed} pages successfully!`)

        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Generator Configuration</CardTitle>
                <CardDescription>
                    Configure target location and keywords for bulk generation.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="location">Target Location (City, State, or Country)</Label>
                        <Input id="location" name="location" placeholder="e.g. New York, NY" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="keywords">Keywords / Services (Comma Separated)</Label>
                        <Textarea
                            id="keywords"
                            name="keywords"
                            placeholder="plumber, emergency plumber, drain cleaning, pipe repair..."
                            className="min-h-[150px]"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter multiple keywords separated by commas. Each keyword will generate a unique page.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="template">Custom Instructions (Optional)</Label>
                        <Textarea
                            id="template"
                            name="template"
                            placeholder="Additional instructions for the AI (e.g., 'Focus on residential services', 'Include a call to action for 555-0199')"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating... {total > 0 && `(${progress}/${total})`}
                            </>
                        ) : (
                            <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Start Generation
                            </>
                        )}
                    </Button>

                    {result && (
                        <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
                            <p className="font-medium text-green-600">Successfully Created: {result.processed}</p>
                            {result.failed > 0 && <p className="font-medium text-red-600">Failed: {result.failed}</p>}
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}
