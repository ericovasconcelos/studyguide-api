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

// Middleware para logging
router.use((req, res, next) => {
  console.log(`[SYNC] ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`[SYNC] Headers: ${JSON.stringify(req.headers)}`);
  console.log(`[SYNC] Query: ${JSON.stringify(req.query)}`);
  next();
});

// Endpoint para upload de mudanças
router.post('/upload', async (req, res) => {
  try {
    const { studies, cycles } = req.body;
    const userId = req.headers['x-user-id'];
    
    console.log(`[SYNC] Upload request from user ${userId} with ${studies?.length || 0} studies and ${cycles?.length || 0} cycles`);
    
    const sync = new Sync({
      userId,
      studies,
      cycles,
      compressed: true
    });

    await sync.save();
    
    console.log(`[SYNC] Successfully saved sync data for user ${userId}`);
    res.json({ success: true, timestamp: sync.timestamp });
  } catch (error) {
    console.error(`[SYNC] Upload error: ${error.message}`);
    console.error(error.stack);
    res.status(500).json({ error: 'Failed to save sync data' });
  }
});

// Endpoint para download de mudanças
router.get('/download', async (req, res) => {
  try {
    console.log(`[SYNC] Download request received with query:`, req.query);
    
    // Verificar se 'since' está presente na query
    if (!req.query.since) {
      console.log('[SYNC] Parameter "since" is missing in the request');
      return res.status(400).json({ error: 'Missing parameter "since"' });
    }
    
    const since = new Date(req.query.since);
    
    // Verificar se a data é válida
    if (isNaN(since.getTime())) {
      console.log(`[SYNC] Invalid date format: ${req.query.since}`);
      return res.status(400).json({ error: 'Invalid date format for parameter "since"' });
    }
    
    const userId = req.headers['x-user-id'];
    
    // Verificar se o userId está presente
    if (!userId) {
      console.log('[SYNC] Header "X-User-Id" is missing');
      return res.status(400).json({ error: 'Missing header "X-User-Id"' });
    }

    console.log(`[SYNC] Download request from user ${userId} since ${since.toISOString()}`);

    const latestSync = await Sync.findOne({ 
      userId,
      timestamp: { $gt: since }
    }).sort({ timestamp: -1 });

    if (!latestSync) {
      console.log(`[SYNC] No new changes found for user ${userId} since ${since.toISOString()}`);
      return res.json({ studies: [], cycles: [], timestamp: new Date() });
    }

    console.log(`[SYNC] Found changes for user ${userId}: ${latestSync.studies?.length || 0} studies and ${latestSync.cycles?.length || 0} cycles`);
    res.json({
      studies: latestSync.studies,
      cycles: latestSync.cycles,
      timestamp: latestSync.timestamp
    });
  } catch (error) {
    console.error(`[SYNC] Download error: ${error.message}`);
    console.error(error.stack);
    res.status(500).json({ error: 'Failed to retrieve sync data' });
  }
});

module.exports = router; 