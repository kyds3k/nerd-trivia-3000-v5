'use client'

import { BubbleMenu, useEditor, EditorContent } from '@tiptap/react'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Strike from '@tiptap/extension-strike'
import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import BulletList from '@tiptap/extension-bullet-list'
import TextStyle from '@tiptap/extension-text-style'
import { useEffect } from 'react'

interface TiptapProps {
  state: string
  setState: (value: string) => void
  identifier: string
  classes: string
}

const CustomAttributes = Extension.create({
  name: 'customAttributes',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'text'],
        attributes: {
          'data-editor-id': {
            default: null,
            parseHTML: element => element.getAttribute('data-editor-id'),
            renderHTML: attributes => {
              if (!attributes['data-editor-id']) {
                return {}
              }
              return {
                'data-editor-id': attributes['data-editor-id'],
              }
            },
          },
        },
      },
    ]
  },
})

const Tiptap = ({ state, setState, classes, identifier }: TiptapProps) => {
  const editor = useEditor({
    extensions: [StarterKit, Strike, TextStyle, Color, ListItem],
    content: state, // Initialize with the blurb content
    editorProps: {
      attributes: {
        class: classes,
        'data-identifier': identifier,
      },
    },
    onUpdate: ({ editor }) => {
      setState(editor.getHTML()) // Update the blurb state on content change
    },
  })

  // Optional: Update the editor content if `blurb` changes externally
  useEffect(() => {
    if (editor && editor.getHTML() !== state) {
      editor.commands.setContent(`${state}`)
    }
  }, [state, editor])

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
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`flex justify-center items-center hover:bg-gray-800 border p-2 w-8 h-8 text-black hover:text-white border-gray-600 rounded-lg ${editor.isActive('orderedList') ? 'text-bold' : ''}`}
            >
              OL
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`flex justify-center items-center hover:bg-gray-800 border p-2 w-8 h-8 text-black hover:text-white border-gray-600 rounded-lg ${editor.isActive('bulletList') ? 'text-bold' : ''}`}
            >
              UL
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
