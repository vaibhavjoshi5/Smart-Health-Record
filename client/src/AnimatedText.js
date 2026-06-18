import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

function AnimatedText({ children, className = '', forceVisible = false, typewriter = false, typewriterSpeed = 30 }) {
  const ref = useRef();
  const [visible, setVisible] = useState(false);
  const [displayed, setDisplayed] = useState(typewriter ? '' : children);

  useEffect(() => {
    if (forceVisible) {
      setVisible(true);
    }
  }, [forceVisible]);

  useEffect(() => {
    if ((visible || forceVisible) && typewriter && typeof children === 'string') {
      const chars = Array.from(children); // Properly handles emoji/Unicode
      let i = 0;
      setDisplayed('');
      const interval = setInterval(() => {
        if (i >= chars.length) {
          clearInterval(interval);
          return;
        }
        setDisplayed(prev => prev + chars[i]);
        i++;
      }, typewriterSpeed);
      return () => clearInterval(interval);
    } else if ((visible || forceVisible) && !typewriter) {
      setDisplayed(children);
    }
  }, [visible, forceVisible, typewriter, children, typewriterSpeed]);

  useEffect(() => {
    if (forceVisible) {
      setVisible(true);
      return;
    }
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.01 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [forceVisible]);

  return (
    <span
      ref={ref}
      className={`${className} animated-text${visible || forceVisible ? ' visible' : ''}`}
    >
      {typewriter && typeof children === 'string' ? displayed : children}
    </span>
  );
}

AnimatedText.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  forceVisible: PropTypes.bool,
  typewriter: PropTypes.bool,
  typewriterSpeed: PropTypes.number,
};

export default AnimatedText; 