"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CtaActions() {
    return (
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/signup">
                <Button size="lg" className="h-14 px-8 text-lg bg-[#FF0000] hover:bg-[#CC0000] text-white rounded-xl shadow-2xl hover:shadow-[#FF0000]/25 hover:scale-105 transition-all">
                    Analyze My Channel for Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </Link>
        </div>
    )
}
