'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProviderIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/provider/dashboard'); }, [router]);
  return null;
}
