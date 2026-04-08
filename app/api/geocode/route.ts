import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const params = new URLSearchParams({
    q: `${q}, Vilnius`,
    format: 'json',
    addressdetails: '1',
    limit: '8',
    countrycodes: 'lt',
    // Vilnius bounding box — biases results to the city
    viewbox: '24.49,54.54,25.51,54.87',
    bounded: '0',
  });

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AladdinMarketplace/1.0 (support@aladdin.lt)',
        'Accept-Language': 'lt,en',
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();

    // Deduplicate by road name + suburb and format for display
    const seen = new Set<string>();
    const results = (data as NominatimResult[])
      .filter(r => r.address?.road || r.address?.pedestrian)
      .map(r => {
        const road = r.address.road || r.address.pedestrian || r.address.path || '';
        const houseNumber = r.address.house_number ? ` ${r.address.house_number}` : '';
        const district = r.address.suburb || r.address.neighbourhood || r.address.quarter || '';
        const primary = `${road}${houseNumber}`;
        const secondary = district ? `${district}, Vilnius` : 'Vilnius';
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
  display_name: string;
  address: {
    road?: string;
    pedestrian?: string;
    path?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
    city?: string;
  };
}
