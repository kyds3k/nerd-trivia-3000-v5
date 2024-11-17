'use client'

import { BubbleMenu, useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Strike from '@tiptap/extension-strike'
import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import { useEffect } from 'react'

interface TiptapProps {
  blurb: string
  setBlurb: (value: string) => void
}

const Tiptap = ({ blurb, setBlurb }: TiptapProps) => {
  const editor = useEditor({
    extensions: [StarterKit, Strike, TextStyle, Color, ListItem],
    content: blurb, // Initialize with the blurb content
    editorProps: {
      attributes: {
        class: 'tiptap p-4 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc'
      },
    },
    onUpdate: ({ editor }) => {
      setBlurb(editor.getHTML()) // Update the blurb state on content change
    },
  })

  // Optional: Update the editor content if `blurb` changes externally
  useEffect(() => {
    if (editor && editor.getHTML() !== blurb) {
      console.log('blurb content, should be html:', blurb)
      editor.commands.setContent(`${blurb}`)
    }
  }, [blurb, editor])

  return (
    <>
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="bubble-menu bg-gray-400 border border-gray-500 rounded-xl shadow-sm flex gap-4 p-2 align-middle">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`flex justify-center items-center hover:bg-gray-800 border p-2 w-8 h-8 text-black hover:text-white border-gray-600 rounded-lg ${editor.isActive('bold') ? 'font-bold' : ''}`}
            >
              B
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`flex justify-center items-center hover:bg-gray-800 border p-2 w-8 h-8 text-black hover:text-white border-gray-600 rounded-lg ${editor.isActive('italic') ? 'italic' : ''}`}
            >
              I
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`flex justify-center items-center hover:bg-gray-800 border p-2 w-8 h-8 text-black hover:text-white border-gray-600 rounded-lg ${editor.isActive('strike') ? 'text-bold' : ''}`}
            >
              <span className='line-through'>S</span>
            </button>
            <label htmlFor="setColor" className="flex items-center">Color</label>
            <input
              type="color"
              id="setColor"
              onInput={event => editor.chain().focus().setColor(event.target.value).run()}
              value={editor.getAttributes('textStyle').color}
              data-testid="setColor"
            />
          </div>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </>
  )
}

export default Tiptap
