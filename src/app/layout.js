import { Geist, Geist_Mono } from "next/font/google";

import ConsoleCommands from "@/commands/ConsoleCommands";
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

export const metadata = {
  title: "Vanilla² - Minecraft Fabric Mod",
  description: "A Fabric combat and progression overhaul that keeps Minecraft close to vanilla while expanding weapons, armor, enchantments, and combat utility.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} scrollbar-while-scrolling h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ScrollbarVisibility />
        <ConsoleCommands />
        {children}
      </body>
    </html>
  );
}
