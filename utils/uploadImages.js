const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const catchAsync = require("./catchAsync");
const multer = require('multer');

// 1. Cloudinary Configuration (Move these to .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

// Multer setup remains the same (Memory Storage)
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new Error("Not an image!"), false);
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadImages = upload.fields([
  { name: 'images', maxCount: 9 },
  { name: 'profilePhoto', maxCount: 1 }
]);

// Helper function to handle the stream upload
const streamUpload = (buffer, options) => {
  return new Promise((resolve, reject) => {
    console.log(process.env.CLOUDINARY_KEY,process.env.CLOUDINARY_NAME)

    if (!process.env.CLOUDINARY_KEY || !process.env.CLOUDINARY_NAME) {
      return reject(new Error("Cloudinary credentials missing! Check your .env file."));
    }
    let stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

exports.resizeImage = catchAsync(async (req, res, next) => {
  if (!req.files || (!req.files.images && !req.files.profilePhoto)) return next();

  // Process profile photo
  if (req.files.profilePhoto) {
    const file = req.files.profilePhoto[0];
    
    // Cloudinary can handle resizing/formatting automatically!
    const result = await streamUpload(file.buffer, {
      folder: 'profile_photos',
      public_id: `user-${req.user?.id || 'profile'}-${Date.now()}`,
      transformation: [
        { width: 100, height: 100, crop: "fill" },
        { quality: "auto", fetch_format: "webp" }
      ]
    });

    // Store the URL in the body instead of just a filename
    req.body.profilePhoto = result.secure_url;
  }

  // Process task images
  if (req.files.images) {
    req.body.taskImages = [];
    
    await Promise.all(
      req.files.images.map(async (file, i) => {
        const result = await streamUpload(file.buffer, {
          folder: 'task_images',
          transformation: [
            { width: 300, height: 300, crop: "fit", background: "white" },
            { quality: 90, fetch_format: "jpg" }
          ]
        });
        req.body.taskImages.push(result.secure_url);
      })
    );
  }

  next();
});