"use client"

import { useEffect, useCallback, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { RichTextEditor } from "./rich-text-editor"
import { ContentIdea, IdeaType, IdeaStatus } from "@/lib/types/ideas"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"

interface EditIdeaDialogProps {
  idea: ContentIdea
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updates: Partial<ContentIdea>) => Promise<void>
}

interface FormData {
  title: string
  description: string
  type: IdeaType
  status: IdeaStatus
}

export function EditIdeaDialog({
  idea,
  open,
  onOpenChange,
  onSave
}: EditIdeaDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      title: idea.title,
      description: idea.description || "",
      type: idea.type,
      status: idea.status
    }
  })

  const isMountedRef = useRef(false)

  useEffect(() => {
    if (open) {
      reset({
        title: idea.title,
        description: idea.description || "",
        type: idea.type,
        status: idea.status
      })
    }
  }, [idea, open, reset])

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      document.body.style.removeProperty("pointer-events")
    }
  }, [])

  useEffect(() => {
    if (!open && document.body.style.pointerEvents === "none") {
      document.body.style.removeProperty("pointer-events")
    }
  }, [open])

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!isSubmitting) {
        if (!newOpen) {
          requestAnimationFrame(() => {
            if (document.body.style.pointerEvents === "none") {
              document.body.style.removeProperty("pointer-events")
            }
          })
          reset()
        }
        onOpenChange(newOpen)
      }
    },
    [isSubmitting, onOpenChange, reset]
  )

  const onSubmit = async (data: FormData) => {
    try {
      await onSave(data)
      toast.success("Changes saved successfully")
      handleOpenChange(false)
    } catch (error) {
      console.error("Error saving changes:", error)
      toast.error("Failed to save changes")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          // Prevent autofocus if we're closing
          if (!open) {
            e.preventDefault()
          }
        }}
        onInteractOutside={(e) => {
          if (isSubmitting) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isSubmitting) {
            e.preventDefault()
          }
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          if (document.body.style.pointerEvents === "none") {
            document.body.style.removeProperty("pointer-events")
          }
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Content Idea</DialogTitle>
            <DialogDescription>
              Make changes to your content idea. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
                className="w-full"
                autoComplete="off"
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Controller
                name="type"
                control={control}
                rules={{ required: "Type is required" }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    onOpenChange={(open) => {
                      if (isSubmitting) return
                      field.onBlur()
                    }}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="video_idea">Video Idea</SelectItem>
                        <SelectItem value="script_outline">
                          Script Outline
                        </SelectItem>
                        <SelectItem value="series_idea">Series Idea</SelectItem>
                        <SelectItem value="collaboration_idea">
                          Collaboration Idea
                        </SelectItem>
                        <SelectItem value="tutorial_idea">
                          Tutorial Idea
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                rules={{ required: "Status is required" }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    onOpenChange={(open) => {
                      if (isSubmitting) return
                      field.onBlur()
                    }}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="saved">Saved</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <p className="text-sm text-destructive">
                  {errors.status.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    content={field.value}
                    onChange={field.onChange}
                    placeholder="Write your content description here..."
                  />
                )}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}