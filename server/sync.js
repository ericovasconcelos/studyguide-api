const mongoose = require('mongoose');
const compression = require('compression');
const express = require('express');
const router = express.Router();

// Schema para armazenar snapshots de sincronização
const syncSchema = new mongoose.Schema({
  userId: String,
  timestamp: { type: Date, default: Date.now },
  studies: [{
    id: String,
    date: Date,
    subject: String,
    timeSpent: Number,
    questions: Number,
    correctAnswers: Number,
    notes: String,
    createdAt: Date,
    version: Number
  }],
  cycles: [{
    id: Number,
    active: Boolean,
    subjects: [String],
    startDate: Date,
    endDate: Date,
    version: Number
  }],
  compressed: Boolean
});

const Sync = mongoose.model('Sync', syncSchema);

// Middleware para compressão de dados
router.use(compression());

// Endpoint para upload de mudanças
router.post('/upload', async (req, res) => {
  try {
    const { studies, cycles } = req.body;
    
    const sync = new Sync({
      userId: req.headers['x-user-id'],
      studies,
      cycles,
      compressed: true
    });

    await sync.save();
    
    res.json({ success: true, timestamp: sync.timestamp });
  } catch (error) {
    console.error('Sync upload error:', error);
    res.status(500).json({ error: 'Failed to save sync data' });
  }
});

// Endpoint para download de mudanças
router.get('/download', async (req, res) => {
  try {
    const since = new Date(req.query.since);
    const userId = req.headers['x-user-id'];

    const latestSync = await Sync.findOne({ 
      userId,
      timestamp: { $gt: since }
    }).sort({ timestamp: -1 });

    if (!latestSync) {
      return res.json({ studies: [], cycles: [], timestamp: new Date() });
    }

    res.json({
      studies: latestSync.studies,
      cycles: latestSync.cycles,
      timestamp: latestSync.timestamp
    });
  } catch (error) {
    console.error('Sync download error:', error);
    res.status(500).json({ error: 'Failed to retrieve sync data' });
  }
});

module.exports = router; 