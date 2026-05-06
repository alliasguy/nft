import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL  ?? "admin@artsorbit.com";
const FROM_EMAIL         = process.env.FROM_EMAIL   ?? "Artsorbit <onboarding@resend.dev>";
const APP_URL            = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/* ── Base HTML wrapper ───────────────────────────────────────── */
function base(content: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#e5e5e5;padding:0}
    .wrap{max-width:520px;margin:0 auto;padding:2.5rem 1.5rem}
    .logo{font-size:1.25rem;font-weight:800;color:#00f5d4;margin-bottom:2rem;letter-spacing:-0.025em}
    h2{font-size:1.25rem;font-weight:700;color:#ffffff;margin-bottom:1rem}
    p{color:#a3a3a3;line-height:1.65;margin-bottom:0.875rem}
    .card{background:#1a1a1a;border:1px solid #333333;border-radius:10px;padding:1rem 1.25rem;margin-bottom:0.75rem}
    .card-label{font-size:0.6875rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#616161;margin-bottom:0.25rem}
    .card-val{font-size:0.9375rem;font-weight:600;color:#ffffff}
    .card-mono{font-family:'Courier New',monospace;font-size:0.8125rem;color:#00f5d4;word-break:break-all}
    .btn{display:inline-block;background:#00f5d4;color:#050505 !important;font-weight:700;padding:0.75rem 1.75rem;border-radius:9999px;text-decoration:none;font-size:0.9375rem;margin-top:1.25rem}
    .footer{font-size:0.75rem;color:#616161;margin-top:2rem;padding-top:1rem;border-top:1px solid #222222;line-height:1.6}
    .green{color:#34d399}
    .red{color:#f87171}
    .amber{color:#fbbf24}
  </style></head><body><div class="wrap">
    <div class="logo">Artsorbit</div>
    ${content}
    <div class="footer">This is an automated message from Artsorbit. Please do not reply to this email. If you have questions, contact our support team.</div>
  </div></body></html>`;
}

/* ── Send helper — fire-and-forget safe ─────────────────────── */
export async function sendEmail({
  to, subject, html,
}: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) return; // not configured — skip silently
  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  } catch {
    // Email failure must never break the main flow
  }
}

/* ── Templates ───────────────────────────────────────────────── */

export function emailNewUser(userName: string, userEmail: string) {
  return base(`
    <h2>New User Signed Up</h2>
    <p>A new user has created an account on Artsorbit.</p>
    <div class="card"><div class="card-label">Name</div><div class="card-val">${userName}</div></div>
    <div class="card"><div class="card-label">Email</div><div class="card-val">${userEmail}</div></div>
    <div class="card"><div class="card-label">Signed Up</div><div class="card-val">${new Date().toUTCString()}</div></div>
    <a href="${APP_URL}/admin/users" class="btn">View Users in Admin</a>
  `);
}

export function emailDepositSubmittedToUser(userName: string, amount: string) {
  return base(`
    <h2>Deposit Request Received ✓</h2>
    <p>Hi ${userName}, we've received your deposit request. Our team will verify your transaction and credit your balance within 1–2 business hours.</p>
    <div class="card"><div class="card-label">Amount Requested</div><div class="card-val green">${amount} ETH</div></div>
    <div class="card"><div class="card-label">Status</div><div class="card-val amber">Under Review</div></div>
    <a href="${APP_URL}/wallet" class="btn">View Wallet</a>
  `);
}

export function emailDepositSubmittedToAdmin(
  userName: string, userEmail: string, amount: string, txHash?: string,
) {
  return base(`
    <h2>New Deposit Request</h2>
    <p>A user has submitted a deposit request that requires your review.</p>
    <div class="card"><div class="card-label">User</div><div class="card-val">${userName}</div><div class="card-label" style="margin-top:0.5rem">Email</div><div class="card-val">${userEmail}</div></div>
    <div class="card"><div class="card-label">Amount</div><div class="card-val green">${amount} ETH</div></div>
    ${txHash ? `<div class="card"><div class="card-label">Tx Hash</div><div class="card-mono">${txHash}</div></div>` : ""}
    <a href="${APP_URL}/admin/deposits" class="btn">Review in Admin →</a>
  `);
}

export function emailWithdrawalSubmittedToUser(userName: string, amount: string) {
  return base(`
    <h2>Withdrawal Request Received ✓</h2>
    <p>Hi ${userName}, we've received your withdrawal request. Our team will process it and send the funds to your wallet within 24 hours.</p>
    <div class="card"><div class="card-label">Amount Requested</div><div class="card-val red">${amount} ETH</div></div>
    <div class="card"><div class="card-label">Status</div><div class="card-val amber">Pending Processing</div></div>
    <a href="${APP_URL}/wallet" class="btn">View Wallet</a>
  `);
}

export function emailWithdrawalSubmittedToAdmin(
  userName: string, userEmail: string, amount: string, toAddress: string,
) {
  return base(`
    <h2>New Withdrawal Request</h2>
    <p>A user has requested a withdrawal. Please send ETH to their address and then mark it as completed in the admin panel.</p>
    <div class="card"><div class="card-label">User</div><div class="card-val">${userName}</div><div class="card-label" style="margin-top:0.5rem">Email</div><div class="card-val">${userEmail}</div></div>
    <div class="card"><div class="card-label">Amount to Send</div><div class="card-val red">${amount} ETH</div></div>
    <div class="card"><div class="card-label">Send to Address</div><div class="card-mono">${toAddress}</div></div>
    <a href="${APP_URL}/admin/withdrawals" class="btn">Process in Admin →</a>
  `);
}

export function emailDepositApproved(userName: string, amount: string) {
  return base(`
    <h2>Deposit Approved ✓</h2>
    <p>Hi ${userName}, great news! Your deposit has been verified and credited to your Artsorbit balance.</p>
    <div class="card"><div class="card-label">Amount Credited</div><div class="card-val green">${amount} ETH</div></div>
    <div class="card"><div class="card-label">Status</div><div class="card-val green">Approved</div></div>
    <a href="${APP_URL}/wallet" class="btn">View Balance</a>
  `);
}

export function emailDepositRejected(userName: string, amount: string, note?: string) {
  return base(`
    <h2>Deposit Not Approved</h2>
    <p>Hi ${userName}, unfortunately we were unable to verify your deposit request of <strong>${amount} ETH</strong>.</p>
    ${note ? `<div class="card"><div class="card-label">Reason</div><div class="card-val red">${note}</div></div>` : ""}
    <p>If you believe this is an error, please contact our support team with your transaction hash so we can investigate.</p>
  `);
}

export function emailWithdrawalCompleted(userName: string, amount: string, toAddress: string) {
  return base(`
    <h2>Withdrawal Processed ✓</h2>
    <p>Hi ${userName}, your withdrawal has been processed and sent to your wallet.</p>
    <div class="card"><div class="card-label">Amount Sent</div><div class="card-val red">${amount} ETH</div></div>
    <div class="card"><div class="card-label">Sent To</div><div class="card-mono">${toAddress}</div></div>
    <p>Please allow up to 30 minutes for the transaction to appear on the blockchain depending on network conditions.</p>
    <a href="${APP_URL}/wallet" class="btn">View Wallet</a>
  `);
}

export function emailWithdrawalRejected(userName: string, amount: string, note?: string) {
  return base(`
    <h2>Withdrawal Not Processed</h2>
    <p>Hi ${userName}, your withdrawal request of <strong>${amount} ETH</strong> could not be processed. Your balance has not been deducted.</p>
    ${note ? `<div class="card"><div class="card-label">Reason</div><div class="card-val red">${note}</div></div>` : ""}
    <p>Please contact our support team if you need further assistance.</p>
    <a href="${APP_URL}/wallet" class="btn">View Wallet</a>
  `);
}
