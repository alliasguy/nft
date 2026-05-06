import Link   from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy — Artsorbit",
  description: "Learn how Artsorbit collects, uses, and protects your personal information.",
};

const EFFECTIVE = "1 May 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)",
        marginBottom: "0.875rem", paddingBottom: "0.5rem",
        borderBottom: "1px solid var(--border-muted)" }}>
        {title}
      </h2>
      <div style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8,
        display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return (
    <ul style={{ paddingLeft: "1.25rem", listStyle: "disc",
      display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      {children}
    </ul>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return <li style={{ paddingLeft: "0.5rem" }}>{children}</li>;
}

export default function PrivacyPage() {
  return (
    <>
      <div className="container" style={{ paddingBlock: "clamp(2rem,5vw,4rem)", maxWidth: 760 }}>

        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--accent)", marginBottom: "0.75rem" }}>
            Legal
          </p>
          <h1 style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 800,
            color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
            Privacy Policy
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Effective date: {EFFECTIVE} · Last updated: {EFFECTIVE}
          </p>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem",
            lineHeight: 1.7, marginTop: "1rem", maxWidth: "60ch" }}>
            Artsorbit takes your privacy seriously. This Policy explains what data we collect,
            why we collect it, and how we use and protect it.
          </p>
        </div>

        <Section title="1. Who We Are">
          <P>
            Artsorbit, Inc. (&ldquo;Artsorbit&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;)
            operates the Artsorbit NFT marketplace at{" "}
            <a href="https://www.artsorbit.com"
              style={{ color: "var(--accent)" }}>www.artsorbit.com</a>.
            We are the data controller for the personal information described in this Policy.
          </P>
        </Section>

        <Section title="2. Information We Collect">
          <P><strong style={{ color: "var(--text-primary)" }}>Information you provide:</strong></P>
          <Ul>
            <Li>
              <strong style={{ color: "var(--text-primary)" }}>Account data:</strong> your display
              name, email address, and password when you register.
            </Li>
            <Li>
              <strong style={{ color: "var(--text-primary)" }}>Profile data:</strong> optional
              bio, website, Twitter handle, and wallet address you add to your profile.
            </Li>
            <Li>
              <strong style={{ color: "var(--text-primary)" }}>NFT content:</strong> titles,
              descriptions, categories, pricing, and uploaded image or audio files when
              you mint an NFT.
            </Li>
            <Li>
              <strong style={{ color: "var(--text-primary)" }}>Deposit details:</strong> your
              sending wallet address and transaction hash when you submit a deposit request.
            </Li>
            <Li>
              <strong style={{ color: "var(--text-primary)" }}>Withdrawal details:</strong> the
              Ethereum address you specify for withdrawals.
            </Li>
            <Li>
              <strong style={{ color: "var(--text-primary)" }}>Support messages:</strong> any
              messages you send via our live chat (Smartsupp) or email.
            </Li>
          </Ul>

          <P><strong style={{ color: "var(--text-primary)" }}>Information collected automatically:</strong></P>
          <Ul>
            <Li>
              <strong style={{ color: "var(--text-primary)" }}>Usage data:</strong> pages
              visited, NFTs viewed (recorded as an anonymous view count), and interactions
              with the marketplace.
            </Li>
            <Li>
              <strong style={{ color: "var(--text-primary)" }}>Session data:</strong> browser
              type, IP address, and device information collected by our authentication provider.
            </Li>
            <Li>
              <strong style={{ color: "var(--text-primary)" }}>Cookies:</strong> session tokens
              and a stable anonymous viewer identifier stored in your browser. See our{" "}
              <Link href="/cookies" style={{ color: "var(--accent)" }}>Cookie Policy</Link> for
              full details.
            </Li>
          </Ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <Ul>
            <Li>To create and manage your account and authenticate your sessions.</Li>
            <Li>To process NFT purchases, sales, bids, deposits, and withdrawals.</Li>
            <Li>To display your public profile, NFTs, and activity on the marketplace.</Li>
            <Li>
              To send transactional emails — deposit acknowledgements, withdrawal confirmations,
              and account notifications — via Resend.
            </Li>
            <Li>
              To moderate NFT submissions and enforce our content standards.
            </Li>
            <Li>
              To count NFT views and likes for ranking and discovery purposes.
            </Li>
            <Li>
              To respond to support requests via live chat.
            </Li>
            <Li>
              To detect and prevent fraud, abuse, and security threats.
            </Li>
          </Ul>
          <P>
            We do not sell your personal information to third parties. We do not use your data
            for advertising purposes.
          </P>
        </Section>

        <Section title="4. Data Storage & Third-Party Providers">
          <P>Artsorbit uses the following third-party services to operate the platform:</P>
          <Ul>
            <Li>
              <strong style={{ color: "var(--text-primary)" }}>Supabase</strong> — authentication,
              database (user profiles, NFT records, transaction history), and file storage for
              uploaded NFT artwork. Data is stored in secure cloud infrastructure. Supabase is
              SOC 2 Type II certified.
            </Li>
            <Li>
              <strong style={{ color: "var(--text-primary)" }}>Resend</strong> — transactional
              email delivery. Your email address is passed to Resend solely to deliver emails
              you have triggered (e.g. deposit confirmation). Resend does not use this data
              for marketing.
            </Li>
            <Li>
              <strong style={{ color: "var(--text-primary)" }}>Smartsupp</strong> — live chat
              support widget. If you initiate a chat, your messages and basic browser information
              are processed by Smartsupp. See{" "}
              <a href="https://www.smartsupp.com/privacy-policy/"
                target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--accent)" }}>
                Smartsupp&rsquo;s Privacy Policy
              </a>.
            </Li>
          </Ul>
        </Section>

        <Section title="5. Data Retention">
          <P>
            We retain your account data for as long as your account is active. If you delete
            your account, we will remove your personal profile information within 30 days.
            Transaction records (deposits, withdrawals, purchases) are retained for a minimum
            of 5 years for legal and compliance purposes.
          </P>
          <P>
            NFTs you have minted or purchased may remain on the platform after account deletion
            if ownership has been transferred to another user.
          </P>
        </Section>

        <Section title="6. Your Rights">
          <P>
            Depending on your jurisdiction you may have the right to:
          </P>
          <Ul>
            <Li>Access the personal data we hold about you.</Li>
            <Li>Request correction of inaccurate data.</Li>
            <Li>Request deletion of your data (subject to legal retention obligations).</Li>
            <Li>Object to or restrict certain processing of your data.</Li>
            <Li>Receive a portable copy of your data.</Li>
          </Ul>
          <P>
            To exercise any of these rights, email us at{" "}
            <a href="mailto:privacy@artsorbit.com" style={{ color: "var(--accent)", fontWeight: 600 }}>
              privacy@artsorbit.com
            </a>.
          </P>
        </Section>

        <Section title="7. Security">
          <P>
            We implement industry-standard security measures including:
          </P>
          <Ul>
            <Li>HTTPS encryption for all data in transit.</Li>
            <Li>Row-Level Security (RLS) policies ensuring users can only access their own data.</Li>
            <Li>Server-side validation and SECURITY DEFINER database functions for all
              balance-changing operations.</Li>
            <Li>SVG sanitisation and file type validation on all uploaded content.</Li>
          </Ul>
          <P>
            No method of transmission or storage is 100% secure. If you discover a security
            vulnerability, please report it responsibly to{" "}
            <a href="mailto:security@artsorbit.com" style={{ color: "var(--accent)", fontWeight: 600 }}>
              security@artsorbit.com
            </a>.
          </P>
        </Section>

        <Section title="8. Children">
          <P>
            Artsorbit is not intended for users under the age of 18. We do not knowingly
            collect personal information from minors. If you believe a minor has created an
            account, please contact us and we will delete it promptly.
          </P>
        </Section>

        <Section title="9. Changes to This Policy">
          <P>
            We may update this Privacy Policy from time to time. Material changes will be
            communicated by email to registered users and by updating the effective date above.
          </P>
        </Section>

        <Section title="10. Contact">
          <P>
            Privacy questions:{" "}
            <a href="mailto:privacy@artsorbit.com"
              style={{ color: "var(--accent)", fontWeight: 600 }}>
              privacy@artsorbit.com
            </a>
          </P>
        </Section>

        <div style={{ marginTop: "3rem", paddingTop: "1.5rem",
          borderTop: "1px solid var(--border-muted)",
          display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/terms" style={{ color: "var(--accent)", fontSize: "0.875rem" }}>
            Terms of Service →
          </Link>
          <Link href="/cookies" style={{ color: "var(--accent)", fontSize: "0.875rem" }}>
            Cookie Settings →
          </Link>
        </div>

      </div>
      <Footer />
    </>
  );
}
