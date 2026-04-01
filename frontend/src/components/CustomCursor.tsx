import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Don't render custom cursor on touch devices (phones/tablets)
const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

export default function CustomCursor() {
  // Skip on touch devices — no mouse, no cursor needed
  if (isTouchDevice) return null;

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
      
      // Check if cursor is over a clickable element
      const target = e.target as HTMLElement;
      let clickedItem = target.closest('a, button, input, select, textarea, [role="button"], .cursor-pointer');
      setIsHovering(!!clickedItem);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  if (!isVisible) return null;


  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-3 h-3 bg-[#f9a8d4] rounded-full pointer-events-none z-[9999]"
        animate={{
          x: mousePosition.x - 6,
          y: mousePosition.y - 6,
          scale: isClicking ? 0.5 : isHovering ? 0 : 1,
        }}
        transition={{ type: 'spring', mass: 0.1, stiffness: 800, damping: 20 }}
      />
      
      <motion.div
        className="fixed top-0 left-0 w-10 h-10 border border-[#f9a8d4]/60 rounded-full pointer-events-none z-[9998]"
        animate={{
          x: mousePosition.x - 20,
          y: mousePosition.y - 20,
          scale: isHovering ? 1.5 : isClicking ? 0.8 : 1,
          backgroundColor: isHovering ? 'rgba(249, 168, 212, 0.15)' : 'transparent',
          borderColor: isHovering ? 'rgba(249, 168, 212, 0)' : 'rgba(249, 168, 212, 0.6)',
        }}
        transition={{ type: 'spring', mass: 0.2, stiffness: 300, damping: 25 }}
      />
    </>
  );
}
