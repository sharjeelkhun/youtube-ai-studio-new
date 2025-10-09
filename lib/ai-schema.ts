import type { ContentSuggestion, TrendingTopic, VideoImprovement } from "./types"

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

export function isContentSuggestionArray(v: unknown): v is ContentSuggestion[] {
  if (!Array.isArray(v)) return false
  return v.every((item) => {
    if (!isObject(item)) return false
    return (
      typeof (item as any).title === "string" &&
      typeof (item as any).type === "string" &&
      typeof (item as any).description === "string" &&
      isObject((item as any).metrics) &&
      isObject((item as any).metadata)
    )
  })
}

export function isTrendingTopicArray(v: unknown): v is TrendingTopic[] {
  if (!Array.isArray(v)) return false
  return v.every((item) => {
    if (!isObject(item)) return false
    return (
      typeof (item as any).id === "string" &&
      typeof (item as any).title === "string" &&
      typeof (item as any).growth === "string" &&
      typeof (item as any).description === "string"
    )
  })
}

export function isVideoImprovementArray(v: unknown): v is VideoImprovement[] {
  if (!Array.isArray(v)) return false
  return v.every((item) => {
    if (!isObject(item)) return false
    return (
      typeof (item as any).videoId === "string" &&
      typeof (item as any).videoTitle === "string" &&
      Array.isArray((item as any).suggestions)
    )
  })
}
