import { Geist, Geist_Mono } from "next/font/google";

import ScrollbarVisibility from "@/components/ScrollbarVisibility";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeInitializer = `try{const theme=document.cookie.split("; ").find((cookie)=>cookie.startsWith("vsq-theme="))?.split("=")[1];if(theme==="light"){document.documentElement.dataset.theme="light"}}catch{}`;

export const metadata = {
  title: "Vanilla² - Minecraft Fabric Mod",
  description: "A Fabric combat and progression overhaul that keeps Minecraft close to vanilla while expanding weapons, armor, enchantments, and combat utility.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} scrollbar-while-scrolling h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ScrollbarVisibility />
        {children}
      </body>
    </html>
  );
}
