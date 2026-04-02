import type {Metadata} from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/providers/auth-provider';
import { I18nProvider } from '@/lib/i18n/context';

/*
 * Manrope — premium, modern sans-serif with excellent legibility at all sizes.
 * The `variable` option sets --font-manrope on <html>, which globals.css
 * picks up via --font-sans in @theme, making `font-sans` resolve to Manrope.
 */
const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Aladdin — Trusted Local Professionals',
  description: 'Find and book verified local service professionals in Vilnius. Transparent pricing, real reviews, fast response.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body suppressHydrationWarning className="font-sans overflow-x-hidden">
        <AuthProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
