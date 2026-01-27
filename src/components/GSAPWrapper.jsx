// GSAPWrapper.jsx
import React, { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const GSAPWrapper = ({ children }) => {
  useEffect(() => {
    // Store original GSAP methods
    const originalFrom = gsap.from;
    const originalFromTo = gsap.fromTo;
    const originalTo = gsap.to;

    // Override to prevent duplicate animations in StrictMode
    let animationCount = 0;
    
    gsap.from = function(targets, vars) {
      animationCount++;
      if (animationCount % 2 === 0) {
        // Skip every other animation in development StrictMode
        if (process.env.NODE_ENV === 'development') {
          return { kill: () => {} };
        }
      }
      return originalFrom.call(this, targets, vars);
    };

    // Restore original methods on cleanup
    return () => {
      gsap.from = originalFrom;
      gsap.fromTo = originalFromTo;
      gsap.to = originalTo;
      
      // Kill all animations
      gsap.globalTimeline.clear();
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return <>{children}</>;
};

export default GSAPWrapper;