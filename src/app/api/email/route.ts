import { NextResponse }             from "next/server";
import { createClient }             from "@/lib/supabase/server";
import { createClient as adminSb }  from "@supabase/supabase-js";
import {
  sendEmail, ADMIN_EMAIL,
  emailNewUser,
  emailDepositSubmittedToUser,  emailDepositSubmittedToAdmin,
  emailWithdrawalSubmittedToUser, emailWithdrawalSubmittedToAdmin,
  emailDepositApproved,   emailDepositRejected,
  emailWithdrawalCompleted, emailWithdrawalRejected,
} from "@/lib/email";

/* Look up a target user's email + name via the service-role key.
   Returns null if SUPABASE_SERVICE_ROLE_KEY is not configured —
   those emails are silently skipped. */
async function getTargetUser(userId: string): Promise<{ email: string; name: string } | null> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;

  const admin = adminSb(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [authRes, profRes] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    (admin as any).from("profiles").select("name").eq("id", userId).single(),
  ]);

  if (authRes.error || !authRes.data.user?.email) return null;
  return {
    email: authRes.data.user.email,
    name:  (profRes.data as any)?.name ?? "User",
  };
}

export async function POST(req: Request) {
  /* Verify the caller has a valid Supabase session */
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, string>;
  const { type } = body;

  switch (type) {
    /* ── User-triggered ───────────────────────────────────────── */

    case "new-user":
      await sendEmail({
        to:      ADMIN_EMAIL,
        subject: `New user signed up: ${body.userName}`,
        html:    emailNewUser(body.userName, body.userEmail),
      });
      break;

    case "deposit-submitted":
      await Promise.all([
        sendEmail({
          to:      body.userEmail,
          subject: "Deposit request received — Artsorbit",
          html:    emailDepositSubmittedToUser(body.userName, body.amount),
        }),
        sendEmail({
          to:      ADMIN_EMAIL,
          subject: `New deposit: ${body.amount} ETH from ${body.userName}`,
          html:    emailDepositSubmittedToAdmin(body.userName, body.userEmail, body.amount, body.txHash),
        }),
      ]);
      break;

    case "withdrawal-submitted":
      await Promise.all([
        sendEmail({
          to:      body.userEmail,
          subject: "Withdrawal request received — Artsorbit",
          html:    emailWithdrawalSubmittedToUser(body.userName, body.amount),
        }),
        sendEmail({
          to:      ADMIN_EMAIL,
          subject: `New withdrawal: ${body.amount} ETH from ${body.userName}`,
          html:    emailWithdrawalSubmittedToAdmin(body.userName, body.userEmail, body.amount, body.toAddress),
        }),
      ]);
      break;

    /* ── Admin-triggered (need service role key to get target email) */

    case "deposit-approved": {
      const target = await getTargetUser(body.userId);
      if (target) {
        await sendEmail({
          to:      target.email,
          subject: "Deposit approved — Artsorbit",
          html:    emailDepositApproved(target.name, body.amount),
        });
      }
      break;
    }

    case "deposit-rejected": {
      const target = await getTargetUser(body.userId);
      if (target) {
        await sendEmail({
          to:      target.email,
          subject: "Deposit request update — Artsorbit",
          html:    emailDepositRejected(target.name, body.amount, body.note),
        });
      }
      break;
    }

    case "withdrawal-completed": {
      const target = await getTargetUser(body.userId);
      if (target) {
        await sendEmail({
          to:      target.email,
          subject: "Withdrawal processed — Artsorbit",
          html:    emailWithdrawalCompleted(target.name, body.amount, body.toAddress),
        });
      }
      break;
    }

    case "withdrawal-rejected": {
      const target = await getTargetUser(body.userId);
      if (target) {
        await sendEmail({
          to:      target.email,
          subject: "Withdrawal request update — Artsorbit",
          html:    emailWithdrawalRejected(target.name, body.amount, body.note),
        });
      }
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
