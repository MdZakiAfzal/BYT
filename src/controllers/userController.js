const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Helper to filter allowed fields (Security)
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Middleware to start the "get me" request
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// 1. UPDATE PROFILE (Name, Email, Preferences)
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use /auth/updateMyPassword.', 400));
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  // We explicitly allow 'preferences' so they can toggle marketing emails
  const filteredBody = filterObj(req.body, 'name', 'email', 'preferences');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

// 2. DELETE ACCOUNT (Soft Delete)
exports.deleteMe = catchAsync(async (req, res, next) => {
  // We do not delete the data, we just set active to false
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// 3. GET USER INFO
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('No user found with that ID', 404));

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});