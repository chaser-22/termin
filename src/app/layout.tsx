import type { Metadata, Viewport } from "next";
import { Geist_Mono, Hanken_Grotesk, Syne } from "next/font/google";
import "./globals.css";

// Magla type: Syne for display, Hanken Grotesk for everything else
const body = Hanken_Grotesk({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
});

const display = Syne({
  variable: "--font-display-face",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Termin — online zakazivanje", template: "%s · Termin" },
  description: "Online zakazivanje za salone, berbernice i ordinacije u Crnoj Gori.",
  applicationName: "Termin",
  appleWebApp: { capable: true, title: "Termin", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#d6dfda" },
    { media: "(prefers-color-scheme: dark)", color: "#16211d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sr-Latn-ME" className={`${body.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
