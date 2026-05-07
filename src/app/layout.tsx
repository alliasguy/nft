import type { Metadata } from "next";
import { Outfit }        from "next/font/google";
import Navbar            from "@/components/Navbar";
import GlobalErrorGuard  from "@/components/GlobalErrorGuard";
import SmartsuppChat     from "@/components/SmartsuppChat";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Artsorbit — Premium Digital Art Marketplace",
  description:
    "Discover, collect, and trade premium digital art and NFTs. The home of top creators and rare collections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={outfit.variable}
      data-scroll-behavior="smooth"
    >
      {/* Suppress browser-extension errors (MetaMask etc.) before Next.js
          error overlay captures them. Must run synchronously in <head>. */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
(function(){
  function suppress(msg, stack) {
    if (!msg) return false;
    var s = stack || '';
    return (
      msg.indexOf('MetaMask') !== -1 ||
      msg.indexOf('ethereum') !== -1 ||
      msg.indexOf('web3') !== -1 ||
      msg.indexOf('Failed to connect') !== -1 ||
      msg.indexOf('Router action dispatched before initialization') !== -1 ||
      s.indexOf('chrome-extension://') !== -1 ||
      s.indexOf('inpage.js') !== -1
    );
  }

  /* Unhandled promise rejections (MetaMask async failures) */
  window.addEventListener('unhandledrejection', function(e) {
    var msg = (e.reason && e.reason.message) ? e.reason.message : String(e.reason || '');
    var stk = (e.reason && e.reason.stack) ? e.reason.stack : '';
    if (suppress(msg, stk)) e.preventDefault();
  }, true);

  /* Synchronous errors thrown by extensions */
  window.addEventListener('error', function(e) {
    var stk = (e.error && e.error.stack) ? e.error.stack : (e.filename || '');
    if (suppress(e.message, stk)) e.preventDefault();
  }, true);

  /* Patch console.error — Turbopack reads this to populate the overlay.
     MetaMask calls console.error when connection fails, bypassing event listeners. */
  var _ce = console.error.bind(console);
  console.error = function() {
    var msg = Array.prototype.slice.call(arguments).join(' ');
    if (suppress(msg, msg)) return;
    _ce.apply(console, arguments);
  };
})();
        `}} />
      </head>
      <body>
        {/* Suppresses browser-extension unhandled rejections (e.g. MetaMask)
            and guards against router-not-ready errors during HMR in dev */}
        <GlobalErrorGuard />
        <Navbar />
        <div style={{ paddingTop: "var(--nav-height)" }}>
          {children}
        </div>

        {/* Smartsupp live chat */}
        <SmartsuppChat />
      </body>
    </html>
  );
}
