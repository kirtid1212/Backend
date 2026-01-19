const { v2: cloudinary } = require('cloudinary');
const { v4: uuidv4 } = require('uuid');

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_URL
} = process.env;

let cloudinaryReady = false;

if (CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
  cloudinaryReady = true;
} else if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true
  });
  cloudinaryReady = true;
} else {
  console.warn(
    '[cloudinary] Cloudinary credentials are missing; image uploads will fail.'
  );
}

const ensureCloudinaryConfigured = () => {
  if (!cloudinaryReady) {
    throw new Error('Cloudinary is not configured');
  }
};

const uploadProductImage = async (buffer, options = {}) => {
  ensureCloudinaryConfigured();

  if (!buffer) {
    throw new Error('No image buffer provided for upload');
  }

  const folder = options.folder || 'ecommerce/products';
  const publicId = options.publicId || `product-${uuidv4()}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        public_id: publicId,
        overwrite: true,
        transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }]
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

module.exports = {
  uploadProductImage
};
