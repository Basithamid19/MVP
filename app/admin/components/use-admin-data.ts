'use client';

import { useCallback, useEffect, useState } from 'react';

/* ─── Admin fetch hooks ─────────────────────────────────────────────────────
 * Every list module previously carried the same eight lines of fetch/loading
 * boilerplate. The URLs, methods and payloads are unchanged — this is only the
 * relocation of that boilerplate.
 * ────────────────────────────────────────────────────────────────────────── */

/** GET /api/admin?section=… for the list sections (always a JSON array). */
export function useAdminList<T = any>(section: string) {
  const [rows, setRows]       = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin?section=${section}`)
      .then(async r => {
        const d = await r.json();
        setRows(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [section]);

  useEffect(() => { reload(); }, [reload]);

  return { rows, loading, reload, setRows };
}

/** PATCH /api/admin — the single mutation endpoint for every admin action. */
export function adminPatch(body: Record<string, unknown>) {
  return fetch('/api/admin', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
