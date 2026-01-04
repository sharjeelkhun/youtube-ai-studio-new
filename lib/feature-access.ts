"use client"

import { useSubscription } from "@/contexts/subscription-context"

// Define feature access levels
export const FEATURE_LIMITS = {
    // Video sync limits
    VIDEO_SYNC_LIMIT: {
        Starter: 10,
        Professional: -1, // unlimited
        Enterprise: -1, // unlimited
    },

    // AI insights per video
    AI_INSIGHTS_PER_VIDEO: {
        Starter: 1,
        Professional: -1, // unlimited
        Enterprise: -1, // unlimited
    },

    // Thumbnail generations per video
    THUMBNAIL_GENERATIONS: {
        Starter: 1,
        Professional: 5,
        Enterprise: -1, // unlimited
    },

    // API rate limits (requests per hour)
    API_RATE_LIMIT: {
        Starter: 100,
        Professional: 1000,
        Enterprise: -1, // unlimited
    },

    // Feature access flags
    FEATURES: {
        MULTIPLE_AI_SUGGESTIONS: {
            Starter: false,
            Professional: true,
            Enterprise: true,
        },
        THUMBNAIL_GUIDANCE: {
            Starter: false,
            Professional: true,
            Enterprise: true,
        },
        COMPETITOR_ANALYSIS: {
            Starter: false,
            Professional: true,
            Enterprise: true,
        },
        CUSTOM_ANALYTICS_DASHBOARD: {
            Starter: false,
            Professional: false,
            Enterprise: true,
        },
        API_ACCESS: {
            Starter: false,
            Professional: false,
            Enterprise: true,
        },
        CUSTOM_AI_MODELS: {
            Starter: false,
            Professional: false,
            Enterprise: true,
        },
        NO_ADS: {
            Starter: false,
            Professional: true,
            Enterprise: true,
        },
        BULK_VIDEO_OPERATIONS: {
            Starter: false,
            Professional: true,
            Enterprise: true,
        },
        ADVANCED_ANALYTICS: {
            Starter: false,
            Professional: true,
            Enterprise: true,
        },
        DATA_EXPORT: {
            Starter: false,
            Professional: true,
            Enterprise: true,
        },
        ADVANCED_FILTERING: {
            Starter: false,
            Professional: true,
            Enterprise: true,
        },
        PRIORITY_PROCESSING: {
            Starter: false,
            Professional: false,
            Enterprise: true,
        },
        CUSTOM_AI_PROMPTS: {
            Starter: false,
            Professional: true,
            Enterprise: true,
        },
        TEAM_COLLABORATION: {
            Starter: false,
            Professional: false,
            Enterprise: true,
        },
        WHITE_LABELING: {
            Starter: false,
            Professional: false,
            Enterprise: true,
        },
    },
}

// Plan hierarchy for easy comparison
export const PLAN_HIERARCHY = {
    'Starter': 0,
    'Professional': 1,
    'Enterprise': 2,
}

