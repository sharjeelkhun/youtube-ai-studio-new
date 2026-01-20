export const PLANS = [
    {
        id: "starter",
        name: "Starter",
        price: "Free",
        description: "Ideal for new creators just starting out. Diagnose your old videos and get actionable insights.",
        features: [
            "Sync last 5 videos",
            "1 AI insight per video",
            "Basic title & description rewrite",
            "1 AI-generated thumbnail",
            "Ads outside core workflow",
            "Email support",
            "Save up to 3 ideas",
        ],
        cta: "Start Free – No Credit Card Required.",
        ctaLink: "/signup?plan=starter",
        popular: false,
        limits: {
            videoSync: 5,
            aiInsights: 1,
            thumbnailGenerations: 1,
            apiRate: 100,
            savedIdeas: 3,
        },
        capabilities: {
            multipleAiSuggestions: false,
            thumbnailGuidance: false,
            competitorAnalysis: false,
            customAnalytics: false,
            apiAccess: false,
            customAiModels: false,
            noAds: false,
            bulkOperations: false,
            advancedAnalytics: false,
            dataExport: false,
            priorityProcessing: false,
        }
    },
    {
        id: "professional",
        name: "Professional",
        price: "$49",
        description: "For serious creators who want to accelerate their growth.",
        features: [
            "Full channel sync & analysis",
            "Unlimited AI insights per video",
            "Multiple AI suggestions for titles, descriptions, and tags",
            "Thumbnail guidance & A/B testing",
            "Competitor analysis & pattern insights",
            "Priority support",
            "Optional: use your own OpenAI/Gemini API key",
            "No ads",
            "Save up to 50 ideas",
        ],
        cta: "Upgrade to Professional",
        ctaLink: "/signup?plan=professional",
        popular: true,
        limits: {
            videoSync: -1, // Unlimited
            aiInsights: -1,
            thumbnailGenerations: 5,
            apiRate: 1000,
            savedIdeas: 50,
        },
        capabilities: {
            multipleAiSuggestions: true,
            thumbnailGuidance: true,
            competitorAnalysis: true,
            customAnalytics: false,
            apiAccess: false,
            customAiModels: false,
            noAds: true,
            bulkOperations: true,
            advancedAnalytics: true,
            dataExport: true,
            priorityProcessing: false,
        }
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: "$99",
        description: "Designed for established creators and multi-channel networks.",
        features: [
            "Custom analytics dashboard",
            "Full AI insights & suggestions across all videos",
            "Advanced SEO & competitor intelligence",
            "Dedicated account manager",
            "Competitor analysis & pattern insights",
            "API access",
            "Full control over AI models & integrations",
            "No ads",
            "Save up to 100 ideas",
        ],
        cta: "Get Enterprise Access",
        ctaLink: "/signup?plan=enterprise",
        popular: false,
        limits: {
            videoSync: -1, // Unlimited
            aiInsights: -1,
            thumbnailGenerations: -1,
            apiRate: -1,
            savedIdeas: 100,
        },
        capabilities: {
            multipleAiSuggestions: true,
            thumbnailGuidance: true,
            competitorAnalysis: true,
            customAnalytics: true,
            apiAccess: true,
            customAiModels: true,
            noAds: true,
            bulkOperations: true,
            advancedAnalytics: true,
            dataExport: true,
            priorityProcessing: true,
        }
    },
] as const;

export type PlanId = typeof PLANS[number]['id'];

export const getPlanById = (id: string) => {
    return PLANS.find(p => p.id === id) || PLANS[0];
};
