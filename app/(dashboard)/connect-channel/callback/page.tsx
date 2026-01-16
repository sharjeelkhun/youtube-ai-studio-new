import { Suspense } from "react"
import { CallbackContent } from "./callback-content"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function ConnectionCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-[80vh] items-center justify-center p-4">
                <Card className="w-full max-w-md border-border/50 bg-background/60 backdrop-blur-xl shadow-xl">
                    <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">Loading...</h2>
                            <p className="text-sm text-muted-foreground">
                                Preparing connection callback.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    )
}
