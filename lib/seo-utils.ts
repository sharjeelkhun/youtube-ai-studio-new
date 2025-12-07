
export interface SeoRule {
    label: string
    passed: boolean
    weight: number
}

export function calculateSeoScore(title: string, description: string, tags: string[]) {
    const rules = [
        {
            label: "Title length optimal (20-70 chars)",
            passed: (title?.length || 0) >= 20 && (title?.length || 0) <= 70,
            weight: 30
        },
        {
            label: "Description has content (>50 chars)",
            passed: (description?.length || 0) >= 50,
            weight: 20
        },
        {
            label: "At least 3 tags used",
            passed: (tags?.length || 0) >= 3,
            weight: 20
        },
        {
            label: "Title contains 'Video' or 'Guide' or similar keywords",
            passed: /video|guide|tutorial|review|how to/i.test(title || ""),
            weight: 15
        },
        {
            label: "Description not too long (<5000 chars)",
            passed: (description?.length || 0) < 5000,
            weight: 15
        }
    ]

    const score = rules.reduce((acc, rule) => acc + (rule.passed ? rule.weight : 0), 0)

    return { score, rules }
}

export const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-500"
    if (s >= 50) return "text-amber-500"
    return "text-red-500"
}

export const getProgressColor = (s: number) => {
    if (s >= 80) return "bg-emerald-500"
    if (s >= 50) return "bg-amber-500"
    return "bg-red-500"
}
