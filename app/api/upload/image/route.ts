import { NextRequest, NextResponse } from 'next/server';
import { handleImageUpload } from '@/lib/image-upload';
import { requireAuth } from '@/lib/api-helpers';

async function handler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'general';

    if (request.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const result = await handleImageUpload(request, folder);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload image' }, { status: 400 });
  }
}

export const POST = requireAuth(handler);
