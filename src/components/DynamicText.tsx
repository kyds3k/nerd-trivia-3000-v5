import React, { useEffect, useRef } from "react";

interface DynamicTextProps {
  html: string; // The HTML content to render
  maxFontSize?: number; // Optional max font size, default to 50px
  className?: string; // Optional Tailwind or custom classes
}

const DynamicText: React.FC<DynamicTextProps> = ({ html, maxFontSize = 50, className = "" }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      const container = ref.current;
      const parentWidth = container.offsetWidth;
      const parentHeight = container.offsetHeight;

      let fontSize = maxFontSize;
      container.style.fontSize = `${fontSize}px`;

      while (
        (container.scrollWidth > parentWidth || container.scrollHeight > parentHeight) &&
        fontSize > 0
      ) {
        fontSize -= 1; // Gradually decrease font size
        container.style.fontSize = `${fontSize}px`;
      }
    }
  }, [html, maxFontSize]); // Recalculate font size when `html` or `maxFontSize` changes

  return (
    <div
      ref={ref}
      className={`overflow-hidden ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    ></div>
  );
};

export default DynamicText;
