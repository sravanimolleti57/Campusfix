import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload an in-memory buffer or disk file to Cloudinary
 * @param {Buffer|Object} file - Multer file object or buffer
 * @param {Object} options - Upload options (folder, tags, etc.)
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export const uploadToCloudinary = async (file, options = {}) => {
  const folder = options.folder || 'campusfix/complaints';
  const buffer = file.buffer || (file.path ? fs.readFileSync(file.path) : file);

  if (!buffer || buffer.length === 0) {
    throw new Error('Empty file buffer provided for image upload');
  }

  // 1. Production Mode: Live Cloudinary Upload
  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary Upload Error]:', error);
            return reject(new Error(`Cloudinary upload failed: ${error.message}`));
          }
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  // 2. Development / Testing Mode: Local Cache with Cloudinary-formatted secure URLs
  // This enables testing and development without requiring external network connectivity or paid Cloudinary credentials
  const devUploadDir = path.join(__dirname, '..', 'uploads', folder.replace(/[^a-zA-Z0-9_-]/g, '_'));
  if (!fs.existsSync(devUploadDir)) {
    fs.mkdirSync(devUploadDir, { recursive: true });
  }

  const ext = file.originalname ? path.extname(file.originalname).toLowerCase() : '.webp';
  const cleanBase = file.originalname
    ? path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_')
    : 'upload';
  const filename = `${cleanBase}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext || '.jpg'}`;
  const localFilePath = path.join(devUploadDir, filename);

  fs.writeFileSync(localFilePath, buffer);

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'campusfix-cloud';
  const publicId = `${folder}/${cleanBase}_${Date.now()}`;
  const secureUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v${Date.now()}/${publicId}${ext || '.jpg'}`;

  return {
    secure_url: secureUrl,
    public_id: publicId,
    localFallbackPath: `/uploads/${folder.replace(/[^a-zA-Z0-9_-]/g, '_')}/${filename}`,
    format: ext.replace('.', '') || 'jpg',
  };
};

/**
 * Remove an image from Cloudinary by public_id
 * @param {string} publicId
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  if (isCloudinaryConfigured()) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn(`[Cloudinary Cleanup Warning]: Failed to delete image ${publicId}:`, err.message);
    }
  }
};