export function useFeatureAccess() {
    const { planName, isPro, isEnterprise } = useSubscription()

    const getVideoSyncLimit = () => {
        return FEATURE_LIMITS.VIDEO_SYNC_LIMIT[planName as keyof typeof FEATURE_LIMITS.VIDEO_SYNC_LIMIT] || 10
    }

    const getAIInsightsLimit = () => {
        return FEATURE_LIMITS.AI_INSIGHTS_PER_VIDEO[planName as keyof typeof FEATURE_LIMITS.AI_INSIGHTS_PER_VIDEO] || 1
    }

    const getThumbnailGenerationsLimit = () => {
        return FEATURE_LIMITS.THUMBNAIL_GENERATIONS[planName as keyof typeof FEATURE_LIMITS.THUMBNAIL_GENERATIONS] || 1
    }

    const hasFeature = (feature: keyof typeof FEATURE_LIMITS.FEATURES) => {
        return FEATURE_LIMITS.FEATURES[feature][planName as keyof typeof FEATURE_LIMITS.FEATURES[typeof feature]] || false
    }

    const canAccessFeature = (feature: keyof typeof FEATURE_LIMITS.FEATURES) => {
        return hasFeature(feature)
    }

    const getUpgradeMessage = (feature: string) => {
        switch (feature) {
            case 'MULTIPLE_AI_SUGGESTIONS':
                return "🚀 Unlock unlimited AI suggestions for titles, descriptions, and tags. Get 10x more creative ideas to boost your video performance."
            case 'THUMBNAIL_GUIDANCE':
                return "🎨 Access professional thumbnail guidance and A/B testing tools. Create thumbnails that convert 300% better with data-driven insights."
            case 'COMPETITOR_ANALYSIS':
                return "📊 Gain competitive advantage with detailed competitor analysis. Discover what works in your niche and dominate the algorithm."
            case 'CUSTOM_ANALYTICS_DASHBOARD':
                return "📈 Transform your channel with custom analytics dashboards. Track advanced metrics, ROI, and growth patterns like a pro creator."
            case 'API_ACCESS':
                return "🔧 Build powerful integrations with full API access. Connect your favorite tools and automate your entire workflow."
            case 'CUSTOM_AI_MODELS':
                return "🤖 Take control with custom AI models and integrations. Fine-tune AI responses for your unique content style and audience."
            case 'NO_ADS':
                return "✨ Enjoy an ad-free experience with premium features. Focus on creating without distractions in a clean, professional environment."
            case 'VIDEO_SYNC_LIMIT':
                return "📹 Sync your entire channel history, not just the latest videos. Analyze long-term trends and optimize your complete content strategy."
            case 'AI_INSIGHTS_LIMIT':
                return "🧠 Get unlimited AI insights per video. Every piece of content gets the attention it deserves with comprehensive analysis."
            case 'THUMBNAIL_GENERATIONS':
                return "🎭 Generate unlimited thumbnail variations. Test different designs and find the perfect visual hook for maximum click-through rates."
            case 'BULK_VIDEO_OPERATIONS':
                return "⚡ Process multiple videos at once with bulk operations. Save hours of manual work with automated batch processing and optimization."
            case 'ADVANCED_ANALYTICS':
                return "📊 Unlock deep analytics insights with custom date ranges, advanced metrics, and detailed performance breakdowns. Make data-driven decisions that grow your channel."
            case 'DATA_EXPORT':
                return "💾 Export your data for external analysis and backup. Download comprehensive reports, video metrics, and channel insights in multiple formats."
            case 'ADVANCED_FILTERING':
                return "🔍 Find exactly what you need with advanced filtering and search. Sort by performance, date ranges, tags, and custom criteria to manage your content library efficiently."
            case 'API_RATE_LIMIT':
                return "🚀 Scale your workflow with higher API rate limits. Process more requests per hour and handle larger content libraries without restrictions."
            case 'PRIORITY_PROCESSING':
                return "⚡ Get your AI requests processed first with priority queuing. Skip the line and get faster results when it matters most."
            case 'CUSTOM_AI_PROMPTS':
                return "🎯 Create custom AI prompts and templates tailored to your content style. Train the AI to understand your unique voice and audience preferences."
            case 'TEAM_COLLABORATION':
                return "👥 Collaborate with your team on content creation. Share access, assign tasks, and work together seamlessly on your channel growth."
            case 'WHITE_LABELING':
                return "🏷️ Remove branding and customize the experience for your team or clients. Present a professional, branded interface that matches your business."
            default:
                return "🎯 Unlock premium features designed for serious creators. Join thousands of successful YouTubers who have upgraded their workflow."
        }
    }

    const shouldShowAds = () => {
        return !hasFeature('NO_ADS')
    }

    const getPlanLevel = () => {
        return PLAN_HIERARCHY[planName as keyof typeof PLAN_HIERARCHY] || 0
    }

    const canUpgradeTo = (targetPlan: string) => {
        const currentLevel = getPlanLevel()
        const targetLevel = PLAN_HIERARCHY[targetPlan as keyof typeof PLAN_HIERARCHY] || 0
        return targetLevel > currentLevel
    }

    const getAPIRateLimit = () => {
        return FEATURE_LIMITS.API_RATE_LIMIT[planName as keyof typeof FEATURE_LIMITS.API_RATE_LIMIT] || 100
    }

    return {
        planName,
        isPro,
        isEnterprise,
        getVideoSyncLimit,
        getAIInsightsLimit,
        getThumbnailGenerationsLimit,
        getAPIRateLimit,
        hasFeature,
        canAccessFeature,
        getUpgradeMessage,
        shouldShowAds,
        getPlanLevel,
        canUpgradeTo,
    }
}

// Utility functions for checking limits
export function checkVideoSyncLimit(currentCount: number, planName: string) {
    const limit = FEATURE_LIMITS.VIDEO_SYNC_LIMIT[planName as keyof typeof FEATURE_LIMITS.VIDEO_SYNC_LIMIT] || 10
    return limit === -1 || currentCount < limit
}

export function checkAIInsightsLimit(currentCount: number, planName: string) {
    const limit = FEATURE_LIMITS.AI_INSIGHTS_PER_VIDEO[planName as keyof typeof FEATURE_LIMITS.AI_INSIGHTS_PER_VIDEO] || 1
    return limit === -1 || currentCount < limit
}

export function checkThumbnailGenerationsLimit(currentCount: number, planName: string) {
    const limit = FEATURE_LIMITS.THUMBNAIL_GENERATIONS[planName as keyof typeof FEATURE_LIMITS.THUMBNAIL_GENERATIONS] || 1
    return limit === -1 || currentCount < limit
}

export function checkAPIRateLimit(currentCount: number, planName: string) {
    const limit = FEATURE_LIMITS.API_RATE_LIMIT[planName as keyof typeof FEATURE_LIMITS.API_RATE_LIMIT] || 100
    return limit === -1 || currentCount < limit
}