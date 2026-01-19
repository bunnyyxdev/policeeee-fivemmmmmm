import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface UploadResult {
  filename: string;
  path: string;
  url: string; // Base64 data URL
  size: number;
  mimetype: string;
}

export async function saveImage(file: File, folder: string = 'general'): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${uuidv4()}.${ext}`;

  // Convert File to base64 data URL
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;

  return {
    filename,
    path: `data:${file.type};base64,${base64}`, // Store base64 in path for reference
    url: dataUrl, // Return base64 data URL
    size: file.size,
    mimetype: file.type,
  };
}

export async function handleImageUpload(request: NextRequest, folder: string = 'general'): Promise<UploadResult> {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    throw new Error('No file provided');
  }

  return await saveImage(file, folder);
}
