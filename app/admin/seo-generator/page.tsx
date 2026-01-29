import { SeoGeneratorForm } from "@/components/admin/seo-generator-form"
import { AdminOverview } from "@/components/admin/admin-overview"

export default function BulkSeoPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bulk SEO Page Generator</h1>
                    <p className="text-muted-foreground">
                        Generate hundreds of SEO-optimized pages for local targeting.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SeoGeneratorForm />
                </div>
                <div>
                    {/* Placeholder for Recent Generations or Stats */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow">
                        <div className="p-6">
                            <h3 className="font-semibold leading-none tracking-tight">Quick Tips</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Use comma-separated keywords to generate multiple pages at once.
                                Ensure you have enough AI credits before starting a bulk job.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
