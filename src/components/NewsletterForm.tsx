"use client";

import { useState } from "react";

type State = "idle" | "loading" | "success" | "error";

export default function NewsletterForm() {
  const [email,  setEmail]  = useState("");
  const [status, setStatus] = useState<State>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");

    // Simulate API call — replace with real endpoint
    await new Promise((r) => setTimeout(r, 900));
    setStatus("success");
  }

  if (status === "success") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.875rem 1.25rem",
          background: "rgba(16,185,129,0.1)",
          border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: "var(--radius-lg)",
          color: "#34d399",
          fontWeight: 600,
          fontSize: "0.9375rem",
        }}
      >
        <span style={{ fontSize: "1.125rem" }}>✓</span>
        You&rsquo;re on the list — watch your inbox for the first drop.
      </div>
    );
  }

  return (
    <form
      className="footer__newsletter-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <input
        className="input footer__newsletter-input"
        type="email"
        placeholder="Enter your email address"
        aria-label="Email address for newsletter"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={status === "loading"}
      />
      <button
        type="submit"
        className="btn btn-primary"
        style={{ flexShrink: 0 }}
        disabled={status === "loading" || !email}
        aria-busy={status === "loading"}
      >
        {status === "loading" ? "Subscribing…" : "Subscribe"}
      </button>
    </form>
  );
}
