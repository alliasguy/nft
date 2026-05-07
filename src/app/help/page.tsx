import Link   from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Help Center — Artsorbit",
  description: "Guides and answers to common questions about buying, selling, minting, and managing your Artsorbit account.",
};

interface FAQ { q: string; a: React.ReactNode }

function FaqGroup({ title, items }: { title: string; items: FAQ[] }) {
  return (
    <section style={{ marginBottom: "3rem" }}>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)",
        marginBottom: "1.25rem", paddingBottom: "0.5rem",
        borderBottom: "1px solid var(--border-muted)" }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {items.map(({ q, a }) => (
          <div key={q} style={{ background: "var(--bg-surface)",
            border: "1px solid var(--border-muted)", borderRadius: "var(--radius-lg)",
            padding: "1rem 1.25rem" }}>
            <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)",
              marginBottom: "0.5rem" }}>
              {q}
            </p>
            <div style={{ fontSize: "0.9375rem", color: "var(--text-secondary)",
              lineHeight: 1.75 }}>
              {a}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HelpPage() {
  return (
    <>
      <div className="container" style={{ paddingBlock: "clamp(2rem,5vw,4rem)", maxWidth: 760 }}>

        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--accent)", marginBottom: "0.75rem" }}>
            Support
          </p>
          <h1 style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 800,
            color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
            Help Center
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem",
            lineHeight: 1.7, maxWidth: "60ch" }}>
            Everything you need to know about using Artsorbit — from setting up your wallet
            to buying, selling, and minting NFTs.
          </p>
        </div>

        {/* Quick links */}
        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", marginBottom: "3rem" }}>
          {[
            { label: "Getting Started",  href: "#getting-started"  },
            { label: "Wallet & Funds",   href: "#wallet"           },
            { label: "Buying NFTs",      href: "#buying"           },
            { label: "Selling & Bids",   href: "#selling"          },
            { label: "Minting",          href: "#minting"          },
            { label: "Account",          href: "#account"          },
            { label: "Fees",             href: "#fees"             },
          ].map(({ label, href }) => (
            <a key={label} href={href}
              style={{ display: "inline-block", padding: "0.375rem 0.875rem",
                background: "var(--bg-surface)", border: "1px solid var(--border-muted)",
                borderRadius: "9999px", fontSize: "0.8125rem", fontWeight: 600,
                color: "var(--text-secondary)", textDecoration: "none",
                transition: "border-color 150ms, color 150ms" }}>
              {label}
            </a>
          ))}
        </div>

        {/* Getting Started */}
        <div id="getting-started">
          <FaqGroup title="Getting Started" items={[
            {
              q: "What is Artsorbit?",
              a: <p>Artsorbit is a premium digital art and NFT marketplace where you can discover, collect, and sell rare digital artwork. Unlike traditional NFT platforms, Artsorbit uses an <strong style={{ color: "var(--text-primary)" }}>internal ETH balance system</strong> — no external crypto wallet (like MetaMask) is required.</p>,
            },
            {
              q: "How do I create an account?",
              a: <p>Click <strong style={{ color: "var(--text-primary)" }}>Sign Up</strong> in the top navigation, enter your display name, email, and a password of at least 8 characters. Once registered, you are taken directly to your dashboard. You can start exploring immediately — to buy or mint, you&rsquo;ll need to deposit ETH first.</p>,
            },
            {
              q: "Do I need a crypto wallet like MetaMask?",
              a: <p>No. Artsorbit manages an internal ETH balance for you on the platform. You only need an external Ethereum wallet to <em>send</em> funds during a deposit, or to <em>receive</em> funds during a withdrawal. You do not need to connect any wallet to the site.</p>,
            },
          ]} />
        </div>

        {/* Wallet */}
        <div id="wallet">
          <FaqGroup title="Wallet & Funds" items={[
            {
              q: "How do I deposit ETH?",
              a: (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <p>Go to <Link href="/wallet/deposit" style={{ color: "var(--accent)" }}>Wallet → Deposit</Link>. You will see the Artsorbit deposit address. Follow these steps:</p>
                  <ol style={{ paddingLeft: "1.25rem", listStyle: "decimal", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <li>Send ETH from your external wallet to the displayed address.</li>
                    <li>Wait for the transaction to confirm on the Ethereum network.</li>
                    <li>Copy your transaction hash (Tx ID) from Etherscan or your wallet.</li>
                    <li>Enter the amount, your sending address, and the Tx hash in the form, then submit.</li>
                  </ol>
                  <p>Our team verifies your transaction and credits your balance within <strong style={{ color: "var(--text-primary)" }}>1–2 business hours</strong>.</p>
                </div>
              ),
            },
            {
              q: "How do I withdraw ETH?",
              a: (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <p>Go to <Link href="/wallet/withdraw" style={{ color: "var(--accent)" }}>Wallet → Withdraw</Link>. Enter the amount and the Ethereum address you want to receive the funds. Click <strong style={{ color: "var(--text-primary)" }}>Request Withdrawal</strong>.</p>
                  <p>The requested amount is <strong style={{ color: "var(--text-primary)" }}>immediately deducted</strong> from your balance and locked. Our team manually sends the ETH to your address within <strong style={{ color: "var(--text-primary)" }}>24 hours</strong>. If the withdrawal is rejected for any reason, the full amount is automatically refunded to your balance.</p>
                </div>
              ),
            },
            {
              q: "How long do deposits and withdrawals take?",
              a: <p>Deposits are reviewed and credited within <strong style={{ color: "var(--text-primary)" }}>1–2 business hours</strong>. Withdrawals are processed within <strong style={{ color: "var(--text-primary)" }}>24 hours</strong>. Processing times may be longer during weekends or public holidays.</p>,
            },
            {
              q: "Why was my deposit not credited?",
              a: <p>Most delays are due to slow Ethereum network confirmation times. Ensure your transaction has at least 12 confirmations on Etherscan. If your balance has not been credited after 4 hours, contact support via live chat with your transaction hash.</p>,
            },
            {
              q: "What is the minimum withdrawal amount?",
              a: <p>The minimum withdrawal is <strong style={{ color: "var(--text-primary)" }}>0.01 ETH</strong> (configurable by the platform). You must also have sufficient balance to cover the amount you wish to withdraw.</p>,
            },
          ]} />
        </div>

        {/* Buying */}
        <div id="buying">
          <FaqGroup title="Buying NFTs" items={[
            {
              q: "How do I buy an NFT?",
              a: (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <p>Browse the <Link href="/explore" style={{ color: "var(--accent)" }}>Explore</Link> page and click on any NFT to open its detail page. If it is listed as <strong style={{ color: "var(--text-primary)" }}>Buy Now</strong>:</p>
                  <ol style={{ paddingLeft: "1.25rem", listStyle: "decimal", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <li>Click <strong style={{ color: "var(--text-primary)" }}>Buy for X ETH</strong>.</li>
                    <li>Review the fee breakdown (item price + 2% platform fee).</li>
                    <li>Click <strong style={{ color: "var(--text-primary)" }}>Confirm</strong> to complete the purchase.</li>
                  </ol>
                  <p>The NFT is added to your <Link href="/dashboard/collected" style={{ color: "var(--accent)" }}>Collected</Link> tab immediately.</p>
                </div>
              ),
            },
            {
              q: "How does bidding work on auction NFTs?",
              a: (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <p>For auction-listed NFTs, click the NFT to open its page and enter a bid amount (must be at least the listed minimum price). Click <strong style={{ color: "var(--text-primary)" }}>Place Bid</strong>. Your balance must cover the amount you bid.</p>
                  <p>The NFT owner reviews all bids and accepts one. When a bid is accepted:</p>
                  <ul style={{ paddingLeft: "1.25rem", listStyle: "disc", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <li>Your balance is debited and ownership transfers to you.</li>
                    <li>All other pending bids are automatically rejected.</li>
                  </ul>
                  <p>You can update or withdraw your bid at any time before it is accepted.</p>
                </div>
              ),
            },
            {
              q: "What happens if I don't have enough balance to buy?",
              a: <p>The purchase button will be disabled and you will see an insufficient balance warning with a link to <Link href="/wallet/deposit" style={{ color: "var(--accent)" }}>deposit ETH</Link>. You cannot buy or bid for more than your available balance.</p>,
            },
            {
              q: "Can I get a refund after buying?",
              a: <p>All completed purchases are final. NFT transactions cannot be reversed. If you believe a purchase was made in error due to a platform bug, contact support immediately via live chat.</p>,
            },
          ]} />
        </div>

        {/* Selling */}
        <div id="selling">
          <FaqGroup title="Selling NFTs & Bids" items={[
            {
              q: "How do I sell an NFT I own?",
              a: <p>Go to your <Link href="/dashboard/collected" style={{ color: "var(--accent)" }}>Collected</Link> tab. Each NFT you own shows a <strong style={{ color: "var(--text-primary)" }}>Sell</strong> button. Click it, choose Buy Now or Auction, set your price, and click <strong style={{ color: "var(--text-primary)" }}>List</strong>. The NFT is immediately listed on the marketplace.</p>,
            },
            {
              q: "How do I accept a bid on my auction NFT?",
              a: <p>Open the NFT detail page for your auction-listed NFT. You will see all incoming bids ranked highest-first. Click <strong style={{ color: "var(--text-primary)" }}>✓ Accept</strong> next to the bid you want to accept. The transaction completes instantly — the buyer&rsquo;s balance is debited, your balance is credited (minus 2% platform fee), and ownership transfers to the buyer.</p>,
            },
            {
              q: "How much do I receive when I sell?",
              a: <p>You receive the sale price minus the <strong style={{ color: "var(--text-primary)" }}>2% Artsorbit platform fee</strong>. For example, a 1 ETH sale nets you 0.98 ETH. The fee is shown in the confirmation screen before any transaction completes.</p>,
            },
          ]} />
        </div>

        {/* Minting */}
        <div id="minting">
          <FaqGroup title="Minting NFTs" items={[
            {
              q: "How do I mint an NFT?",
              a: (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <p>Go to the <Link href="/create" style={{ color: "var(--accent)" }}>Create</Link> page. Fill in:</p>
                  <ul style={{ paddingLeft: "1.25rem", listStyle: "disc", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <li>Title, description, category, and listing price.</li>
                    <li>Upload an image or audio file (optional — if omitted, a generated artwork is used).</li>
                    <li>Collection name and sale type (Buy Now or Auction).</li>
                  </ul>
                  <p>A minting fee of <strong style={{ color: "var(--text-primary)" }}>0.15 ETH</strong> is deducted from your balance when you mint.</p>
                </div>
              ),
            },
            {
              q: "Why isn't my NFT visible on the marketplace after minting?",
              a: <p>All newly minted NFTs enter a <strong style={{ color: "var(--text-primary)" }}>moderation review queue</strong>. Our team reviews each submission to ensure it meets our content standards. Once approved, your NFT appears on the Explore page and in collections. You can track the status in your <Link href="/dashboard/created" style={{ color: "var(--accent)" }}>Created</Link> tab.</p>,
            },
            {
              q: "What file types are accepted for upload?",
              a: <p>Artsorbit accepts common image formats (JPEG, PNG, GIF, WebP) and audio formats (MP3, WAV, OGG, FLAC, AAC, M4A). SVG files are accepted but are sanitised before storage. The maximum file size is determined by Supabase Storage limits.</p>,
            },
            {
              q: "Can I edit my NFT after minting?",
              a: <p>Yes. Go to your <Link href="/dashboard/created" style={{ color: "var(--accent)" }}>Created</Link> tab, open the edit panel on any NFT, and update the title, description, price, category, sale type, or badge. Changes take effect immediately without going back through moderation.</p>,
            },
          ]} />
        </div>

        {/* Account */}
        <div id="account">
          <FaqGroup title="Account" items={[
            {
              q: "How do I update my profile?",
              a: <p>Go to <Link href="/dashboard/settings" style={{ color: "var(--accent)" }}>Dashboard → Settings</Link> to update your display name, bio, social links, and wallet address.</p>,
            },
            {
              q: "How do I log out?",
              a: <p>On desktop, navigate to your dashboard and use the Sign Out option. On mobile, open the menu (hamburger icon) and scroll to the bottom to find the Sign Out button.</p>,
            },
            {
              q: "I forgot my password — how do I reset it?",
              a: <p>On the <Link href="/login" style={{ color: "var(--accent)" }}>Log In</Link> page, click <strong style={{ color: "var(--text-primary)" }}>Forgot password?</strong> and enter your email address. You will receive a reset link from Supabase Auth.</p>,
            },
          ]} />
        </div>

        {/* Fees */}
        <div id="fees">
          <FaqGroup title="Fees" items={[
            {
              q: "What are the fees on Artsorbit?",
              a: (
                <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-lg)",
                  padding: "0.875rem 1.125rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {[
                    { label: "Minting fee",         value: "0.15 ETH per NFT" },
                    { label: "Platform fee (sales)", value: "2% of sale price"  },
                    { label: "Deposits",             value: "Free"              },
                    { label: "Withdrawals",          value: "Free (Artsorbit charges no fee; external network gas fees apply)" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between",
                      gap: "1rem", flexWrap: "wrap" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>{label}</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.9375rem" }}>{value}</span>
                    </div>
                  ))}
                </div>
              ),
            },
          ]} />
        </div>

        {/* Still need help */}
        <div style={{ marginTop: "1rem", padding: "1.5rem", background: "var(--bg-surface)",
          border: "1px solid var(--accent-border)", borderRadius: "var(--radius-card)" }}>
          <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)",
            marginBottom: "0.5rem" }}>
            Still need help?
          </p>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.7,
            marginBottom: "1rem" }}>
            Our support team is available via live chat (click the chat bubble in the
            bottom-right corner) or by email.
          </p>
          <a href="mailto:support@artsorbit.com"
            style={{ display: "inline-block", padding: "0.625rem 1.5rem",
              background: "var(--gradient-accent)", color: "var(--text-inverse)",
              fontWeight: 700, borderRadius: "9999px", textDecoration: "none",
              fontSize: "0.9375rem" }}>
            Email Support
          </a>
        </div>

      </div>
      <Footer />
    </>
  );
}
