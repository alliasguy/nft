"use client";

import { useRef, useEffect, type ReactNode } from "react";

interface ScrollRevealProps {
  children:   ReactNode;
  /** Milliseconds to wait before starting the transition (stagger) */
  delay?:     number;
  className?: string;
  style?:     React.CSSProperties;
}

/**
 * Wraps children in a div that fades + slides up when it enters the viewport.
 * Elements already visible on first paint reveal immediately (no double-flash).
 * Respects prefers-reduced-motion via CSS — no JS check needed.
 */
export default function ScrollReveal({
  children,
  delay = 0,
  className = "",
  style,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If the element is already in the viewport on mount, reveal at once
    const inView = el.getBoundingClientRect().top < window.innerHeight * 0.98;
    if (inView) {
      if (delay) el.style.transitionDelay = `${delay}ms`;
      el.classList.add("is-revealed");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (delay) el.style.transitionDelay = `${delay}ms`;
        el.classList.add("is-revealed");
        observer.unobserve(el);
      },
      { threshold: 0.07, rootMargin: "0px 0px -56px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`scroll-reveal${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
    </div>
  );
}
