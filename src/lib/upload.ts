import fs from 'fs';
import path from 'path';

/**
 * Saves a file to the public/uploads directory and returns its public URL path.
 */
export async function saveUploadFile(file: File, subFolder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subFolder);
  
  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Create unique filename
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueFilename = `${Date.now()}_${cleanName}`;
  const filePath = path.join(uploadDir, uniqueFilename);

  // Write file
  fs.writeFileSync(filePath, buffer);

  // Return public URL relative path
  return `/uploads/${subFolder}/${uniqueFilename}`;
}
