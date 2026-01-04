/**
 * YouTube Transcript Fetcher and Analyzer
 * 
 * This module handles fetching video transcripts/captions from YouTube
 * and analyzing the content to extract key information for optimization.
 */

export interface TranscriptSegment {
    text: string
    start: number
    duration: number
}

export interface TranscriptAnalysis {
    mainTopics: string[]
    keywords: string[]
    summary: string
    estimatedDuration: number
    keyPhrases: string[]
    sentiment?: 'positive' | 'neutral' | 'negative'
}

export interface ChapterMarker {
    timestamp: string
    title: string
    topicKeywords: string[]
}

/**
 * Fetch video transcript using YouTube Data API v3
 * Falls back to youtube-transcript library if API is not available
 */
export async function getVideoTranscript(videoId: string): Promise<string | null> {
    try {
        // Try to fetch captions using YouTube Data API
        const apiKey = process.env.YOUTUBE_API_KEY

        if (apiKey) {
            const captionsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/captions?videoId=${videoId}&part=snippet&key=${apiKey}`
            )

            if (captionsResponse.ok) {
                const data = await captionsResponse.json()

                if (data.items && data.items.length > 0) {
                    // Get the first available caption track (preferably English)
                    const englishCaption = data.items.find((item: any) =>
                        item.snippet.language === 'en' || item.snippet.language === 'en-US'
                    ) || data.items[0]

                    // Download the caption content
                    const captionId = englishCaption.id
                    const captionDownload = await fetch(
                        `https://www.googleapis.com/youtube/v3/captions/${captionId}?key=${apiKey}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${apiKey}`
                            }
                        }
                    )

                    if (captionDownload.ok) {
                        return await captionDownload.text()
                    }
                }
            }
        }

        // Fallback: Use youtube-transcript library (doesn't require API key)
        const { YoutubeTranscript } = await import('youtube-transcript')
        const transcript = await YoutubeTranscript.fetchTranscript(videoId)

        if (transcript && transcript.length > 0) {
            return transcript.map((segment) => segment.text).join(' ')
        }

        return null
    } catch (error) {
        console.error('[TRANSCRIPT] Error fetching transcript:', error)
        return null
    }
}

/**
 * Analyze transcript content to extract key information
 */
export function analyzeTranscript(transcript: string): TranscriptAnalysis {
    // Clean the transcript
    const cleanText = transcript
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    // Extract keywords (words that appear frequently)
    const words = cleanText.split(' ')
    const wordFrequency: Record<string, number> = {}

    // Common stop words to filter out
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
        'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
        'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
        'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
        'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
        'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
        'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just'
    ])

    words.forEach(word => {
        if (word.length > 3 && !stopWords.has(word)) {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1
        }
    })

    // Get top keywords
    const keywords = Object.entries(wordFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([word]) => word)

    // Extract main topics (group related keywords)
    const mainTopics = extractMainTopics(keywords, cleanText)

    // Generate summary (first few sentences)
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 20)
    const summary = sentences.slice(0, 3).join('. ').trim() + '.'

    // Extract key phrases (2-3 word combinations that appear frequently)
    const keyPhrases = extractKeyPhrases(cleanText)

    // Estimate duration from word count (average speaking rate: 150 words/minute)
    const estimatedDuration = Math.ceil(words.length / 150)

    return {
        mainTopics,
        keywords,
        summary,
        estimatedDuration,
        keyPhrases
    }
}

/**
 * Detect chapter markers from timestamped transcript segments
 * Identifies topic transitions and creates accurate chapter markers
 */
