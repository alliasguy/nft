import type { Metadata } from "next";
import { Outfit }        from "next/font/google";
import Script            from "next/script";
import Navbar            from "@/components/Navbar";
import GlobalErrorGuard  from "@/components/GlobalErrorGuard";
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
    return (
      msg.indexOf('MetaMask') !== -1 ||
      msg.indexOf('ethereum') !== -1 ||
      msg.indexOf('web3') !== -1 ||
      msg.indexOf('Router action dispatched before initialization') !== -1 ||
      (stack && stack.indexOf('chrome-extension://') !== -1)
    );
  }
  window.addEventListener('unhandledrejection', function(e) {
    var msg = (e.reason && e.reason.message) ? e.reason.message : String(e.reason || '');
    var stk = (e.reason && e.reason.stack) ? e.reason.stack : '';
    if (suppress(msg, stk)) e.preventDefault();
  }, true);
  window.addEventListener('error', function(e) {
    if (e.message && suppress(e.message, e.filename || '')) e.preventDefault();
  }, true);
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
        <Script
          id="smartsupp"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
var _smartsupp = _smartsupp || {};
_smartsupp.key = 'dffe19a0ba6b1150557e2918ba598680057a5699';
window.smartsupp||(function(d) {
  var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
  s=d.getElementsByTagName('script')[0];c=d.createElement('script');
  c.type='text/javascript';c.charset='utf-8';c.async=true;
  c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
})(document);
            `,
          }}
        />
      </body>
    </html>
  );
}
