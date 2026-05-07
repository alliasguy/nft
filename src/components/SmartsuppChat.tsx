"use client";

import { useEffect } from "react";

export default function SmartsuppChat() {
  useEffect(() => {
    /* Already loaded — skip on client-side navigation remounts */
    if ((window as any).smartsupp && (window as any).smartsupp._loaded) return;

    /* Exact pattern from Smartsupp's official embed code */
    const w = window as any;
    w._smartsupp        = w._smartsupp || {};
    w._smartsupp.key    = "dffe19a0ba6b1150557e2918ba598680057a5699";

    /* Queue function — collects calls until loader.js is ready */
    w.smartsupp = w.smartsupp || function () {
      (w.smartsupp._ = w.smartsupp._ || []).push(arguments);
    };
    w.smartsupp._ = w.smartsupp._ || [];

    const script    = document.createElement("script");
    script.type     = "text/javascript";
    script.charset  = "utf-8";
    script.async    = true;
    script.src      = "https://www.smartsuppchat.com/loader.js?";
    script.onload   = () => { w.smartsupp._loaded = true; };
    script.onerror  = () => console.warn("[Smartsupp] failed to load — check network or ad blocker");

    /* Append to body so it runs after the DOM is fully ready */
    document.body.appendChild(script);
  }, []);

  return null;
}
