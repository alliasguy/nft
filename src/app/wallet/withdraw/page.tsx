"use client";

import { useState, useEffect } from "react";
import Link                    from "next/link";
import { createClient }        from "@/lib/supabase/client";

export default function WithdrawPage() {
  const [balance,    setBalance]    = useState<number>(0);
  const [minWd,      setMinWd]      = useState(0.01);
  const [amount,     setAmount]     = useState("");
  const [toAddress,  setToAddress]  = useState("");
  const [status,     setStatus]     = useState<"idle"|"submitting"|"success"|"error">("idle");
  const [errorMsg,   setErrorMsg]   = useState("");

  useEffect(() => {
    const sb = createClient();
    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { window.location.href = "/login?next=/wallet/withdraw"; return; }
      const sba = sb as any;
      const [profRes, settingsRes] = await Promise.all([
        sba.from("profiles").select("balance").eq("id", user.id).single(),
        sba.from("platform_settings").select("value").eq("key", "min_withdrawal_eth").single(),
      ]);
      if (profRes.data)     setBalance((profRes.data as any).balance ?? 0);
      if (settingsRes.data) setMinWd(parseFloat((settingsRes.data as any).value) || 0.01);
    }
    load();
  }, []);

  const parsedAmount = parseFloat(amount) || 0;
  const isInsufficient = parsedAmount > balance;
  const isBelowMin     = parsedAmount > 0 && parsedAmount < minWd;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isInsufficient || isBelowMin) return;
    if (!toAddress.trim()) { setErrorMsg("Enter the destination wallet address."); return; }

    setStatus("submitting");
    setErrorMsg("");
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setStatus("error"); setErrorMsg("Not authenticated."); return; }

    const { error } = await (sb.from("withdrawal_requests") as any).insert({
      user_id:    user.id,
      amount:     parsedAmount,
      to_address: toAddress.trim(),
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
          type:      "withdrawal-submitted",
          userEmail: user.email ?? "",
          userName:  (user.user_metadata?.name as string) ?? "User",
          amount,
          toAddress: toAddress.trim(),
        }),
      }).catch(() => {});
    }
  }

  if (status === "success") {
    return (
      <div className="container" style={{ paddingBlock:"clamp(2rem,5vw,3.5rem)", maxWidth:"560px" }}>
        <div style={{ textAlign:"center", padding:"2.5rem 1rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>📤</div>
          <h2 className="text-headline" style={{ marginBottom:"0.625rem" }}>Withdrawal Requested!</h2>
          <p style={{ color:"var(--text-secondary)", marginBottom:"2rem", lineHeight:1.65 }}>
            Your withdrawal of <strong style={{ color:"var(--text-primary)" }}>{amount} ETH</strong> has been
            submitted. Our team will process it and send the funds to your wallet within 24 hours.
          </p>
          <Link href="/wallet" className="btn btn-gradient" style={{ borderRadius:"9999px" }}>
            Back to Wallet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBlock:"clamp(2rem,5vw,3.5rem)", maxWidth:"560px" }}>

      <Link href="/wallet" className="btn btn-ghost btn-sm" style={{ marginBottom:"1.5rem", display:"inline-flex", gap:"0.375rem" }}>
        ← Back to Wallet
      </Link>
      <h1 className="text-headline" style={{ marginBottom:"0.5rem" }}>Withdraw ETH</h1>
      <p style={{ color:"var(--text-muted)", marginBottom:"2rem" }}>
        Available: <strong style={{ color: balance > 0 ? "var(--accent)" : "var(--text-primary)" }}>
          {balance.toFixed(4)} ETH
        </strong>
      </p>

      {balance <= 0 ? (
        <div style={{ textAlign:"center", padding:"3rem 1rem", background:"var(--bg-surface)", borderRadius:"var(--radius-card)", border:"1px solid var(--border-muted)" }}>
          <p style={{ fontSize:"2rem", marginBottom:"0.75rem" }}>💸</p>
          <p style={{ color:"var(--text-secondary)", marginBottom:"1.25rem" }}>
            Your balance is <strong>0 ETH</strong>. Deposit funds first before withdrawing.
          </p>
          <Link href="/wallet/deposit" className="btn btn-gradient" style={{ borderRadius:"9999px" }}>
            Deposit ETH →
          </Link>
        </div>
      ) : (
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border-muted)", borderRadius:"var(--radius-card)", padding:"1.75rem" }}>
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1.125rem" }}>

            <div>
              <label style={{ display:"block", fontSize:"0.875rem", fontWeight:600, color:"var(--text-primary)", marginBottom:"0.5rem" }}>
                Amount (ETH)
              </label>
              <div style={{ position:"relative" }}>
                <input
                  className="db-input"
                  type="number"
                  step="0.0001"
                  min={minWd}
                  max={balance}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ paddingRight:"5rem" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setAmount(balance.toFixed(4))}
                  style={{ position:"absolute", right:"0.75rem", top:"50%", transform:"translateY(-50%)", fontSize:"0.75rem", fontWeight:700, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", padding:"0.125rem 0.375rem" }}
                >
                  MAX
                </button>
              </div>
              {isBelowMin && <p style={{ fontSize:"0.8125rem", color:"var(--error)", marginTop:"0.375rem" }}>Minimum withdrawal is {minWd} ETH</p>}
              {isInsufficient && <p style={{ fontSize:"0.8125rem", color:"var(--error)", marginTop:"0.375rem" }}>Exceeds your balance of {balance.toFixed(4)} ETH</p>}
            </div>

            <div>
              <label style={{ display:"block", fontSize:"0.875rem", fontWeight:600, color:"var(--text-primary)", marginBottom:"0.5rem" }}>
                Destination Ethereum wallet address
              </label>
              <input
                className="db-input"
                type="text"
                placeholder="0x..."
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                style={{ fontFamily:"var(--font-mono)", fontSize:"0.875rem" }}
                required
              />
              <p style={{ fontSize:"0.8125rem", color:"var(--text-muted)", marginTop:"0.375rem" }}>
                Double-check this address. Withdrawals sent to the wrong address cannot be recovered.
              </p>
            </div>

            {/* Summary */}
            {parsedAmount > 0 && !isInsufficient && !isBelowMin && (
              <div style={{ background:"var(--bg-elevated)", borderRadius:"var(--radius-lg)", padding:"0.875rem 1.125rem" }}>
                {[
                  { label:"You receive",        val:`${parsedAmount.toFixed(4)} ETH` },
                  { label:"Remaining balance",  val:`${(balance - parsedAmount).toFixed(4)} ETH` },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.375rem" }}>
                    <span style={{ fontSize:"0.875rem", color:"var(--text-muted)" }}>{label}</span>
                    <span style={{ fontSize:"0.875rem", fontWeight:600, color:"var(--text-primary)" }}>{val}</span>
                  </div>
                ))}
              </div>
            )}

            {errorMsg && <p style={{ fontSize:"0.875rem", color:"var(--error)" }}>{errorMsg}</p>}

            <button
              type="submit"
              className="db-save-btn"
              disabled={status === "submitting" || isInsufficient || isBelowMin || !toAddress.trim() || !parsedAmount}
              style={{ alignSelf:"flex-start" }}
            >
              {status === "submitting" ? "Submitting…" : "Request Withdrawal"}
            </button>
          </form>
        </div>
      )}

      <div style={{ marginTop:"1.25rem", padding:"1rem 1.25rem", background:"var(--bg-elevated)", borderRadius:"var(--radius-lg)", fontSize:"0.875rem", color:"var(--text-muted)", lineHeight:1.65 }}>
        ℹ️ Withdrawals are processed manually by our team within <strong style={{ color:"var(--text-secondary)" }}>24 hours</strong>. Your balance will be deducted upon processing.
      </div>

    </div>
  );
}
