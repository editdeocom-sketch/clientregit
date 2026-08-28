const express = require('express');
const { getVideos, getVideoById, createVideo, updateVideoStatus, deleteVideo, getComments, createComment, getShareLink, getSharedVideo, getSharedComments, createSharedComment, updateSharedStatus } = require('../controllers/videoController');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, req.app.locals.videoUploadDir),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `video-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/ogg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid video type'));
  },
});
router.get('/shared/:token', getSharedVideo);
router.get('/shared/:token/comments', getSharedComments);
router.post('/shared/:token/comments', createSharedComment);
router.put('/shared/:token/status', updateSharedStatus);
router.use(protect);
router.route('/').get(getVideos).post(upload.single('file'), createVideo);
router.route('/:id').get(getVideoById).delete(deleteVideo);
router.get('/:id/share', getShareLink);
router.put('/:id/status', updateVideoStatus);
router.route('/:id/comments').get(getComments).post(createComment);
module.exports = router;
