import { Block, BlockNoteEditor, PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useEffect, useMemo, useRef, useState } from "react";

// Function to save content to local storage using a unique key
async function saveToStorage(editorId: string, jsonBlocks: Block[]) {
  localStorage.setItem(`editorContent_${editorId}`, JSON.stringify(jsonBlocks));
}

// Function to load content from local storage using a unique key
async function loadFromStorage(editorId: string) {
  const storageString = localStorage.getItem(`editorContent_${editorId}`);
  return storageString ? (JSON.parse(storageString) as PartialBlock[]) : undefined;
}

interface EditorProps {
  editorId: string;
  dataIdentifier: string; // Unique identifier for DOM attributes
  dataType?: string; // Optional data-type
  classNames?: string; // Optional class names
}

export default function Editor({ editorId, dataIdentifier, dataType = "", classNames = "" }: EditorProps) {
  const [initialContent, setInitialContent] = useState<PartialBlock[] | undefined | "loading">(
    "loading"
  );
  const [htmlContent, setHtmlContent] = useState<string>("");
  const editorRef = useRef<HTMLDivElement>(null); // Ref for the editor wrapper element

  // Load the previously stored editor contents for a specific editor instance
  useEffect(() => {
    loadFromStorage(editorId).then(async (content) => {
      if (content) {
        // Create a temporary editor instance to convert blocks to HTML
        const tempEditor = BlockNoteEditor.create({ initialContent: content });
        const contentHtml = await tempEditor.blocksToHTMLLossy(tempEditor.document);
        setHtmlContent(contentHtml);
      }
      setInitialContent(content);
    });
  }, [editorId]);

  // Create a new editor instance when the initial content is loaded
  const editor = useMemo(() => {
    if (initialContent === "loading") {
      return undefined;
    }

    return BlockNoteEditor.create({
      initialContent,
    });
  }, [initialContent]);

  // Handle the update of editor content
  const handleEditorChange = async () => {
    if (editor) {
      const currentHtmlContent = await editor.blocksToHTMLLossy(editor.document);
      setHtmlContent(currentHtmlContent); // Update the local htmlContent state

      // Save to local storage
      saveToStorage(editorId, editor.document);
    }
  };

  // Use an effect to update the DOM attributes on the editor wrapper
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setAttribute("data-identifier", dataIdentifier);
      editorRef.current.setAttribute("data-type", dataType);
      editorRef.current.setAttribute("data-html", htmlContent);
      if (classNames) {
        editorRef.current.className = classNames;
      }
    }
  }, [dataIdentifier, dataType, htmlContent, classNames]);

  if (editor === undefined) {
    return "Loading content...";
  }

  // Render the editor instance and handle content changes
  return (
    <div ref={editorRef}>
      <BlockNoteView
        editor={editor}
        onChange={handleEditorChange}
      />
    </div>
  );
}
