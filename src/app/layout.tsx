import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Claude NerfDetector - Community Performance Monitoring',
  description: 'Track Claude Code performance changes over time with community-driven testing',
  keywords: 'claude, performance, monitoring, testing, community',
  openGraph: {
    title: 'Claude NerfDetector',
    description: 'Community Performance Monitoring for Claude Code',
    url: 'https://claude-nerf.com',
    siteName: 'Claude NerfDetector',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}