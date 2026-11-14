import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { folder, filename } = await params;

    // Sanitasi nama folder dan file untuk keamanan (mencegah path traversal)
    const safeFolder = folder.replace(/[^a-z0-9_-]/gi, '');
    const safeFilename = path.basename(filename);

    const allowedFolders = ['products', 'stores', 'avatars'];
    if (!allowedFolders.includes(safeFolder)) {
      return new NextResponse('Folder not found', { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', safeFolder, safeFilename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(safeFilename).toLowerCase();

    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('Serve upload error:', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
