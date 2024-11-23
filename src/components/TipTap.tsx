'use client'

import { BubbleMenu, useEditor, EditorContent } from '@tiptap/react'
import BubbleMenuContent from './BubbleMenuContent'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Strike from '@tiptap/extension-strike'
import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import BulletList from '@tiptap/extension-bullet-list'
import TextStyle from '@tiptap/extension-text-style'
import { useEffect, useState } from 'react'
import { Input } from '@nextui-org/react'

interface TiptapProps {
  state: string;
  setState: (value: string) => void;
  identifier: string;
  classes?: string;
  dataType?: "regular_question" | "bonus_question" | "other"; // Extendable
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

  const [editorStates, setEditorStates] = useState<{ [key: string]: string }>({});

  const getStateValue = (key: string) => editorStates[key] || ""; // Default to an empty string
  const setStateValue = (key: string, value: string) => {
    setEditorStates((prev) => ({
      ...prev,
      [key]: value, // Dynamically update the specific key
    }));
  };  

  const renderHeaders = (identifier: string) => {
    const match = identifier.match(/r(\d)([qags])(\d)/); // Match "r1q1", "r1a1", etc.

    if (!match) return null; // Return nothing if the format doesn't match

    const [, round, type, number] = match;
    let typeText: string;

    switch (type) {
      case "q":
        typeText = "Question";
        break;
      case "a":
        typeText = "Answer";
        break;
      default:
        return null;
    }

    return (
      <>
        <h3 className='mb-4 text-lg'>{`${typeText} ${number}`}</h3>
        <h4 className='mb-2 ml-5'>{`${typeText}:`}</h4>
      </>
    );
  };

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

  const answer = useEditor({
    extensions: [StarterKit, Strike, TextStyle, Color, ListItem],
    content: state, // Initialize with the blurb content
    editorProps: {
      attributes: {
        class: classes,
        'data-identifier': identifier.replace('q', 'a'), // Fix: Replace 'q' with 'a' in the identifier
      },
    },
    onUpdate: ({ editor }) => {
      setState(editor.getHTML()); // Update the blurb state on content change
    },
  });


  // Optional: Update the editor content if `blurb` changes externally
  useEffect(() => {
    if (editor && editor.getHTML() !== state) {
      editor.commands.setContent(`${state}`)
    }
  }, [state, editor])

  return (
    <div className="ml-5">
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <BubbleMenuContent editor={editor} />
        </BubbleMenu>
      )}
      {answer && (
        <BubbleMenu editor={answer} tippyOptions={{ duration: 100 }}>
          <BubbleMenuContent editor={answer} />
        </BubbleMenu>
      )}
      <div className="ml-0">
        <div className="ml-0">
          {renderHeaders(identifier)}
          <div className="ml-5">
            <EditorContent editor={editor} />
            <div className="py-4"></div>
            <h4 className='mb-2'>Answer:</h4>
            <EditorContent editor={answer} />
          </div>
        </div>

        {/* if identifier starts with r, output the identifier except replace "r" with "s" */}
        {identifier.startsWith('r') ? (
          <div className='ml-5'>
            <div className="mb-4">
              <h4 className="mt-6 mb-3">GIF:</h4>
              <Input
                id={identifier.replace('q', 'g')}
                data-identifier={identifier.replace('q', 'g')}
                type="text"
                value={getStateValue(identifier.replace('q', 'g'))}
                onChange={(e) => setStateValue(identifier.replace('q', 'g'), e.target.value)}
              />
            </div>
            <div className="mb-4">
              <h4 className="mt-6 mb-3">Song:</h4>
              <Input
                id={identifier.replace('q', 's')}
                data-identifier={identifier.replace('q', 's')}
                type="text"
                value={getStateValue(identifier.replace('q', 's'))}
                onChange={(e) => setStateValue(identifier.replace('q', 's'), e.target.value)}
              />
            </div>
          </div>
        ) : null}

      </div>
    </div>
  )
}

export default Tiptap
