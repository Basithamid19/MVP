/** Returns a deterministic, always-correct fallback avatar URL based on name. */
export function avatarUrl(name: string | null | undefined, size = 150): string {
  const n = encodeURIComponent(name?.trim() || 'Pro');
  return `https://ui-avatars.com/api/?name=${n}&size=${size}&background=cdd9d0&color=1c3828&bold=true`;
}
