"use client"; // this registers <Editor> as a Client Component
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useEffect, useState, useRef, useImperativeHandle, forwardRef } from "react";

// Define a prop type for Editor
interface EditorProps {
  dataIdentifier?: string;
  dataType?: string;
  classNames?: string;
}

// Our <Editor> component we can reuse later
const Editor = forwardRef<HTMLDivElement, EditorProps>(
  ({ dataIdentifier, dataType, classNames }, ref) => {
    const [html, setHTML] = useState<string>("");
    const internalRef = useRef<HTMLDivElement>(null); // Internal reference

    // Creates a new editor instance.
    const editor = useCreateBlockNote({
      domAttributes: {
        editor: {
          "data-identifier": `${dataIdentifier}`,
          "data-type": `${dataType}`,
          "data-html": `${html}`,
          class: `${classNames}`,
        },
      },
    });

    const onChange = async () => {
      // Converts the editor's contents from Block objects to HTML and store to state.
      let updatedHtml = await editor.blocksToHTMLLossy(editor.document);

      // Strip the last <p></p> from the HTML, if it exists
      updatedHtml = updatedHtml.replace(/<p>\s*<\/p>$/, "");
      setHTML(updatedHtml);
    };

    // Sync external ref (if provided) with internal ref
    useImperativeHandle(ref, () => internalRef.current as HTMLDivElement);

    // Effect to update the data-html attribute dynamically on the specific child element
    useEffect(() => {
      if (internalRef.current) {
        // Select the child element that has the `data-html` attribute
        const targetElement = internalRef.current.querySelector("[data-html]");
        if (targetElement) {
          targetElement.setAttribute("data-html", html);
        }
      }
    }, [html]);

    // Renders the editor instance using a React component.
    return (
      <div ref={internalRef}>
        <BlockNoteView editor={editor} onChange={onChange} />
      </div>
    );
  }
);

export default Editor;
