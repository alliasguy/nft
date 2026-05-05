import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Navbar from "@/components/Navbar";
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
    <html lang="en" className={outfit.variable}>
      <body>
        <Navbar />
        {/* Push page content below the fixed navbar */}
        <div style={{ paddingTop: "var(--nav-height)" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
