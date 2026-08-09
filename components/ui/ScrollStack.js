"use client"

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import './ScrollStack.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const ScrollStackItem = ({ children, itemClassName = '' }) => (
  <div className={`scroll-stack-card ${itemClassName}`.trim()}>{children}</div>
);

const ScrollStack = ({
  children,
  className = '',
  itemDistance = 100,
  itemScale = 0.05,
  itemStackDistance = 40,
  baseScale = 0.9,
  rotationAmount = 0,
  blurAmount = 0,
  scrubValue = 0.8, // Added for high-fidelity smoothing
}) => {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const cards = gsap.utils.toArray('.scroll-stack-card');
    if (cards.length === 0) return;

    // Create a context for proper cleanup in Next.js
    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 15%', // Match the previous stackPosition
          end: `+=${cards.length * 600}`, // Determine scroll length
          scrub: scrubValue,
          pin: true,
          invalidateOnRefresh: true,
        },
      });

      cards.forEach((card, i) => {
        // Initial setup for cards
        gsap.set(card, {
          zIndex: i,
          transformOrigin: 'top center',
        });

        if (i > 0) {
          // Animate cards onto the stack
          tl.fromTo(card, 
            { 
              y: window.innerHeight * 0.8,
              opacity: 0,
              scale: 1,
            },
            {
              y: i * itemStackDistance, // Stack them with the specified gap
              opacity: 1,
              scale: 1 - ((cards.length - 1 - i) * itemScale), 
              ease: 'power2.inOut',
              duration: 1,
            },
            i * 0.5 // staggered entry
          );
        }

        // Subtly scale down the previous cards as new ones come in
        if (i < cards.length - 1) {
          tl.to(cards.slice(0, i + 1), {
            scale: (index) => 1 - ((i + 1 - index) * itemScale),
            filter: blurAmount ? `blur(${(i + 1) * blurAmount}px)` : 'none',
            duration: 0.5,
          }, i * 0.5 + 0.5);
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, [itemScale, itemStackDistance, baseScale, rotationAmount, blurAmount, scrubValue]);

  return (
    <div ref={containerRef} className={`scroll-stack-section ${className}`.trim()}>
      <div className="scroll-stack-inner relative">
        {children}
      </div>
    </div>
  );
};

export default ScrollStack;
