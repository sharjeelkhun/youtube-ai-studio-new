import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle, AlertCircle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { calculateSeoScore, getScoreColor, getProgressColor } from "@/lib/seo-utils"

interface SeoScoreCardProps {
    title: string
    description: string
    tags: string[]
}

export function SeoScoreCard({ title, description, tags }: SeoScoreCardProps) {
    const { score, rules } = calculateSeoScore(title, description, tags)

    return (
        <Card className="border-border/50 bg-background/60 backdrop-blur-xl">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        SEO Score
                    </CardTitle>
                    <span className={cn("text-2xl font-bold", getScoreColor(score))}>
                        {score}/100
                    </span>
                </div>
                <Progress value={score} className={cn("h-2", getProgressColor(score).replace("bg-", "text-"))} />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {rules.map((rule, i) => (
                        <div key={i} className="flex items-start gap-3">
                            {rule.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            ) : (
                                <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            )}
                            <span className={cn("text-sm", rule.passed ? "text-foreground" : "text-muted-foreground")}>
                                {rule.label}
                            </span>
                        </div>
                    ))}

                    {score < 100 && (
                        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <div className="flex gap-2">
                                <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                                <p className="text-xs text-muted-foreground">
                                    Tip: Improving your SEO score can help your video rank higher in search results and get more views.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
