'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Download, 
  Upload, 
  Image as ImageIcon, 
  Settings, 
  RotateCw, 
  Crop, 
  Palette,
  Zap,
  FileImage,
  CheckCircle,
  AlertCircle,
  Loader,
  Wand2,
  ArrowDown,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface OptimizedImage {
  blob: Blob
  url: string
  size: number
  originalSize: number
  compressionRatio: number
  format: string
  dimensions: {
    width: number
    height: number
  }
}

interface ImageOptimizationProps {
  thumbnailUrl: string
  videoTitle: string
  onOptimizedImage?: (optimizedImage: OptimizedImage) => void
  isAiConfigured?: boolean
  aiProvider?: string
}

export function ImageOptimization({ thumbnailUrl, videoTitle, onOptimizedImage, isAiConfigured, aiProvider }: ImageOptimizationProps) {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
  const [optimizedImages, setOptimizedImages] = useState<OptimizedImage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAiOptimizing, setIsAiOptimizing] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<'webp' | 'jpeg' | 'png'>('webp')
  const [quality, setQuality] = useState([85])
  const [maxWidth, setMaxWidth] = useState([1280])
  const [maxHeight, setMaxHeight] = useState([720])
  const [isLoading, setIsLoading] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState(thumbnailUrl)
  const [showManualSettings, setShowManualSettings] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadOriginalImage = useCallback(async () => {
    if (!thumbnailUrl) return
    
    setIsLoading(true)
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = thumbnailUrl
      })
      
      setOriginalImage(img)
      toast.success('Image loaded successfully')
    } catch (error) {
      console.error('Error loading image:', error)
      toast.error('Failed to load image')
    } finally {
      setIsLoading(false)
    }
  }, [thumbnailUrl])

  const optimizeImage = useCallback(async () => {
    if (!originalImage) {
      toast.error('Please load an image first')
      return
    }

    setIsProcessing(true)
    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Calculate new dimensions while maintaining aspect ratio
      const aspectRatio = originalImage.width / originalImage.height
      let newWidth = maxWidth[0]
      let newHeight = maxHeight[0]

      if (aspectRatio > 1) {
        // Landscape
        newHeight = Math.min(newWidth / aspectRatio, maxHeight[0])
      } else {
        // Portrait or square
        newWidth = Math.min(newHeight * aspectRatio, maxWidth[0])
      }

      // Set canvas dimensions
      canvas.width = newWidth
      canvas.height = newHeight

      // Draw and optimize image
      ctx.drawImage(originalImage, 0, 0, newWidth, newHeight)

      const results: OptimizedImage[] = []

      // Generate different formats
      const formats: Array<'webp' | 'jpeg' | 'png'> = ['webp', 'jpeg', 'png']
      
      for (const format of formats) {
        const mimeType = `image/${format}`
        const qualityValue = format === 'png' ? undefined : quality[0] / 100

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob!)
          }, mimeType, qualityValue)
        })

        const url = URL.createObjectURL(blob)
        const originalSize = originalImage.width * originalImage.height * 4 // Rough estimate
        const compressionRatio = ((originalSize - blob.size) / originalSize) * 100

        results.push({
          blob,
          url,
          size: blob.size,
          originalSize,
          compressionRatio: Math.max(0, compressionRatio),
          format,
          dimensions: { width: newWidth, height: newHeight }
        })
      }

      setOptimizedImages(results)
      toast.success('Image optimization completed')
    } catch (error) {
      console.error('Error optimizing image:', error)
      toast.error('Failed to optimize image')
    } finally {
      setIsProcessing(false)
    }
  }, [originalImage, maxWidth, maxHeight, quality])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    const img = new Image()
    img.onload = () => {
      setOriginalImage(img)
      toast.success('Custom image loaded successfully')
    }
    img.onerror = () => {
      toast.error('Failed to load custom image')
    }
    img.src = URL.createObjectURL(file)
  }, [])

  const downloadImage = useCallback((optimizedImage: OptimizedImage) => {
    const link = document.createElement('a')
    link.href = optimizedImage.url
    link.download = `${videoTitle.replace(/[^a-zA-Z0-9]/g, '_')}_optimized.${optimizedImage.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Image downloaded successfully')
  }, [videoTitle])

  const applyOptimizedImage = useCallback((optimizedImage: OptimizedImage) => {
    if (onOptimizedImage) {
      onOptimizedImage(optimizedImage)
      setCurrentImageUrl(optimizedImage.url)
      toast.success('Optimized image applied')
    }
  }, [onOptimizedImage])

  const downloadCurrentThumbnail = useCallback(async () => {
    try {
      const response = await fetch(thumbnailUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${videoTitle.replace(/[^a-zA-Z0-9]/g, '_')}_thumbnail.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Thumbnail downloaded successfully')
    } catch (error) {
      console.error('Error downloading thumbnail:', error)
      toast.error('Failed to download thumbnail')
    }
  }, [thumbnailUrl, videoTitle])

  const handleAiOptimize = useCallback(async () => {
    if (!isAiConfigured) {
      toast.error('AI Provider Not Configured', {
        description: 'Please select an AI provider and add your API key in the settings.',
      })
      return
    }

    setIsAiOptimizing(true)
    try {
      const response = await fetch('/api/ai/optimize-thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thumbnailUrl: currentImageUrl,
          videoTitle: videoTitle,
          provider: aiProvider
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to optimize thumbnail with AI')
      }

      const data = await response.json()
      
      // Convert base64 to blob
      const base64Data = data.optimizedImage.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)

      const optimizedImage: OptimizedImage = {
        blob,
        url,
        size: blob.size,
        originalSize: 0, // We don't have original size for AI optimized
        compressionRatio: 0,
        format: 'jpeg',
        dimensions: { width: 1280, height: 720 } // Default YouTube thumbnail size
      }

      setOptimizedImages([optimizedImage])
      toast.success('AI optimization completed')
    } catch (error) {
      console.error('Error with AI optimization:', error)
      toast.error('AI Optimization Failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    } finally {
      setIsAiOptimizing(false)
    }
  }, [isAiConfigured, currentImageUrl, videoTitle, aiProvider])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card data-image-optimization>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Thumbnail Optimization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Thumbnail Preview */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <Label className="text-sm font-medium">Current Thumbnail</Label>
            <div className="flex items-center gap-2">
              {/* Download and AI Optimize buttons moved above image */}
              <Button
                size="sm"
                variant="secondary"
                onClick={downloadCurrentThumbnail}
                className="justify-center whitespace-nowrap font-medium transition-colors rounded-md flex items-center gap-1.5 h-7 px-2 text-sm"
              >
                <Download className="mr-2 h-3.5 w-3.5" />
                Download
              </Button>
              {isAiConfigured && (
                <Button
                  size="sm"
                  onClick={handleAiOptimize}
                  disabled={isAiOptimizing}
                  className="justify-center whitespace-nowrap font-medium transition-colors rounded-md flex items-center gap-1.5 h-7 px-2 text-sm"
                >
                  {isAiOptimizing ? (
                    <Loader className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-3.5 w-3.5" />
                  )}
                  AI Optimize
                </Button>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <img
                src={currentImageUrl}
                alt="Current thumbnail"
                className="w-full h-full object-cover"
                onLoad={() => {
                  const img = new Image()
                  img.src = currentImageUrl
                  setOriginalImage(img)
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Your Image
          </Button>
          
          {!isAiConfigured && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                Configure AI provider in settings for AI optimization
              </span>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Manual Optimization Settings - Collapsed by default */}
        {originalImage && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Manual Settings</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManualSettings(!showManualSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            
            {showManualSettings && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Max Width: {maxWidth[0]}px</Label>
                    <Slider
                      value={maxWidth}
                      onValueChange={setMaxWidth}
                      max={originalImage.width}
                      min={320}
                      step={10}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Max Height: {maxHeight[0]}px</Label>
                    <Slider
                      value={maxHeight}
                      onValueChange={setMaxHeight}
                      max={originalImage.height}
                      min={180}
                      step={10}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Quality: {quality[0]}%</Label>
                  <Slider
                    value={quality}
                    onValueChange={setQuality}
                    max={100}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                </div>

                <Button
                  onClick={optimizeImage}
                  disabled={isProcessing}
                  className="w-full"
                  variant="outline"
                >
                  {isProcessing ? (
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Optimize Manually
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Optimized Results */}
        {optimizedImages.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-medium">Optimized Results</Label>
            <div className="space-y-3">
              {optimizedImages.map((optimizedImage, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      <span className="font-medium capitalize">{optimizedImage.format.toUpperCase()}</span>
                      {optimizedImage.compressionRatio > 0 && (
                        <Badge variant={optimizedImage.compressionRatio > 50 ? 'default' : 'secondary'}>
                          {optimizedImage.compressionRatio.toFixed(1)}% smaller
                        </Badge>
                      )}
                      {optimizedImage.compressionRatio === 0 && (
                        <Badge variant="outline">
                          AI Optimized
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => applyOptimizedImage(optimizedImage)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Apply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadImage(optimizedImage)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Size:</span>
                      <div className="font-medium">{formatFileSize(optimizedImage.size)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dimensions:</span>
                      <div className="font-medium">
                        {optimizedImage.dimensions.width} × {optimizedImage.dimensions.height}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quality:</span>
                      <div className="font-medium">{quality[0]}%</div>
                    </div>
                  </div>
                  
                  <div className="aspect-video w-full max-w-xs mx-auto rounded overflow-hidden">
                    <img
                      src={optimizedImage.url}
                      alt={`Optimized ${optimizedImage.format}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Progress */}
        {(isProcessing || isAiOptimizing) && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              <Label className="text-sm">
                {isAiOptimizing ? 'AI optimizing image...' : 'Optimizing image...'}
              </Label>
            </div>
            <Progress value={isAiOptimizing ? 75 : 50} className="w-full" />
          </div>
        )}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  )
}
