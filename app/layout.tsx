import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ActionBot — AI Action Bot Platform",
  description: "Build AI-powered action bots for your business",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
