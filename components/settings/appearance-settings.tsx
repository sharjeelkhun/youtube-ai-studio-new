"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Save, Loader2, Moon, Sun, Monitor, Type, Eye, Layout, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [appearanceSettings, setAppearanceSettings] = useState({
    reducedMotion: false,
    highContrast: false,
    fontSize: 16,
    sidebarCollapsed: false,
  })

  const handleSettingChange = (setting: string, value: any) => {
    setAppearanceSettings((prev) => ({ ...prev, [setting]: value }))
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success("Appearance settings saved", {
        description: "Your appearance preferences have been updated successfully.",
      })
    } catch (error) {
      toast.error("Error", {
        description: "Failed to save appearance settings. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Theme Hero Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Interface Theme</h3>
            <p className="text-sm text-muted-foreground">Select how the application looks on your device.</p>
          </div>
        </div>

        <RadioGroup value={theme} onValueChange={setTheme} className="grid grid-cols-3 gap-6">
          <div className="relative group">
            <RadioGroupItem value="light" id="light" className="peer sr-only" />
            <Label htmlFor="light" className="cursor-pointer">
              <div className={cn(
                "relative aspect-video rounded-xl border-2 overflow-hidden transition-all duration-300",
                theme === 'light' ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : "border-border/50 hover:border-border"
              )}>
                <div className="absolute inset-0 bg-[#f8fafc] flex flex-col">
                  <div className="h-2 w-full bg-slate-200 border-b border-slate-300" />
                  <div className="flex-1 flex gap-1 p-2">
                    <div className="w-4 bg-slate-200 rounded-md h-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-8 w-full bg-white rounded-md border border-slate-200 shadow-sm" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-12 bg-white rounded-md border border-slate-200" />
                        <div className="h-12 bg-white rounded-md border border-slate-200" />
                      </div>
                    </div>
                  </div>
                </div>
                {theme === 'light' && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                    <CheckCircle className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div className="mt-2 text-center group-hover:text-primary transition-colors">
                <span className="font-medium">Light Mode</span>
              </div>
            </Label>
          </div>

          <div className="relative group">
            <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
            <Label htmlFor="dark" className="cursor-pointer">
              <div className={cn(
                "relative aspect-video rounded-xl border-2 overflow-hidden transition-all duration-300",
                theme === 'dark' ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : "border-border/50 hover:border-border"
              )}>
                <div className="absolute inset-0 bg-[#0f172a] flex flex-col">
                  <div className="h-2 w-full bg-slate-800 border-b border-slate-700" />
                  <div className="flex-1 flex gap-1 p-2">
                    <div className="w-4 bg-slate-800 rounded-md h-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-8 w-full bg-slate-900 rounded-md border border-slate-800 shadow-sm" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-12 bg-slate-900 rounded-md border border-slate-800" />
                        <div className="h-12 bg-slate-900 rounded-md border border-slate-800" />
                      </div>
                    </div>
                  </div>
                </div>
                {theme === 'dark' && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                    <CheckCircle className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div className="mt-2 text-center group-hover:text-primary transition-colors">
                <span className="font-medium">Dark Mode</span>
              </div>
            </Label>
          </div>

          <div className="relative group">
            <RadioGroupItem value="system" id="system" className="peer sr-only" />
            <Label htmlFor="system" className="cursor-pointer">
              <div className={cn(
                "relative aspect-video rounded-xl border-2 overflow-hidden transition-all duration-300",
                theme === 'system' ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : "border-border/50 hover:border-border"
              )}>
                <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] to-[#0f172a] flex items-center justify-center">
                  <Monitor className="h-8 w-8 text-slate-500" />
                </div>
                {theme === 'system' && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                    <CheckCircle className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div className="mt-2 text-center group-hover:text-primary transition-colors">
                <span className="font-medium">System Default</span>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Accessibility */}
        <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                <Eye className="h-5 w-5" />
              </div>
              <CardTitle>Accessibility</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Reduced Motion</Label>
                <p className="text-xs text-muted-foreground">Minimize UI animations</p>
              </div>
              <Switch
                checked={appearanceSettings.reducedMotion}
                onCheckedChange={(checked) => handleSettingChange("reducedMotion", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>High Contrast</Label>
                <p className="text-xs text-muted-foreground">Enhance text legibility</p>
              </div>
              <Switch
                checked={appearanceSettings.highContrast}
                onCheckedChange={(checked) => handleSettingChange("highContrast", checked)}
              />
            </div>
            <div className="space-y-4 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  <Label>Font Size</Label>
                </div>
                <span className="text-sm font-medium">{appearanceSettings.fontSize}px</span>
              </div>
              <Slider
                min={12}
                max={20}
                step={1}
                value={[appearanceSettings.fontSize]}
                onValueChange={(value) => handleSettingChange("fontSize", value[0])}
                className="cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Interface & Layout */}
        <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <Layout className="h-5 w-5" />
              </div>
              <CardTitle>Interface</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Sidebar</Label>
                <p className="text-xs text-muted-foreground">Default to collapsed menu</p>
              </div>
              <Switch
                checked={appearanceSettings.sidebarCollapsed}
                onCheckedChange={(checked) => handleSettingChange("sidebarCollapsed", checked)}
              />
            </div>
            <div className="p-4 rounded-xl bg-muted/20 border border-border/20 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Custom themes and advanced layout options are available in our Pro plan.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Check Pro Features
              </Button>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button onClick={handleSaveSettings} disabled={isLoading} className="w-full md:w-auto ml-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
