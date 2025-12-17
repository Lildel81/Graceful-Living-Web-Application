const path = require('path');
const fs = require('fs');
const multer = require('multer');



// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadRoot),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname).toLowerCase();
//     const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_\-]/gi, '_');
//     cb(null, `${Date.now()}_${base}${ext}`);
//   }
// });

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ok = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.mimetype);
  cb(ok ? null : new Error('Only image files are allowed'), ok);
};

function safeFilename(originalname) {
  const ext = path.extname(originalname).toLowerCase();
  const base = path.basename(originalname, ext).replace(/[^a-z0-9_\-]/gi, '_');
  return `${Date.now()}_${base}${ext}`;
}
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
module.exports = { upload , safeFilename};

// module.exports = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 5MB limit
//});