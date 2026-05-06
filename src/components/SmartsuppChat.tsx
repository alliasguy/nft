"use client";

import { useEffect } from "react";

export default function SmartsuppChat() {
  useEffect(() => {
    /* Prevent double-init on hot reload */
    if ((window as any)._smartsupp?.initialized) return;

    (window as any)._smartsupp = { key: "dffe19a0ba6b1150557e2918ba598680057a5699", initialized: true };

    /* Create the smartsupp queue function before the loader arrives */
    if (!(window as any).smartsupp) {
      const fn: any = function () { fn._.push(arguments); };
      fn._ = [];
      (window as any).smartsupp = fn;
    }

    const script = document.createElement("script");
    script.type    = "text/javascript";
    script.charset = "utf-8";
    script.async   = true;
    script.src     = "https://www.smartsuppchat.com/loader.js?";

    const first = document.getElementsByTagName("script")[0];
    first.parentNode!.insertBefore(script, first);
  }, []);

  return null;
}
