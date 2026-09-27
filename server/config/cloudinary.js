import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

/**
 * Checks if real production Cloudinary credentials are provided
 */
export const isCloudinaryConfigured = () => {
  return Boolean(
    cloudName &&
      apiKey &&
      apiSecret &&
      cloudName !== 'your_cloudinary_cloud_name' &&
      !apiSecret.includes('mock')
  );
};

export default cloudinary;
