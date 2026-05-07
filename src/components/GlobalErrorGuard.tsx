"use client";

import { useEffect } from "react";

/**
 * Mounted once at the root. Suppresses two classes of noise:
 *
 * 1. MetaMask (and similar web3 extensions) inject a provider and fire an
 *    unhandled promise rejection when no dApp responds — not our code.
 *
 * 2. Next.js 16 + Turbopack "Router action dispatched before initialization"
 *    during hot-module reload — a transient dev-only race, harmless in
 *    production, but spams the console during development.
 */
export default function GlobalErrorGuard() {
  useEffect(() => {
    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      const msg = event.reason?.message ?? String(event.reason ?? "");

      const isBrowserExtension =
        msg.includes("MetaMask") ||
        msg.includes("ethereum") ||
        msg.includes("web3") ||
        event.reason?.stack?.includes("chrome-extension://");

      const isRouterRace =
        msg.includes("Router action dispatched before initialization");

      if (isBrowserExtension || isRouterRace) {
        event.preventDefault(); // stops it reaching the console as an error
      }
    }

    function handleError(event: ErrorEvent) {
      const msg   = event.message ?? "";
      const stack = (event.error as Error | null)?.stack ?? event.filename ?? "";

      const isExtension =
        msg.includes("MetaMask") ||
        msg.includes("ethereum") ||
        msg.includes("web3") ||
        msg.includes("Failed to connect") ||
        stack.includes("chrome-extension://") ||
        stack.includes("inpage.js");

      if (isExtension || msg.includes("Router action dispatched before initialization")) {
        event.preventDefault();
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null;
}
