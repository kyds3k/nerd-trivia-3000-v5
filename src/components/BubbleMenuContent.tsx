const BubbleMenuContent = ({ editor }: { editor: Editor }) => (
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
    {/* Add more buttons as needed */}
  </div>
);

export default BubbleMenuContent;