"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroActions() {
    return (
        <div className="flex flex-col gap-4 sm:flex-row w-full sm:w-auto animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <Link href="/signup">
                <Button size="lg" className="h-12 px-8 text-base bg-[#FF0000] hover:bg-[#CC0000] text-white rounded-xl shadow-[0_0_30px_-5px_#ff000066] transition-all hover:scale-105 hover:shadow-[0_0_40px_-5px_#ff000099]">
                    Analyze My Channel for Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
            <Link href="/dashboard">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base border-border hover:bg-accent hover:text-accent-foreground rounded-xl backdrop-blur-sm transition-all">
                    See How It Works
                </Button>
            </Link>
        </div>
    )
}
