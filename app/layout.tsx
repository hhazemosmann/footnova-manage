import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  /* The workspace covers recruiting and finance now, so the tab no longer
     names only half of it. */
  title: 'FootNova Management',
  description: 'FootNova management — recruiting and finance in one workspace.',
  icons: { icon: '/footnova-logo.png' },
};

/* Source <head>: <meta name="viewport" content="width=device-width, initial-scale=1"> */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
