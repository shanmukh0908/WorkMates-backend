const cloudinary = require("cloudinary").v2;
const catchAsync = require("./catchAsync");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

// Generate upload signature
exports.getUploadSignature = catchAsync(async (req, res, next) => {

  const timestamp = Math.round(Date.now() / 1000);
  const folder = req.query.folder;
  // const transformationRule = "w_1200,c_limit";
  const transformationRule = "w_1200,c_limit,f_auto,q_auto";

  const paramsToSign = {
    timestamp,
    folder,
    transformation: transformationRule
  };

  if (folder === "profile_photos") {
      paramsToSign.public_id = `user-${req.user.id}`;
      paramsToSign.overwrite = true;
    }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_SECRET
  );

  res.status(200).json({
    status: "success",
    data: {
      timestamp,
      signature,
      folder,
      public_id: paramsToSign.public_id,
      overwrite: paramsToSign.overwrite,
      transformation: paramsToSign.transformation,
      cloudName: process.env.CLOUDINARY_NAME,
      apiKey: process.env.CLOUDINARY_KEY
    }
  });

});