import { NextRequest, NextResponse } from 'next/server';

// ── Types ───────────────────────────────────────────────────────────────────

interface Suggestion {
  primary: string;
  secondary: string;
  full: string;
}

// ── In-memory street cache ──────────────────────────────────────────────────
// Module-level: shared across requests in the same server instance.
// Populated on first call; refreshed every 24 h.

let streetCache: string[] | null = null;
let cacheTime = 0;
let fetchPromise: Promise<string[]> | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000;

async function fetchAllVilniusStreets(): Promise<string[]> {
  // CSV output: just the name column, no header row, one street per line.
  // Much smaller payload than JSON (~60 KB vs ~3 MB).
  const query = `[out:csv(name;false)][timeout:55];
area[name="Vilnius"][admin_level=6]->.city;
way["highway"]["name"](area.city);
out;`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    headers: {
      'Content-Type': 'text/plain',
      'User-Agent': 'AladdinMarketplace/1.0 (support@aladdin.lt)',
    },
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);

  const text = await res.text();

  // Deduplicate and sort alphabetically (Lithuanian locale)
  const names = [
    ...new Set(text.split('\n').map(l => l.trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, 'lt'));

  return names;
}

async function getStreets(): Promise<string[]> {
  const now = Date.now();

  // Return fresh cache immediately
  if (streetCache && now - cacheTime < CACHE_TTL) return streetCache;

  // Deduplicate concurrent in-flight requests
  if (!fetchPromise) {
    fetchPromise = fetchAllVilniusStreets()
      .then(streets => {
        streetCache = streets;
        cacheTime = Date.now();
        fetchPromise = null;
        console.log(`[geocode] Loaded ${streets.length} Vilnius streets`);
        return streets;
      })
      .catch(err => {
        fetchPromise = null;
        console.error('[geocode] Overpass fetch failed:', err.message);
        return streetCache ?? [];
      });
  }

  return fetchPromise;
}

// Kick off pre-fetch at module load so the cache is warm before the first user request
void getStreets();

// ── Route handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const streets = await getStreets();

  // If streets haven't loaded yet, fall back to Nominatim for this request
  if (streets.length === 0) {
    return nominatimFallback(q);
  }

  const qLow = q.toLowerCase();

  // Prefix-first ranking: streets that START with the query appear before ones that contain it
  const prefixMatches: string[] = [];
  const containsMatches: string[] = [];

  for (const s of streets) {
    const sLow = s.toLowerCase();
    if (sLow.startsWith(qLow)) {
      prefixMatches.push(s);
    } else if (sLow.includes(qLow)) {
      containsMatches.push(s);
    }
  }

  const results: Suggestion[] = [...prefixMatches, ...containsMatches]
    .slice(0, 8)
    .map(name => ({ primary: name, secondary: 'Vilnius', full: `${name}, Vilnius` }));

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'no-store' }, // always fresh per keystroke
  });
}

// ── Nominatim fallback (used only while Overpass cache is warming) ──────────

async function nominatimFallback(q: string): Promise<NextResponse> {
  const params = new URLSearchParams({
    q: `${q}, Vilnius`,
    format: 'json',
    addressdetails: '1',
    limit: '8',
    countrycodes: 'lt',
    viewbox: '24.49,54.54,25.51,54.87',
    bounded: '0',
  });

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      { headers: { 'User-Agent': 'AladdinMarketplace/1.0 (support@aladdin.lt)' } },
    );
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json() as NominatimResult[];
    const seen = new Set<string>();

    const results: Suggestion[] = data
      .filter(r => r.address?.road || r.address?.pedestrian)
      .map(r => {
        const road = r.address.road || r.address.pedestrian || '';
        const num  = r.address.house_number ? ` ${r.address.house_number}` : '';
        const dist = r.address.suburb || r.address.neighbourhood || '';
        const primary   = `${road}${num}`;
        const secondary = dist ? `${dist}, Vilnius` : 'Vilnius';
        return { primary, secondary, full: `${primary}, ${secondary}` };
      })
      .filter(r => {
        if (!r.primary || seen.has(r.primary)) return false;
        seen.add(r.primary);
        return true;
      })
      .slice(0, 6);

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}

interface NominatimResult {
  address: {
    road?: string;
    pedestrian?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
  };
}
