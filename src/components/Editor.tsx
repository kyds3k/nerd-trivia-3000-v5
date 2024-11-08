"use client"; // this registers <Editor> as a Client Component
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
 
// Define a prop type for Editor
interface EditorProps {
  dataIdentifier?: string;
  classNames?: string;
}


// Our <Editor> component we can reuse later
export default function Editor({ dataIdentifier, classNames }: EditorProps) {
  // Creates a new editor instance.
  const editor = useCreateBlockNote({
    domAttributes: {
      editor: {
        "data-identifer": `${dataIdentifier}`,
        class: `${classNames}`,
      },
    },    
  });
 
  // Renders the editor instance using a React component.
  return <BlockNoteView editor={editor} />;
}