import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Expense Tracker',
  description: 'A premium, Apple-inspired daily expense tracker and budget manager.',
  openGraph: {
    title: 'Expense Tracker',
    description: 'A premium, Apple-inspired daily expense tracker and budget manager.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Expense Tracker',
    description: 'A premium, Apple-inspired daily expense tracker and budget manager.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
