import Link from "next/link"
import Image from "next/image"

export function SiteFooter() {
    return (
        <footer className="border-t border-border bg-background py-16">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Image
                                src="/youtube-logo.png"
                                alt="YouTube"
                                width={32}
                                height={32}
                                className="h-8 w-8"
                            />
                            <span className="text-lg font-bold text-foreground">YouTube AI Studio</span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            AI-powered YouTube analytics and optimization platform.
                        </p>
                    </div>
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-foreground">Product</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/#features" className="text-muted-foreground hover:text-foreground">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="/#pricing" className="text-muted-foreground hover:text-foreground">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="/#testimonials" className="text-muted-foreground hover:text-foreground">
                                    Testimonials
                                </Link>
                            </li>
                            <li>
                                <Link href="/#faq" className="text-muted-foreground hover:text-foreground">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-foreground">Company</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-foreground">
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-foreground">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-foreground">
                                    Careers
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-foreground">
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-foreground">Legal</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-foreground">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-foreground">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-foreground">
                                    Cookie Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 border-t border-border pt-6">
                    <p className="text-center text-sm text-muted-foreground">
                        © {new Date().getFullYear()} YouTube AI Studio. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
