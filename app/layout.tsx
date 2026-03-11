import type {Metadata} from 'next';
import './globals.css'; // Global styles
import AuthProvider from '@/components/providers/auth-provider';

export const metadata: Metadata = {
  title: 'VilniusPro Marketplace',
  description: 'Find trusted local pros in Vilnius',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
