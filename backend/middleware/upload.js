import os from 'node:os';
import path from 'node:path';
import multer from 'multer';

// Uploads are throwaway (analyzed then deleted) so they go to the os temp dir not a repo folder
// Extension check instead of mimetype since browsers report flac inconsistently
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.wav', '.mp3', '.flac'].includes(ext)) return cb(null, true);
    cb(new Error('Unsupported format. Use wav, mp3 or flac'));
  },
});

// Multer reports errors through its callback (not res), map to 400 json
const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Max size is 50 MB' : err.message;
    res.status(400).json({ message });
  });
};

export default handleUpload;
