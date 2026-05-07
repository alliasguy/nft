import Link   from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service — Artsorbit",
  description: "Read the terms and conditions governing your use of the Artsorbit NFT marketplace.",
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

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ paddingLeft: "0.5rem" }}>
      {children}
    </li>
  );
}

function Ul({ children }: { children: React.ReactNode }) {
  return (
    <ul style={{ paddingLeft: "1.25rem", listStyle: "disc",
      display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      {children}
    </ul>
  );
}

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Effective date: {EFFECTIVE} · Last updated: {EFFECTIVE}
          </p>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem",
            lineHeight: 1.7, marginTop: "1rem", maxWidth: "60ch" }}>
            Please read these Terms carefully before using Artsorbit. By creating an account
            or using any part of our platform, you agree to be bound by these Terms.
          </p>
        </div>

        {/* Sections */}
        <Section title="1. About Artsorbit">
          <P>
            Artsorbit (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a digital art and
            NFT (Non-Fungible Token) marketplace that enables creators to mint, list, and sell digital
            artwork, and enables collectors to discover, purchase, and trade those works.
          </P>
          <P>
            Artsorbit operates an <strong style={{ color: "var(--text-primary)" }}>internal
            wallet system</strong>. Users maintain an ETH balance on the platform and all
            transactions (purchases, sales, bids) are settled against that balance. Artsorbit
            does not connect to or interact with external blockchain wallets such as MetaMask.
          </P>
        </Section>

        <Section title="2. Eligibility">
          <P>You must be at least 18 years old to create an account and use Artsorbit.</P>
          <P>
            By using the platform you confirm that you are not on any government sanctions list
            and that your use of the platform complies with all laws applicable in your jurisdiction.
          </P>
        </Section>

        <Section title="3. Accounts">
          <P>
            You are responsible for maintaining the confidentiality of your account credentials
            and for all activity that occurs under your account.
          </P>
          <P>You agree to:</P>
          <Ul>
            <Li>Provide accurate and complete registration information.</Li>
            <Li>Keep your email address and account details up to date.</Li>
            <Li>Notify us immediately of any unauthorised use of your account.</Li>
            <Li>Not share your account with or transfer it to any other person.</Li>
          </Ul>
          <P>
            We reserve the right to suspend or terminate accounts that violate these Terms,
            engage in fraudulent activity, or remain inactive for an extended period.
          </P>
        </Section>

        <Section title="4. Internal Wallet & Funds">
          <P>
            Artsorbit provides each registered user with an internal ETH balance. This balance
            exists entirely within the Artsorbit platform and is not stored on any public blockchain.
          </P>
          <Ul>
            <Li>
              <strong style={{ color: "var(--text-primary)" }}>Deposits:</strong> To add funds,
              you send ETH from an external wallet to the Artsorbit deposit address and submit
              your transaction hash. Our team manually verifies the transaction and credits your
              balance within 1–2 business hours.
            </Li>
            <Li>
              <strong style={{ color: "var(--text-primary)" }}>Withdrawals:</strong> When you
              request a withdrawal, the amount is immediately deducted from your balance and
              held pending manual processing. Our team sends the ETH from our external wallet
              to your specified address within 24 hours. If a withdrawal is rejected, the full
              amount is refunded to your balance.
            </Li>
            <Li>
              <strong style={{ color: "var(--text-primary)" }}>No interest:</strong> Balances
              held on Artsorbit do not accrue interest and are not insured.
            </Li>
          </Ul>
          <P>
            Artsorbit is not a bank or financial institution. Your balance on the platform
            represents a claim against Artsorbit and is subject to the risks inherent in
            a centralised custodial service.
          </P>
        </Section>

        <Section title="5. Minting (Creating NFTs)">
          <P>
            Registered users may mint NFTs by providing artwork or digital files through the
            Create page. By submitting content you confirm that:
          </P>
          <Ul>
            <Li>You own or have the legal right to use and sell the content.</Li>
            <Li>The content does not infringe any third-party intellectual property rights.</Li>
            <Li>The content does not violate our Content Standards (Section 7).</Li>
          </Ul>
          <P>
            A minting fee is deducted from your internal balance when you mint.
            The current fee is shown on the Create page before you confirm. This fee is non-refundable.
          </P>
          <P>
            All newly minted NFTs enter a <strong style={{ color: "var(--text-primary)" }}>
            moderation review queue</strong> before appearing on the public marketplace. We
            reserve the right to reject or remove any NFT that violates these Terms without
            notice or refund of the minting fee.
          </P>
        </Section>

        <Section title="6. Buying & Selling">
          <P>
            When you purchase an NFT at its listed price, the full amount is deducted from
            your internal balance and ownership is transferred to you on the Artsorbit platform.
          </P>
          <P>
            <strong style={{ color: "var(--text-primary)" }}>Platform fee:</strong> Artsorbit
            charges a{" "}
            <strong style={{ color: "var(--text-primary)" }}>no platform fee</strong> on sales.
            Artists and sellers receive 100% of the sale price.
          </P>
          <P>
            <strong style={{ color: "var(--text-primary)" }}>Auctions and bids:</strong> For
            auction-listed NFTs, buyers submit bids. When the seller accepts a bid, the
            transaction is processed atomically — the buyer&rsquo;s balance is debited, the
            seller&rsquo;s balance is credited (minus the platform fee), and ownership
            transfers immediately. All other pending bids on that NFT are automatically
            rejected.
          </P>
          <P>
            All transactions are final. Artsorbit does not offer refunds for completed
            purchases unless required by applicable law.
          </P>
        </Section>

        <Section title="7. Content Standards">
          <P>You may not mint, list, or otherwise distribute content that:</P>
          <Ul>
            <Li>Infringes any copyright, trademark, or other intellectual property right.</Li>
            <Li>Depicts or promotes illegal activity, violence, or exploitation.</Li>
            <Li>Contains sexually explicit material involving minors.</Li>
            <Li>Is spam, misleading, or deliberately misrepresents the origin of a work.</Li>
            <Li>Constitutes a duplicate or plagiarised version of an existing listed work.</Li>
          </Ul>
          <P>
            We reserve the right to remove any content and suspend accounts that violate
            these standards, with or without prior notice.
          </P>
        </Section>

        <Section title="8. Intellectual Property">
          <P>
            Purchasing an NFT on Artsorbit transfers platform ownership of that specific NFT
            token to you. Unless explicitly stated otherwise by the creator, it does{" "}
            <strong style={{ color: "var(--text-primary)" }}>not</strong> transfer the
            underlying intellectual property rights, copyright, or commercial licensing rights
            to the associated artwork. Buyers receive a personal, non-commercial licence to
            display the artwork.
          </P>
          <P>
            Artsorbit&rsquo;s own brand assets, code, and design system remain the exclusive
            property of Artsorbit, Inc. and may not be reproduced without written permission.
          </P>
        </Section>

        <Section title="9. Fees Summary">
          <Ul>
            <Li>Minting fee: set by the platform (shown on the Create page before you confirm)</Li>
            <Li>Platform fee on sales: None — sellers receive 100% of the sale price</Li>
            <Li>Deposits: free to submit; no processing fee</Li>
            <Li>Withdrawals: no fee charged by Artsorbit (network gas fees apply externally)</Li>
          </Ul>
        </Section>

        <Section title="10. Disclaimers & Limitation of Liability">
          <P>
            Artsorbit is provided &ldquo;as is&rdquo; without warranties of any kind, express
            or implied. We do not guarantee uninterrupted service, the accuracy of market prices,
            or the authenticity of any creator&rsquo;s identity.
          </P>
          <P>
            To the fullest extent permitted by law, Artsorbit&rsquo;s total liability to you for
            any claim arising from use of the platform shall not exceed the fees you paid to
            Artsorbit in the 30 days preceding the claim.
          </P>
          <P>
            Digital assets are highly volatile. Artsorbit is not responsible for any loss of
            value in NFTs or ETH held on the platform.
          </P>
        </Section>

        <Section title="11. Changes to These Terms">
          <P>
            We may update these Terms from time to time. When we do, we will revise the
            &ldquo;Last updated&rdquo; date at the top of this page. Continued use of Artsorbit
            after changes are posted constitutes your acceptance of the revised Terms.
          </P>
        </Section>

        <Section title="12. Contact">
          <P>
            Questions about these Terms?{" "}
            <a href="mailto:support@artsorbit.com"
              style={{ color: "var(--accent)", fontWeight: 600 }}>
              support@artsorbit.com
            </a>
          </P>
          <P>
            <strong style={{ color: "var(--text-primary)" }}>Artsorbit, Inc.</strong><br />
            130 Jackson Blvd Suite 1910-A<br />
            Chicago, IL 60604<br />
            United States
          </P>
        </Section>

        <div style={{ marginTop: "3rem", paddingTop: "1.5rem",
          borderTop: "1px solid var(--border-muted)",
          display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/privacy" style={{ color: "var(--accent)", fontSize: "0.875rem" }}>
            Privacy Policy →
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
