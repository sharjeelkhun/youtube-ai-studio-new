"use client"

import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from './ui/button'
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, StrikethroughIcon } from 'lucide-react'
import * as Toolbar from '@radix-ui/react-toolbar'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder = 'Start writing...' }: RichTextEditorProps) {
  // Track if component is mounted
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-stone dark:prose-invert prose-sm sm:prose-base focus:outline-none min-h-[100px]',
      },
    },
    // Add these options to fix SSR issues
    enableCoreExtensions: true,
    enableInputRules: true,
    enablePasteRules: true,
    immediatelyRender: false,
  })

  // Don't render until mounted on client
  if (!isMounted) {
    return <div className="border rounded-md min-h-[200px] animate-pulse bg-muted/10" />
  }

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-md">
      <Toolbar.Root className="border-b p-1 bg-muted/30 flex flex-wrap gap-1" role="toolbar" aria-label="Text formatting">
        <Toolbar.Button asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-muted' : ''}
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
        </Toolbar.Button>
        
        <Toolbar.Button asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-muted' : ''}
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
        </Toolbar.Button>

        <Toolbar.Button asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'bg-muted' : ''}
            aria-label="Strikethrough"
          >
            <StrikethroughIcon className="h-4 w-4" />
          </Button>
        </Toolbar.Button>

        <Toolbar.Separator className="w-[1px] bg-border mx-1 h-6" />

        <Toolbar.Button asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
            aria-label="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
        </Toolbar.Button>

        <Toolbar.Button asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
            aria-label="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
        </Toolbar.Button>

        <Toolbar.Separator className="w-[1px] bg-border mx-1 h-6" />

        <Toolbar.Button asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-muted' : ''}
            aria-label="Bullet list"
          >
            <List className="h-4 w-4" />
          </Button>
        </Toolbar.Button>

        <Toolbar.Button asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-muted' : ''}
            aria-label="Numbered list"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </Toolbar.Button>
      </Toolbar.Root>

      <div className="p-2 min-h-[200px] max-h-[500px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}