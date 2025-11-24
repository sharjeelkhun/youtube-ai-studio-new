import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ModeToggle } from "@/components/mode-toggle"

export function SiteHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src="/youtube-logo.png"
                            alt="YouTube"
                            width={32}
                            height={32}
                            className="h-8 w-8"
                        />
                        <span className="text-lg font-bold hidden sm:inline">YouTube AI Studio</span>
                        <span className="text-lg font-bold sm:hidden">AI Studio</span>
                    </Link>
                </div>
                <nav className="hidden gap-6 md:flex">
                    <Link href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                        Features
                    </Link>
                    <Link href="/#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                        Testimonials
                    </Link>
                    <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                        Dashboard
                    </Link>
                    <Link href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                        Pricing
                    </Link>
                </nav>
                <div className="flex items-center gap-4">
                    <ModeToggle />
                    <Link href="/dashboard">
                        <Button variant="ghost" className="hidden sm:flex">
                            Dashboard
                        </Button>
                    </Link>
                    <Link href="/signup">
                        <Button>Get Started</Button>
                    </Link>
                </div>
            </div>
        </header>
    )
}
