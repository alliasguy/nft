"use client";

import { useState, useEffect } from "react";
import Link                    from "next/link";
import { createClient }        from "@/lib/supabase/client";

export default function DepositPage() {
  const [depositWallet, setDepositWallet] = useState("");
  const [amount,        setAmount]        = useState("");
  const [txHash,        setTxHash]        = useState("");
  const [fromAddress,   setFromAddress]   = useState("");
  const [copied,        setCopied]        = useState(false);
  const [status,        setStatus]        = useState<"idle"|"submitting"|"success"|"error">("idle");
  const [errorMsg,      setErrorMsg]      = useState("");
  const [balance,       setBalance]       = useState<number | null>(null);

  useEffect(() => {
    const sb = createClient();
    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { window.location.href = "/login?next=/wallet/deposit"; return; }
      const sba = sb as any;
      const [settingsRes, profRes] = await Promise.all([
        sba.from("platform_settings").select("value").eq("key", "deposit_wallet_address").single(),
        sba.from("profiles").select("balance").eq("id", user.id).single(),
      ]);
      if (settingsRes.data) setDepositWallet((settingsRes.data as any).value ?? "");
      if (profRes.data)     setBalance((profRes.data as any).balance ?? 0);
    }
    load();
  }, []);

  function copyAddress() {
    navigator.clipboard.writeText(depositWallet).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) { setErrorMsg("Enter a valid amount."); return; }
    if (!txHash.trim()) { setErrorMsg("Enter your transaction hash."); return; }
    if (!fromAddress.trim()) { setErrorMsg("Enter the wallet address you sent from."); return; }

    setStatus("submitting");
    setErrorMsg("");
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setStatus("error"); setErrorMsg("Not authenticated."); return; }

    const { error } = await (sb.from("deposit_requests") as any).insert({
      user_id:      user.id,
      amount:       parsedAmount,
      tx_hash:      txHash.trim(),
      from_address: fromAddress.trim(),
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("success");
      /* Notify user + admin — fire-and-forget */
      fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:      "deposit-submitted",
          userEmail: user.email ?? "",
          userName:  (user.user_metadata?.name as string) ?? "User",
          amount,
          txHash:    txHash.trim(),
        }),
      }).catch(() => {});
    }
  }

  if (status === "success") {
    return (
      <div className="container" style={{ paddingBlock:"clamp(2rem,5vw,3.5rem)", maxWidth:"560px" }}>
        <div style={{ textAlign:"center", padding:"2.5rem 1rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>✅</div>
          <h2 className="text-headline" style={{ marginBottom:"0.625rem" }}>Deposit Submitted!</h2>
          <p style={{ color:"var(--text-secondary)", marginBottom:"2rem", lineHeight:1.65 }}>
            Your deposit request for <strong style={{ color:"var(--text-primary)" }}>{amount} ETH</strong> has been
            received. Our team will verify your transaction and credit your balance within 1–2 hours.
          </p>
          <Link href="/wallet" className="btn btn-gradient" style={{ borderRadius:"9999px" }}>
            Back to Wallet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBlock:"clamp(2rem,5vw,3.5rem)", maxWidth:"600px" }}>

      {/* Header */}
      <Link href="/wallet" className="btn btn-ghost btn-sm" style={{ marginBottom:"1.5rem", display:"inline-flex", gap:"0.375rem" }}>
        ← Back to Wallet
      </Link>
      <h1 className="text-headline" style={{ marginBottom:"0.5rem" }}>Deposit ETH</h1>
      {balance !== null && (
        <p style={{ color:"var(--text-muted)", marginBottom:"2rem" }}>
          Current balance: <strong style={{ color:"var(--text-primary)" }}>{balance.toFixed(4)} ETH</strong>
        </p>
      )}

      {/* Step 1 */}
      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border-muted)", borderRadius:"var(--radius-card)", padding:"1.5rem", marginBottom:"1.25rem" }}>
        <p style={{ fontWeight:700, fontSize:"0.9375rem", color:"var(--text-primary)", marginBottom:"0.875rem" }}>
          <span style={{ color:"var(--accent)", marginRight:"0.5rem" }}>01</span> Send ETH to this address
        </p>

        {depositWallet ? (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", background:"var(--bg-elevated)", border:"1px solid var(--accent-border)", borderRadius:"var(--radius-lg)", padding:"0.875rem 1.125rem", marginBottom:"0.875rem" }}>
              <p style={{ flex:1, fontFamily:"var(--font-mono)", fontSize:"0.875rem", color:"var(--accent)", wordBreak:"break-all" }}>
                {depositWallet}
              </p>
              <button
                className="btn btn-sm btn-outline"
                style={{ borderRadius:"9999px", flexShrink:0 }}
                onClick={copyAddress}
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <div style={{ display:"flex", gap:"0.5rem", fontSize:"0.8125rem", color:"var(--text-muted)", alignItems:"flex-start" }}>
              <span>⚠️</span>
              <span>Only send <strong>ETH on the Ethereum mainnet</strong>. Sending other tokens or using the wrong network will result in permanent loss.</span>
            </div>
          </>
        ) : (
          <div style={{ padding:"1rem", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:"var(--radius-lg)", color:"#fbbf24", fontSize:"0.875rem" }}>
            ⚠️ The deposit wallet address has not been configured yet. Please contact support.
          </div>
        )}
      </div>

      {/* Step 2 */}
      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border-muted)", borderRadius:"var(--radius-card)", padding:"1.5rem", marginBottom:"1.25rem" }}>
        <p style={{ fontWeight:700, fontSize:"0.9375rem", color:"var(--text-primary)", marginBottom:"1.125rem" }}>
          <span style={{ color:"var(--accent)", marginRight:"0.5rem" }}>02</span> Submit your transaction details
        </p>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div>
            <label style={{ display:"block", fontSize:"0.875rem", fontWeight:600, color:"var(--text-primary)", marginBottom:"0.5rem" }}>
              Amount (ETH)
            </label>
            <input
              className="db-input"
              type="number"
              step="0.0001"
              min="0.001"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display:"block", fontSize:"0.875rem", fontWeight:600, color:"var(--text-primary)", marginBottom:"0.5rem" }}>
              Your sending wallet address
            </label>
            <input
              className="db-input"
              type="text"
              placeholder="0x..."
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              style={{ fontFamily:"var(--font-mono)", fontSize:"0.875rem" }}
              required
            />
          </div>

          <div>
            <label style={{ display:"block", fontSize:"0.875rem", fontWeight:600, color:"var(--text-primary)", marginBottom:"0.5rem" }}>
              Transaction hash (Tx ID)
            </label>
            <input
              className="db-input"
              type="text"
              placeholder="0x..."
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              style={{ fontFamily:"var(--font-mono)", fontSize:"0.875rem" }}
              required
            />
            <p style={{ fontSize:"0.8125rem", color:"var(--text-muted)", marginTop:"0.375rem" }}>
              Find this on Etherscan after sending. Starts with 0x followed by 64 hex characters.
            </p>
          </div>

          {errorMsg && (
            <p style={{ fontSize:"0.875rem", color:"var(--error)" }}>{errorMsg}</p>
          )}

          <button
            type="submit"
            className="db-save-btn"
            disabled={status === "submitting" || !depositWallet}
            style={{ alignSelf:"flex-start", marginTop:"0.25rem" }}
          >
            {status === "submitting" ? "Submitting…" : "Submit Deposit Request"}
          </button>
        </form>
      </div>

      <div style={{ padding:"1rem 1.25rem", background:"var(--bg-elevated)", borderRadius:"var(--radius-lg)", fontSize:"0.875rem", color:"var(--text-muted)", lineHeight:1.65 }}>
        ℹ️ Deposits are reviewed and confirmed by our team within <strong style={{ color:"var(--text-secondary)" }}>1–2 business hours</strong>. You will see the funds in your balance once approved.
      </div>

    </div>
  );
}
