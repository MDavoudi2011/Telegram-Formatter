import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Telegram Formatter',
  description: 'Format text for Telegram messages',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="fa" dir="rtl">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
