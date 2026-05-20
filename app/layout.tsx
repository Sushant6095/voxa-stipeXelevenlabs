import './globals.css';

import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { calSans, geistMono, geistSans } from '@/lib/fonts';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ),
  title: {
    default: 'Voxa — AI Receptionist for Indian SMBs',
    template: '%s · Voxa',
  },
  description:
    'Voxa answers every call in Hindi, Tamil, Telugu, or English — books appointments, captures leads, and sends WhatsApp confirmations. Built for Indian small businesses.',
  applicationName: 'Voxa',
  keywords: [
    'AI receptionist',
    'voice agent',
    'Indian SMB',
    'ElevenLabs',
    'multilingual',
    'lead capture',
  ],
  openGraph: {
    title: 'Voxa — AI Receptionist for Indian SMBs',
    description:
      'Never miss a call. Voxa answers in your voice, in your language.',
    siteName: 'Voxa',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Voxa — AI Receptionist for Indian SMBs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voxa — AI Receptionist for Indian SMBs',
    description:
      'Never miss a call. Voxa answers in your voice, in your language.',
    images: ['/og.png'],
  },
  icons: {
    // app/icon.svg is the source of truth (Next.js file convention).
    // Explicit entry kept so social cards know the brand mark.
    icon: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${calSans.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
