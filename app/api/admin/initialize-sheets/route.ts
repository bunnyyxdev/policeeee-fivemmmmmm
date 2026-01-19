import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { initializeAllTemplates } from '@/lib/google-sheets-helpers';

async function handlerPOST(request: NextRequest, user: any) {
  try {
    await initializeAllTemplates();

    return NextResponse.json({
      success: true,
      message: 'All Google Sheets templates initialized successfully',
    });
  } catch (error: any) {
    console.error('Failed to initialize templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initialize templates',
      },
      { status: 500 }
    );
  }
}

export const POST = requireAdmin(handlerPOST);
