import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, Play, Sparkles, Star, Users } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">YouTube AI Studio</span>
          </div>
          <nav className="hidden gap-6 md:flex">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Testimonials
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="hidden sm:flex">
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted/30 py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Supercharge Your YouTube Channel with AI
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Optimize your content, grow your audience, and increase revenue with our AI-powered YouTube analytics
                  and optimization platform.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/dashboard">
                  <Button size="lg" className="group">
                    Start for Free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button size="lg" variant="outline">
                    <Play className="mr-2 h-4 w-4" />
                    Watch Demo
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>No credit card required</span>
                <span className="mx-2">•</span>
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>14-day free trial</span>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-background shadow-xl">
                <img
                  src="/placeholder.svg?height=720&width=1280"
                  alt="YouTube AI Studio Dashboard"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-lg font-semibold text-white">AI-Powered Analytics Dashboard</h3>
                  <p className="text-sm text-white/80">Get insights and recommendations in real-time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Everything You Need to Grow Your Channel
            </h2>
            <p className="mt-4 text-muted-foreground md:text-xl">
              Our platform provides all the tools you need to optimize your content and grow your audience.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "AI Content Suggestions",
                description: "Get personalized content ideas based on trending topics and your audience's interests.",
                icon: Sparkles,
              },
              {
                title: "Advanced Analytics",
                description:
                  "Dive deep into your channel's performance with detailed analytics and actionable insights.",
                icon: Star,
              },
              {
                title: "SEO Optimization",
                description:
                  "Optimize your video titles, descriptions, and tags to rank higher in YouTube search results.",
                icon: ArrowRight,
              },
              {
                title: "Audience Insights",
                description: "Understand your audience demographics, interests, and viewing habits.",
                icon: Users,
              },
              {
                title: "Performance Tracking",
                description: "Track your channel's growth and performance over time with detailed reports.",
                icon: CheckCircle,
              },
              {
                title: "Competitor Analysis",
                description: "Analyze your competitors' content and strategies to stay ahead of the curve.",
                icon: Play,
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
                <div className="mt-4">
                  <Button variant="link" className="p-0 group-hover:underline">
                    Learn more
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-muted/30 py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Trusted by Content Creators</h2>
            <p className="mt-4 text-muted-foreground md:text-xl">
              See what our users have to say about YouTube AI Studio.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote:
                  "YouTube AI Studio has completely transformed how I approach content creation. The AI suggestions are spot on!",
                author: "Alex Johnson",
                role: "Tech YouTuber, 500K subscribers",
                avatar: "/placeholder.svg",
              },
              {
                quote:
                  "I've increased my views by 45% in just two months using the SEO optimization tools. Absolutely worth it!",
                author: "Sarah Williams",
                role: "Lifestyle Creator, 250K subscribers",
                avatar: "/placeholder.svg",
              },
              {
                quote:
                  "The analytics insights helped me understand exactly what my audience wants. My engagement has never been higher.",
                author: "Michael Chen",
                role: "Gaming Channel, 1M subscribers",
                avatar: "/placeholder.svg",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="flex flex-col rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex-1">
                  <div className="flex gap-0.5">
                    {Array(5)
                      .fill(null)
                      .map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                      ))}
                  </div>
                  <blockquote className="mt-4">
                    <p className="text-muted-foreground">"{testimonial.quote}"</p>
                  </blockquote>
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.author}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-muted-foreground md:text-xl">Choose the plan that's right for your channel.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Starter",
                price: "$19",
                description: "Perfect for new creators looking to grow their channel.",
                features: ["Basic Analytics", "5 AI Content Suggestions per month", "Basic SEO Tools", "Email Support"],
                cta: "Get Started",
                popular: false,
              },
              {
                name: "Professional",
                price: "$49",
                description: "For serious creators who want to accelerate their growth.",
                features: [
                  "Advanced Analytics",
                  "Unlimited AI Content Suggestions",
                  "Advanced SEO Tools",
                  "Competitor Analysis",
                  "Priority Support",
                ],
                cta: "Get Started",
                popular: true,
              },
              {
                name: "Enterprise",
                price: "$99",
                description: "For established creators and multi-channel networks.",
                features: [
                  "Custom Analytics Dashboard",
                  "Unlimited AI Content Suggestions",
                  "Advanced SEO Tools",
                  "Competitor Analysis",
                  "Dedicated Account Manager",
                  "API Access",
                ],
                cta: "Contact Sales",
                popular: false,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`relative flex flex-col rounded-lg border ${
                  plan.popular ? "border-primary shadow-lg" : "bg-background shadow-sm"
                } p-6`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="ml-1 text-muted-foreground">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <ul className="mb-6 flex-1 space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full ${plan.popular ? "" : "bg-muted-foreground/80 hover:bg-muted-foreground"}`}>
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">All plans include a 14-day free trial. No credit card required.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to grow your YouTube channel?</h2>
              <p className="mt-2 text-primary-foreground/80">
                Join thousands of creators who are using YouTube AI Studio to optimize their content.
              </p>
            </div>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="w-full md:w-auto">
                Get Started for Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">YouTube AI Studio</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                AI-powered YouTube analytics and optimization platform.
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Testimonials
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold">Company</h3>
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
              <h3 className="mb-4 text-sm font-semibold">Legal</h3>
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
          <div className="mt-12 border-t pt-6">
            <p className="text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} YouTube AI Studio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
