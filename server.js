require('dotenv').config();
const express = require('express');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
app.use(express.json());
app.use(cors());

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true }); // will auto-read CLOUDINARY_URL
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

console.log('Cloudinary config:', cloudinary.config());

// Setup multer storage (files go directly to Cloudinary)
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'events', // 👈 all uploads will go into events folder
    resource_type: 'image',
  },
});
const parser = multer({ storage });

// ✅ Upload endpoint
app.post('/upload', parser.single('file'), (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    res.json({
      success: true,
      url: req.file.path,
      public_id: req.file.filename,
    });
  } catch (err) {
    console.error('Error uploading:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Delete endpoint
app.post('/delete', async (req, res) => {
  try {
    const { public_id } = req.body;
    if (!public_id || typeof public_id !== 'string') {
      return res.status(400).json({ error: 'public_id (string) required in body' });
    }
    const result = await cloudinary.uploader.destroy(public_id, { invalidate: true });
    res.json({ success: true, result });
  } catch (err) {
    console.error('Error deleting image:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
