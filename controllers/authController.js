const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const AppError = require('../utils/appError')

// sign access token (short-lived)
const signAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// sign refresh token (long-lived)
const signRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.RT_SECRET,
    { expiresIn: process.env.RT_EXPIRES_IN }
  );
};

const createSendTokens = (req, res, user, protect = false) => {
  const userId = user._id;

  // Generate tokens
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);

  // Set refresh token in cookie
  res.cookie("rwt", refreshToken, {
    expires: new Date(
      Date.now() + parseInt(process.env.RT_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    sameSite: "Strict",
  });

  // Remove sensitive info
  user.password = undefined;

  if (protect) {
    return accessToken;
  }

  // Send access token in response
  res.status(200).json({
    status: "success",
    accessToken,
    data: { user },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  if (typeof req.body.location === 'string') {
    req.body.location = JSON.parse(req.body.location);
  }

  const newUser = await User.create(req.body);

  res.status(200).json({
    status: "success",
    data: { ...newUser.toObject(),password:undefined },
  });
});

exports.logIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password are required", 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError("Invalid email or password", 401));
  }

  const correct = await user.verifypassword(password, user.password);
  if (!correct) {
    return next(new AppError("Invalid password", 401));
  }

  // Send tokens (access + refresh)
  createSendTokens(req, res, user);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) Get token from Authorization header
  if (req.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Authentication failed", 401));
  }

  try {
    // 2) Verify access token
    console.log("verifying token",token)
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new AppError("User no longer exists", 401));
    }
    console.log("verified")

    // check for password change after the token was issued
    if (user.isPasswordChangedAfterToken(decoded.iat)) {
      return next(
        new AppError("Password recently changed. Please log in again.", 401)
      );
    }

    req.user = user;
    return next();
  } catch (err) {
    // 3) If token expired, try refresh token
    if (err.name === "TokenExpiredError") {
      console.log("using refresh")
      const refreshToken = req.cookies.rwt;
      if (!refreshToken) {
        return next(new AppError("Session expired. Please log in again.", 401));
      }

      try {
        const decoded = await promisify(jwt.verify)(
          refreshToken,
          process.env.RT_SECRET
        );

        const user = await User.findById(decoded.userId);
        if (!user) {
          return next(new AppError("User no longer exists", 401));
        }

        // issue new access + refresh tokens
        const accessToken = createSendTokens(req, res, user, true);

        req.user = user;
        if (accessToken) res.locals.accessToken = accessToken;

        return next();
      } catch (refreshErr) {
        return next(new AppError("Refresh token invalid or expired", 401));
      }
    }

    // 4) Handle other JWT errors
    if (err.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token", 401));
    }

    return next(new AppError("JWT error: " + err.message, 401));
  }
});

exports.logOut = (req, res) => {
  res.clearCookie("rwt", {
    httpOnly: true,
    sameSite: "Strict",
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });

  return res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};
