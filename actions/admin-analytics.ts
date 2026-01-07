"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export async function getRevenueData() {
    try {
        // Fetch last 30 days of successful payments
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: payments, error } = await supabaseAdmin
            .from('payments')
            .select('amount, created_at, status')
            .eq('status', 'succeeded')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: true })

        if (error) throw error

        // Group by date
        const revenueByDate: Record<string, number> = {}

        payments.forEach(payment => {
            const date = new Date(payment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            revenueByDate[date] = (revenueByDate[date] || 0) + (payment.amount / 100) // Assuming amount is in cents
        })

        return Object.entries(revenueByDate).map(([date, amount]) => ({
            date,
            amount
        }))
    } catch (error) {
        console.error("Error fetching revenue data:", error)
        return []
    }
}

export async function getSubscriptionStats() {
    try {
        const { data: subscriptions, error } = await supabaseAdmin
            .from('subscriptions')
            .select('plan_id, status')
            .in('status', ['active', 'trialing'])

        if (error) throw error

        const stats: Record<string, number> = {}

        subscriptions.forEach(sub => {
            // Normalize plan names if needed, or use raw plan_id
            const plan = sub.plan_id || 'Unknown'
            stats[plan] = (stats[plan] || 0) + 1
        })

        // Also get total users to calculate "Free" (Total Users - Active Subs)
        const { count: totalUsers } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })

        const totalActiveSubs = subscriptions.length
        const freeUsers = (totalUsers || 0) - totalActiveSubs

        if (freeUsers > 0) {
            stats['Free'] = freeUsers
        }

        return Object.entries(stats).map(([name, value]) => ({
            name,
            value
        }))
    } catch (error) {
        console.error("Error fetching subscription stats:", error)
        return []
    }
}

export async function getAIUsageStats() {
    try {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: ideas, error } = await supabaseAdmin
            .from('content_ideas')
            .select('type, created_at, source')
            .eq('source', 'ai_generated')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: true })

        if (error) throw error

        // 1. Group by Type
        const typeStats: Record<string, number> = {}
        ideas.forEach(idea => {
            // Clean up type name (e.g. 'video_idea' -> 'Video Idea')
            const cleanType = idea.type.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
            typeStats[cleanType] = (typeStats[cleanType] || 0) + 1
        })

        const byType = Object.entries(typeStats).map(([name, value]) => ({ name, value }))

        // 2. Group by Date (Trend)
        const trendStats: Record<string, number> = {}
        ideas.forEach(idea => {
            const date = new Date(idea.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            trendStats[date] = (trendStats[date] || 0) + 1
        })

        const trend = Object.entries(trendStats).map(([date, count]) => ({ date, count }))

        return { byType, trend }
    } catch (error) {
        console.error("Error fetching AI usage stats:", error)
        return { byType: [], trend: [] }
    }
}
