import fs from 'fs';
import path from 'path';

/**
 * Saves a file to either the local public/uploads directory or a cloud storage provider (e.g. Supabase Storage),
 * and returns the file's accessible URL.
 */
export async function saveUploadFile(file: File, subFolder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueFilename = `${Date.now()}_${cleanName}`;
  const storageProvider = process.env.STORAGE_PROVIDER || 'local';

  // Supabase Storage provider implementation (direct API REST)
  if (storageProvider === 'supabase') {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const bucketName = process.env.SUPABASE_BUCKET || 'sipms-uploads';

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase URL/Anon Key missing. Falling back to local storage.');
    } else {
      try {
        const cleanSupabaseUrl = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
        const uploadUrl = `${cleanSupabaseUrl}/storage/v1/object/${bucketName}/${subFolder}/${uniqueFilename}`;

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': file.type || 'application/octet-stream',
            'x-upsert': 'true'
          },
          body: buffer
        });

        if (response.ok) {
          // Return public URL to access the uploaded file
          return `${cleanSupabaseUrl}/storage/v1/object/public/${bucketName}/${subFolder}/${uniqueFilename}`;
        } else {
          const errMsg = await response.text();
          console.error('Supabase upload failed:', errMsg);
        }
      } catch (err) {
        console.error('Error uploading to Supabase:', err);
      }
    }
  }

  // Fallback to local storage (Default)
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subFolder);
  
  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, uniqueFilename);

  // Write file
  fs.writeFileSync(filePath, buffer);

  // Return public URL relative path
  return `/uploads/${subFolder}/${uniqueFilename}`;
}
