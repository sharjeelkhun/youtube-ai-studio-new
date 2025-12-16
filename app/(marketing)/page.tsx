import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, CheckCircle, Play, Sparkles, Star, Users, Zap, TrendingUp, DollarSign, Search, Image as ImageIcon, Youtube, Activity, Globe, Shield } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { ScrollReveal, ScrollFade } from "@/components/scroll-reveal"
import DotGrid from "@/components/dot-grid"




export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-20">

        <DotGrid />


        <div className="relative z-10 container px-4 md:px-6">
          <div className="flex flex-col-reverse gap-12 lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div className="flex flex-col items-start space-y-8 text-left">
              <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-sm backdrop-blur-xl transition-colors hover:bg-muted">
                <span className="flex h-2 w-2 rounded-full bg-[#FF0000] mr-2 animate-pulse"></span>
                <span className="text-muted-foreground">New: AI-Powered Competitor Analysis</span>
              </div>

              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60 animate-fade-in-up">
                Skyrocket Your <span className="text-[#FF0000]">YouTube Revenue</span>
              </h1>

              <p className="max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
                Stop guessing. Start growing. Join 10,000+ creators using data-driven insights to double their views and monetization in 30 days.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row w-full sm:w-auto">
                <Link href="/signup">
                  <Button size="lg" className="h-12 px-8 text-base bg-[#FF0000] hover:bg-[#CC0000] text-white rounded-xl shadow-[0_0_30px_-5px_#ff000066] transition-all hover:scale-105 hover:shadow-[0_0_40px_-5px_#ff000099]">
                    Start Growing Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base border-border hover:bg-accent hover:text-accent-foreground rounded-xl backdrop-blur-sm transition-all">
                    View Demo
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-background overflow-hidden">
                      <Image
                        src={`/creator-avatar-${i}.png`}
                        alt={`Creator ${i}`}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                <p>Trusted by 10,000+ creators</p>
              </div>
            </div>

            {/* Hero Visual - Advanced HUD */}
            <div className="relative mx-auto w-full max-w-[600px] lg:max-w-none perspective-1000">
              <div className="relative aspect-video w-full rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden transform rotate-y-12 rotate-x-6 hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out group">
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

                {/* Scanline */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FF0000]/10 to-transparent h-[20%] w-full animate-scanline pointer-events-none z-20" />

                {/* Header Bar */}
                <div className="absolute top-0 left-0 right-0 h-12 border-b border-border bg-muted/50 flex items-center px-4 justify-between z-10">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/50" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                    <div className="h-3 w-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Activity className="h-3 w-3 text-[#FF0000] animate-pulse" />
                      Live Analysis
                    </div>
                    <div className="h-2 w-2 rounded-full bg-[#FF0000] animate-ping" />
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="absolute inset-0 pt-12 p-6 flex flex-col gap-6">
                  {/* Top Stats Row */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Total Views", value: "2.4M", change: "+124%", color: "text-foreground" },
                      { label: "Subscribers", value: "85.2K", change: "+45%", color: "text-foreground" },
                      { label: "Est. Revenue", value: "$12.4K", change: "+89%", color: "text-[#FF0000]" },
                    ].map((stat, i) => (
                      <div key={i} className="rounded-lg border border-border bg-muted/50 p-3 backdrop-blur-sm">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{stat.label}</div>
                        <div className={`text-xl font-bold ${stat.color} font-mono`}>{stat.value}</div>
                        <div className="text-[10px] text-green-500 flex items-center gap-1 mt-1">
                          <TrendingUp className="h-3 w-3" /> {stat.change}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 flex-1 min-h-0">
                    {/* Main Graph Area */}
                    <div className="flex-[2] rounded-lg border border-border bg-muted/50 p-4 relative overflow-hidden flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-xs text-zinc-400 font-mono">REVENUE TRAJECTORY</div>
                        <div className="text-xs text-[#FF0000] font-mono">+24.5%</div>
                      </div>
                      <div className="flex-1 relative">
                        <div className="absolute inset-0 flex items-end justify-between px-2 pb-2 opacity-50">
                          {[40, 65, 45, 80, 55, 90, 75, 85, 60, 95].map((h, i) => (
                            <div key={i} className="w-[8%] bg-[#FF0000]" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                          <path d="M0,100 C50,80 100,90 150,60 C200,30 250,50 300,20 L300,150 L0,150 Z" fill="url(#gradient)" opacity="0.2" />
                          <path d="M0,100 C50,80 100,90 150,60 C200,30 250,50 300,20" stroke="#FF0000" strokeWidth="2" fill="none" />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#FF0000" />
                              <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>

                    {/* Side Panel */}
                    <div className="flex-1 rounded-lg border border-border bg-muted/50 p-3 flex flex-col gap-2">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Top Videos</div>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/50 border border-border">
                          <div className="h-6 w-8 bg-muted rounded" />
                          <div className="h-2 w-12 bg-muted rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -right-4 top-20 p-4 rounded-xl border border-border bg-card/90 backdrop-blur-xl shadow-xl z-30 animate-float hidden lg:block">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#FF0000]/20 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-[#FF0000]" />
                    </div>
                    <div>
                      <div className="text-xs text-zinc-400">Viral Score</div>
                      <div className="text-lg font-bold text-foreground">98/100</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -left-4 bottom-20 p-4 rounded-xl border border-border bg-card/90 backdrop-blur-xl shadow-xl z-30 animate-float hidden lg:block" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-xs text-zinc-400">Global Reach</div>
                      <div className="text-lg font-bold text-foreground">Active</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Glow */}
              <div className="absolute -inset-4 bg-[#FF0000]/20 blur-3xl -z-10 rounded-full opacity-50" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-border bg-gradient-to-b from-background via-muted/30 to-background py-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FF0000]/5 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />

        <div className="container relative mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-[#FF0000] uppercase tracking-widest mb-3">
              Trusted Worldwide
            </p>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Join 10,000+ Successful Creators
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From emerging creators to established channels, our platform powers growth across every niche
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
            {[
              { value: "10K+", label: "Active Creators", icon: Users },
              { value: "50M+", label: "Views Generated", icon: TrendingUp },
              { value: "2.5M+", label: "Videos Optimized", icon: Play },
              { value: "98%", label: "Success Rate", icon: Star },
            ].map((stat, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className="group relative rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-6 text-center transition-all hover:border-[#FF0000]/50 hover:bg-card hover:shadow-xl hover:-translate-y-1">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FF0000]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted border border-border mb-3 group-hover:border-[#FF0000]/50 group-hover:bg-[#FF0000]/10 transition-all">
                      <stat.icon className="h-6 w-6 text-muted-foreground group-hover:text-[#FF0000] transition-colors" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Creator Avatars Marquee */}
          <div className="relative">
            <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
              <div className="animate-marquee flex gap-8 items-center py-4">
                {[
                  { name: "TechDaily", initial: "TD", color: "from-blue-500 to-cyan-500" },
                  { name: "GamingPro", initial: "GP", color: "from-purple-500 to-pink-500" },
                  { name: "LifeStyle", initial: "LS", color: "from-green-500 to-emerald-500" },
                  { name: "CreatorHub", initial: "CH", color: "from-orange-500 to-red-500" },
                  { name: "ViralTrends", initial: "VT", color: "from-yellow-500 to-orange-500" },
                  { name: "FitLife", initial: "FL", color: "from-teal-500 to-cyan-500" },
                  { name: "CookMaster", initial: "CM", color: "from-rose-500 to-pink-500" },
                  { name: "TravelVlog", initial: "TV", color: "from-indigo-500 to-purple-500" },
                  { name: "TechDaily", initial: "TD", color: "from-blue-500 to-cyan-500" },
                  { name: "GamingPro", initial: "GP", color: "from-purple-500 to-pink-500" },
                ].map((creator, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-3 px-5 py-3 rounded-xl border border-border bg-card/30 backdrop-blur-sm hover:bg-card hover:border-[#FF0000]/30 transition-all cursor-default"
                  >
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${creator.color} flex items-center justify-center border-2 border-border group-hover:border-[#FF0000]/50 transition-all group-hover:scale-110 shadow-lg`}>
                      <span className="text-white font-bold text-sm">{creator.initial}</span>
                    </div>
                    <span className="text-base font-semibold text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
                      {creator.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* AI Models Showcase Section - Clean Premium Design */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Subtle Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background" />

        <div className="container relative mx-auto px-4 md:px-6">
          {/* Header */}
          <ScrollFade direction="up">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FF0000]/20 bg-[#FF0000]/5">
                <Zap className="h-3.5 w-3.5 text-[#FF0000]" />
                <span className="text-xs font-semibold text-[#FF0000] uppercase tracking-wider">
                  Multiple AI Models
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                <span className="text-foreground">Switch Between </span>
                <span className="text-[#FF0000]">Any AI Model</span>
              </h2>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                Access ChatGPT, Gemini, Claude, Mistral, and more from one platform.
              </p>
            </div>
          </ScrollFade>

          {/* Clean AI Models Grid */}
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
              {[
                { name: "ChatGPT", logo: "/chatgpt-logo.svg", color: "hover:border-green-500/50" },
                { name: "Gemini", logo: "/gemini-logo.svg", color: "hover:border-blue-500/50" },
                { name: "Claude", logo: "/claude-logo.svg", color: "hover:border-orange-500/50" },
                { name: "Mistral", logo: "/mistral-logo.svg", color: "hover:border-red-500/50" },
                { name: "Google AI", logo: "/youtube-logo.png", color: "hover:border-[#FF0000]/50" },
              ].map((model, i) => (
                <ScrollReveal
                  key={i}
                  delay={i * 0.1}
                  className={`group relative ${i === 4 ? 'col-span-2 md:col-span-1' : ''}`}
                >
                  <div className={`relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:bg-card hover:shadow-lg hover:-translate-y-1 ${model.color}`}>
                    {/* Logo */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg bg-muted/50 border border-border flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                        <Image
                          src={model.logo}
                          alt={model.name}
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      </div>
                      <p className="text-sm font-semibold text-foreground text-center">
                        {model.name}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Simple Feature List */}
            <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-muted-foreground">
              {[
                { icon: Zap, text: "Instant switching" },
                { icon: TrendingUp, text: "Best performance" },
                { icon: Shield, text: "Always updated" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-[#FF0000]" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section (Antigravity Style) */}
      <section id="features" className="py-24 md:py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="mb-20 text-center space-y-4 animate-scroll-reveal">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl text-foreground">
              Everything You Need to <span className="text-[#FF0000]">Dominate</span>
            </h2>
            <p className="text-muted-foreground md:text-xl max-w-2xl mx-auto">
              Advanced tools designed for the next generation of content creators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Viral Prediction Engine",
                desc: "AI analyzes millions of data points to predict which topics will explode before they happen.",
                icon: Zap,
                col: "md:col-span-2",
                gradient: "from-[#FF0000]/20 via-transparent to-transparent"
              },
              {
                title: "Thumbnail A/B Testing",
                desc: "Automatically generate and test high-converting thumbnails.",
                icon: ImageIcon,
                col: "md:col-span-1",
                gradient: "from-blue-500/20 via-transparent to-transparent"
              },
              {
                title: "Revenue Intelligence",
                desc: "Maximize your RPM with smart keyword targeting and sponsor matching.",
                icon: DollarSign,
                col: "md:col-span-1",
                gradient: "from-green-500/20 via-transparent to-transparent"
              },
              {
                title: "Competitor Deep-Dive",
                desc: "See exactly what's working for your competitors and why.",
                icon: Search,
                col: "md:col-span-2",
                gradient: "from-purple-500/20 via-transparent to-transparent"
              }
            ].map((feature, i) => (
              <div key={i} className={`group relative p-8 rounded-3xl border border-border bg-card/50 hover:bg-card transition-all duration-500 hover:border-[#FF0000]/50 overflow-hidden ${feature.col} animate-scroll-reveal`} style={{ animationDelay: `${i * 100}ms` }}>
                {/* Hover Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10 h-full flex flex-col">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted border border-border group-hover:scale-110 transition-transform duration-500 group-hover:border-[#FF0000]/50">
                    <feature.icon className="h-7 w-7 text-foreground group-hover:text-[#FF0000] transition-colors" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-foreground group-hover:translate-x-2 transition-transform">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-8 flex-1">
                    {feature.desc}
                  </p>

                  <div className="flex items-center text-sm font-bold text-[#FF0000] opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Learn more <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials (Masonry-style) */}
      <section id="testimonials" className="bg-muted/30 py-24 md:py-32 relative overflow-hidden border-y border-border">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FF0000]/5 via-transparent to-transparent" />
        <div className="container relative mx-auto px-4 md:px-6">
          <div className="mb-16 text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl text-foreground">Trusted by Content Creators</h2>
            <p className="mt-4 text-muted-foreground md:text-xl max-w-2xl mx-auto leading-relaxed">
              Join the community of creators who are scaling their channels faster than ever.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
            {[
              {
                quote:
                  "YouTube AI Studio has completely transformed how I approach content creation. The AI suggestions are spot on!",
                author: "Alex Johnson",
                role: "Tech YouTuber, 500K subscribers",
                avatar: "/placeholder.svg",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20"
              },
              {
                quote:
                  "I've increased my views by 45% in just two months using the SEO optimization tools. Absolutely worth it!",
                author: "Sarah Williams",
                role: "Lifestyle Creator, 250K subscribers",
                avatar: "/placeholder.svg",
                bg: "bg-purple-500/10",
                border: "border-purple-500/20"
              },
              {
                quote:
                  "The analytics insights helped me understand exactly what my audience wants. My engagement has never been higher.",
                author: "Michael Chen",
                role: "Gaming Channel, 1M subscribers",
                avatar: "/placeholder.svg",
                bg: "bg-green-500/10",
                border: "border-green-500/20"
              },
            ].map((testimonial, index) => (
              <ScrollReveal key={index} delay={index * 0.15}>
                <div className={`flex flex-col rounded-2xl border bg-card/40 backdrop-blur-xl p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 ${testimonial.border} hover:border-opacity-50`}>
                  <div className="flex-1">
                    <div className="flex gap-1 mb-4">
                      {Array(5)
                        .fill(null)
                        .map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-[#FF0000] text-[#FF0000]" />
                        ))}
                    </div>
                    <blockquote className="mb-6">
                      <p className="text-foreground leading-relaxed text-lg font-medium">"{testimonial.quote}"</p>
                    </blockquote>
                  </div>
                  <div className="flex items-center gap-4 pt-6 border-t border-border">
                    <div className={`h-12 w-12 rounded-full ${testimonial.bg} flex items-center justify-center text-lg font-bold text-white`}>
                      {testimonial.author[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 md:py-32 bg-gradient-to-b from-background to-muted/10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-16 text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-muted-foreground md:text-xl max-w-2xl mx-auto leading-relaxed">Choose the plan that's right for your channel.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Starter",
                price: "Free",
                description: "Perfect for new creators looking to grow their channel.",
                features: ["Basic Analytics", "5 AI Content Suggestions per month", "Basic SEO Tools", "Email Support"],
                cta: "Get Started",
                ctaLink: "/signup?plan=starter",
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
                ctaLink: "/signup?plan=professional",
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
                cta: "Get Started",
                ctaLink: "/signup?plan=enterprise",
                popular: false,
              },
            ].map((plan, index) => (
              <ScrollReveal key={index} delay={index * 0.15}>
                <div className={`relative flex flex-col rounded-2xl border bg-card/50 backdrop-blur-xl p-8 shadow-lg transition-all hover:shadow-2xl hover:-translate-y-2 ${plan.popular ? "border-[#FF0000] ring-1 ring-[#FF0000]/20 scale-105 z-10 bg-card" : "border-border hover:border-foreground/20"}`}>
                  {plan.popular && (
                    <>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF0000]/10 via-transparent to-[#FF0000]/10 opacity-20 animate-pulse pointer-events-none" />
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#FF0000] px-4 py-1.5 text-xs font-bold text-white shadow-lg animate-shine">
                        Most Popular
                      </div>
                    </>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-5xl font-extrabold tracking-tight text-foreground">{plan.price}</span>
                      <span className="ml-2 text-muted-foreground font-medium">/month</span>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                  </div>
                  <ul className="mb-8 flex-1 space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <div className={`mr-3 mt-1 h-4 w-4 rounded-full flex items-center justify-center ${plan.popular ? "bg-[#FF0000] text-white" : "bg-muted text-muted-foreground"}`}>
                          <CheckCircle className="h-3 w-3" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.ctaLink || "#"}>
                    <Button
                      size="lg"
                      className={`w-full rounded-xl font-bold transition-all ${plan.popular
                        ? "bg-[#FF0000] hover:bg-[#CC0000] text-white shadow-lg hover:shadow-[#FF0000]/25"
                        : "bg-muted text-foreground hover:bg-muted/80"
                        }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">All plans include a 14-day free trial. No credit card required.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 md:py-32 bg-background border-t border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-16 text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground md:text-xl max-w-2xl mx-auto">
              Everything you need to know about YouTube AI Studio.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: "Do I need a credit card to start?",
                a: "No, you can start your 14-day free trial without entering any payment information."
              },
              {
                q: "Can I cancel my subscription anytime?",
                a: "Yes, you can cancel your subscription at any time from your account settings. No questions asked."
              },
              {
                q: "Is my channel data safe?",
                a: "Absolutely. We use enterprise-grade encryption and never share your data with third parties. We are fully compliant with YouTube's API Terms of Service."
              },
              {
                q: "What happens after my trial ends?",
                a: "You can choose to upgrade to one of our paid plans or continue with our limited free tier."
              }
            ].map((faq, i) => (
              <ScrollFade key={i} delay={i * 0.1} direction="up">
                <div className="rounded-2xl border border-border bg-muted/30 p-6 hover:bg-muted/50 transition-colors">
                  <h3 className="text-lg font-bold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              </ScrollFade>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 relative overflow-hidden border-t border-border bg-background">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50" />
        <div className="absolute inset-0 bg-[#FF0000]/5 blur-3xl" />

        <div className="container relative mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
            Ready to Go <span className="text-[#FF0000]">Viral?</span>
          </h2>
          <p className="text-muted-foreground md:text-xl max-w-2xl mx-auto mb-10">
            Join thousands of creators who are already using YouTube AI Studio to grow their channels.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 text-lg bg-[#FF0000] hover:bg-[#CC0000] text-white rounded-xl shadow-2xl hover:shadow-[#FF0000]/25 hover:scale-105 transition-all">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>


    </div>
  )
}
