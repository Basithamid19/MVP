import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // In a real app, upload to S3/Supabase Storage.
  // For MVP, we'll simulate a URL.
  const simulatedUrl = `https://picsum.photos/seed/${file.name}/800/600`;

  const uploadedFile = await prisma.uploadedFile.create({
    data: {
      url: simulatedUrl,
      fileName: file.name,
      fileType: file.type,
    },
  });

  return NextResponse.json(uploadedFile);
}