function detectChapters(segments: TranscriptSegment[], keywords: string[]): ChapterMarker[] {
    if (segments.length === 0) return []

    const chapters: ChapterMarker[] = []
    const windowSize = 10 // Analyze 10 segments at a time
    const minChapterLength = 120 // Minimum 2 minutes between chapters

    let lastChapterTime = 0

    for (let i = 0; i < segments.length; i += windowSize) {
        const window = segments.slice(i, i + windowSize)
        const windowText = window.map(s => s.text).join(' ').toLowerCase()
        const currentTime = window[0].start

        // Skip if too close to last chapter
        if (currentTime - lastChapterTime < minChapterLength) continue

        // Find keywords that appear in this window
        const windowKeywords = keywords.filter(keyword =>
            windowText.includes(keyword)
        ).slice(0, 3)

        // Detect topic transition indicators
        const transitionPhrases = [
            'now let\'s', 'next up', 'moving on', 'let\'s talk about',
            'another thing', 'now we\'re going to', 'let\'s move to',
            'first', 'second', 'third', 'finally', 'lastly',
            'step one', 'step two', 'number one', 'number two'
        ]

        const hasTransition = transitionPhrases.some(phrase =>
            windowText.includes(phrase)
        )

        // Create chapter if we detect a transition or significant keyword cluster
        if (hasTransition || windowKeywords.length >= 2) {
            const timestamp = formatTimestamp(currentTime)
            const title = generateChapterTitle(windowText, windowKeywords)

            chapters.push({
                timestamp,
                title,
                topicKeywords: windowKeywords
            })

            lastChapterTime = currentTime
        }
    }

    return chapters
}

/**
 * Format seconds into MM:SS or HH:MM:SS timestamp
 */
function formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Generate a chapter title from window text and keywords
 */
function generateChapterTitle(text: string, keywords: string[]): string {
    // Try to extract a sentence that contains the keywords
    const sentences = text.split(/[.!?]+/)

    for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase()
        if (keywords.some(kw => lowerSentence.includes(kw))) {
            // Capitalize and clean up
            const cleaned = sentence.trim()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')

            // Limit length
            if (cleaned.length > 60) {
                return cleaned.substring(0, 57) + '...'
            }
            return cleaned
        }
    }

    // Fallback: Use keywords
    return keywords
        .map(kw => kw.charAt(0).toUpperCase() + kw.slice(1))
        .join(' & ')
}

/**
 * Extract main topics from keywords and text
 */
function extractMainTopics(keywords: string[], text: string): string[] {
    // Group related keywords into topics
    const topics: string[] = []
    const usedKeywords = new Set<string>()

    keywords.forEach(keyword => {
        if (usedKeywords.has(keyword)) return

        // Find related keywords (appear near each other in text)
        const relatedKeywords = keywords.filter(k => {
            if (k === keyword || usedKeywords.has(k)) return false

            // Check if keywords appear within 50 characters of each other
            const keywordIndex = text.indexOf(keyword)
            const relatedIndex = text.indexOf(k)

            return Math.abs(keywordIndex - relatedIndex) < 100
        })

        if (relatedKeywords.length > 0) {
            const topic = [keyword, ...relatedKeywords.slice(0, 2)].join(' ')
            topics.push(topic)
            usedKeywords.add(keyword)
            relatedKeywords.forEach(k => usedKeywords.add(k))
        } else if (!usedKeywords.has(keyword)) {
            topics.push(keyword)
            usedKeywords.add(keyword)
        }
    })

    return topics.slice(0, 5)
}

/**
 * Extract key phrases (2-3 word combinations)
 */
function extractKeyPhrases(text: string): string[] {
    const words = text.split(' ')
    const phrases: Record<string, number> = {}

    // Extract 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`
        if (phrase.length > 6) {
            phrases[phrase] = (phrases[phrase] || 0) + 1
        }
    }

    // Extract 3-word phrases
    for (let i = 0; i < words.length - 2; i++) {
        const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
        if (phrase.length > 10) {
            phrases[phrase] = (phrases[phrase] || 0) + 1
        }
    }

    // Get top phrases (appear at least twice)
    return Object.entries(phrases)
        .filter(([, count]) => count >= 2)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([phrase]) => phrase)
}

/**
 * Cache transcript for 24 hours to avoid hitting API limits
 */
const transcriptCache = new Map<string, { transcript: string; timestamp: number }>()

export async function getCachedTranscript(videoId: string): Promise<string | null> {
    const cached = transcriptCache.get(videoId)

    if (cached) {
        const age = Date.now() - cached.timestamp
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours

        if (age < maxAge) {
            console.log('[TRANSCRIPT] Using cached transcript for', videoId)
            return cached.transcript
        } else {
            transcriptCache.delete(videoId)
        }
    }

    const transcript = await getVideoTranscript(videoId)

    if (transcript) {
        transcriptCache.set(videoId, {
            transcript,
            timestamp: Date.now()
        })
    }

    return transcript
}
