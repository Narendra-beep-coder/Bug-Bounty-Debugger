import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BugHunter - Multi-Language Bug Detector",
  description: "A powerful bug bounty debugger that detects bugs, security vulnerabilities, and code quality issues across 13+ programming languages.",
  keywords: ["bug bounty", "debugger", "code analysis", "security", "vulnerability scanner", "static analysis"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
