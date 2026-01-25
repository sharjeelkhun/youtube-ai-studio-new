"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/contexts/auth-context"
import { UserNav } from "@/components/user-nav"
import { siteConfig } from "@/lib/config"
import { BrandLogo } from "@/components/brand-logo"
import { User } from "lucide-react"

export function SiteHeader() {
    const { user } = useAuth()

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-2 sm:px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <BrandLogo size={50} />
                        <span className="text-lg font-bold hidden sm:inline">YourAI Studio</span>
                        <span className="text-lg font-bold sm:hidden">YourAI Studio</span>
                    </Link>
                </div>
                <nav className="hidden gap-6 md:flex">
                    <Link href="/#features" className="text-sm font-bold text-muted-foreground hover:text-foreground">
                        Features
                    </Link>
                    <Link href="/#testimonials" className="text-sm font-bold text-muted-foreground hover:text-foreground">
                        Testimonials
                    </Link>
                    <Link href="/dashboard" className="text-sm font-bold text-muted-foreground hover:text-foreground">
                        Dashboard
                    </Link>
                    <Link href="/#pricing" className="text-sm font-bold text-muted-foreground hover:text-foreground">
                        Pricing
                    </Link>
                </nav>
                <div className="flex items-center gap-2 md:gap-4">
                    <ModeToggle />
                    {!user && (
                        <Link href="/login" className="sm:hidden">
                            <Button variant="ghost" size="icon" className="rounded-xl">
                                <User className="h-[1.2rem] w-[1.2rem]" strokeWidth={2.5} />
                                <span className="sr-only">Login</span>
                            </Button>
                        </Link>
                    )}
                    {user ? (
                        <UserNav />
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground font-bold">
                                    <User className="h-5 w-5" strokeWidth={2.5} />
                                    Login
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button className="font-bold">Get Started</Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
