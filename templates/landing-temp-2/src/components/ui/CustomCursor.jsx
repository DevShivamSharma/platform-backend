import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { templateConfig } from '../../config.js';

const cursor = templateConfig.effects.cursor;
const monoFont = templateConfig.theme.fonts.mono;

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const labelRef = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isFine = window.matchMedia('(pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || !isFine || reduce) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add('custom-cursor-active');

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;

    const onMove = (e) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

    const tick = () => {
      gsap.set(dot, { x: pos.current.x, y: pos.current.y });
      gsap.to(ring, {
        x: pos.current.x,
        y: pos.current.y,
        duration: 0.35,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    };
    gsap.ticker.add(tick);

    const setLabel = (text) => {
      if (!label) return;
      label.textContent = text;
      gsap.to(label, { opacity: text ? 1 : 0, duration: 0.25 });
    };

    const handleEnter = (e) => {
      const el = e.currentTarget;
      const type = el.dataset.cursor || 'link';
      if (type === 'project') {
        gsap.to(ring, { scale: 2.6, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
        gsap.to(dot, { scale: 0, duration: 0.25, overwrite: 'auto' });
        setLabel('View');
      } else if (type === 'drag') {
        gsap.to(ring, { scale: 2.6, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
        setLabel('Drag');
      } else {
        gsap.to(ring, { scale: 1.8, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
        gsap.to(dot, { scale: 0.4, duration: 0.25, overwrite: 'auto' });
      }
    };

    const handleLeave = () => {
      gsap.to(ring, { scale: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      gsap.to(dot, { scale: 1, duration: 0.25, overwrite: 'auto' });
      setLabel('');
    };

    const handleDown = () => gsap.to(ring, { scale: 0.85, duration: 0.15 });
    const handleUp = () => gsap.to(ring, { scale: 1, duration: 0.3, ease: 'power3.out' });

    const bind = (el) => {
      if (el._cursorBound) return;
      el._cursorBound = true;
      if (!el.dataset.cursor) {
        el.dataset.cursor = el.tagName === 'BUTTON' ? 'button' : 'link';
      }
      el.addEventListener('mouseenter', handleEnter);
      el.addEventListener('mouseleave', handleLeave);
    };

    const initial = document.querySelectorAll('a, button, [data-cursor]');
    initial.forEach(bind);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches?.('a, button, [data-cursor]')) bind(node);
          node.querySelectorAll?.('a, button, [data-cursor]').forEach(bind);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      observer.disconnect();
      document.documentElement.classList.remove('custom-cursor-active');
      document.querySelectorAll('[data-cursor], a, button').forEach((el) => {
        el.removeEventListener('mouseenter', handleEnter);
        el.removeEventListener('mouseleave', handleLeave);
        el._cursorBound = false;
      });
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          width: 6,
          height: 6,
          background: cursor.dot,
          mixBlendMode: cursor.blend,
          willChange: 'transform',
        }}
      />
      <div
        ref={ringRef}
        aria-hidden
        className="fixed top-0 left-0 pointer-events-none z-[9998] flex items-center justify-center"
        style={{
          width: 32,
          height: 32,
          border: `1px solid ${cursor.ring}`,
          mixBlendMode: cursor.blend,
          willChange: 'transform',
        }}
      >
        <span
          ref={labelRef}
          style={{
            fontFamily: monoFont,
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: cursor.label,
            opacity: 0,
          }}
        />
      </div>
    </>
  );
}
