import React from "react";
import "@/styles/CyberButton.scss";

interface CyberButtonProps {
  text: string; // The visible text on the button
  glitchText: string; // The glitch effect text
  onClick?: () => void;
  className?: string; // Additional custom classes
  buttonType?: "button" | "submit" | "reset";
}

const CyberButton: React.FC<CyberButtonProps> = ({
  text,
  glitchText,
  onClick,
  className = "", // Default to an empty string
  buttonType = "button", // Default to "button"
}) => {
  return (
    <button
      className={`cybr-btn ${className}`.trim()} // Combine and trim classes
      onClick={onClick}
      data-glitch={glitchText}
      type={buttonType}
    >
      {text}
    </button>
  );
};


export default CyberButton;
