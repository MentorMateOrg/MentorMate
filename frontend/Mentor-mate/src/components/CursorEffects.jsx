import React, { useEffect, useState } from "react";

export function InteractiveCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Define event handlers outside of useEffect to avoid recreating them on every render
  const updatePosition = (e) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseDown = () => setIsClicking(true);
  const handleMouseUp = () => setIsClicking(false);

  const handleMouseEnter = (e) => {
    if (e.target.matches('button, a, .cursor-hover, [role="button"]')) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = (e) => {
    if (e.target.matches('button, a, .cursor-hover, [role="button"]')) {
      setIsHovering(false);
    }
  };

  useEffect(() => {
    // Only add and remove event listeners in useEffect
    document.addEventListener("mousemove", updatePosition);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseenter", handleMouseEnter, true);
    document.addEventListener("mouseleave", handleMouseLeave, true);

    return () => {
      document.removeEventListener("mousemove", updatePosition);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseenter", handleMouseEnter, true);
      document.removeEventListener("mouseleave", handleMouseLeave, true);
    };
  }, []);

  // Calculate safe positions to prevent negative values at screen edges
  const safeLeftPosition = Math.max(0, position.x - 10);
  const safeTopPosition = Math.max(0, position.y - 10);
  const safeCenterLeftPosition = Math.max(0, position.x - 2);
  const safeCenterTopPosition = Math.max(0, position.y - 2);

  return (
    <>
      <div
        className={`fixed pointer-events-none z-50 transition-all duration-150 ease-out ${
          isClicking ? "scale-75" : isHovering ? "scale-150" : "scale-100"
        }`}
        style={{
          left: safeLeftPosition,
          top: safeTopPosition,
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          backgroundColor: isHovering
            ? "rgba(147, 51, 234, 0.3)"
            : "rgba(147, 51, 234, 0.1)",
          border: "2px solid rgba(147, 51, 234, 0.5)",
        }}
      />
      <div
        className="fixed pointer-events-none z-40 transition-all duration-300 ease-out"
        style={{
          left: safeCenterLeftPosition,
          top: safeCenterTopPosition,
          width: "4px",
          height: "4px",
          borderRadius: "50%",
          backgroundColor: "#9333ea",
        }}
      />
    </>
  );
}

export function ButtonHoverEffect({ children, className = "", ...props }) {
  return (
    <div
      className={`cursor-hover transition-all duration-200 hover:scale-105 hover:shadow-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHoverEffect({ children, className = "", ...props }) {
  return (
    <div
      className={`cursor-hover transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1 group ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
