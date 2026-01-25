import Link from "next/link"
import { siteConfig } from "@/lib/config"
import { BrandLogo } from "@/components/brand-logo"

export function SiteFooter() {
    return (
        <footer className="border-t border-border bg-background py-10 md:py-16">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 text-center sm:text-left">
                    <div className="flex flex-col items-center sm:items-start">
                        <div className="flex items-center gap-2">
                            <BrandLogo size={26} />
                            <span className="text-lg font-bold text-foreground">YourAI Studio</span>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground max-w-xs">
                            AI-powered YouTube analytics and optimization platform.
                        </p>
                    </div>
                    <div>
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">Product</h3>
                        <ul className="space-y-3 text-sm font-medium">
                            <li>
                                <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="/#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Testimonials
                                </Link>
                            </li>
                            <li>
                                <Link href="/#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">Company</h3>
                        <ul className="space-y-3 text-sm font-medium">
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors cursor-not-allowed opacity-50">
                                    Blog (Coming Soon)
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Careers
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">Legal</h3>
                        <ul className="space-y-3 text-sm font-medium">
                            <li>
                                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Cookie Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 border-t border-border pt-6">
                    <p className="text-center text-sm text-muted-foreground">
                        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
