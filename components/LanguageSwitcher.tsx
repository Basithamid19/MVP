'use client';

import { useLocale } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'lt', label: 'LT', flag: '🇱🇹' },
];

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div className={`flex items-center gap-0.5 bg-surface-alt rounded-full p-0.5 ${className}`}>
      {LANGUAGES.map(({ code, label, flag }) => (
        <button
          key={code}
          onClick={() => setLocale(code)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
            locale === code
              ? 'bg-white text-ink shadow-sm'
              : 'text-ink-dim hover:text-ink'
          }`}
        >
          <span className="text-sm">{flag}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
