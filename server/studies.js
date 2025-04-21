const express = require('express');
const router = express.Router();
const Study = require('../models/Study');

// Middleware para logging
router.use((req, res, next) => {
  console.log(`[STUDIES] ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`[STUDIES] Headers: ${JSON.stringify(req.headers)}`);
  console.log(`[STUDIES] Query: ${JSON.stringify(req.query)}`);
  next();
});

// Middleware para verificar userId
const requireUserId = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(400).json({ error: 'Missing header "X-User-Id"' });
  }
  req.userId = userId;
  next();
};

// GET /studies - Listar todos os estudos do usuário
router.get('/', requireUserId, async (req, res) => {
  try {
    const { startDate, endDate, subject } = req.query;
    const query = { userId: req.userId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (subject) {
      query.subject = subject;
    }

    const studies = await Study.find(query)
      .sort({ date: -1 })
      .lean();

    res.json(studies);
  } catch (error) {
    console.error('[STUDIES] Error fetching studies:', error);
    res.status(500).json({ error: 'Failed to fetch studies' });
  }
});

// POST /studies - Criar um novo estudo
router.post('/', requireUserId, async (req, res) => {
  try {
    const studyData = {
      ...req.body,
      userId: req.userId,
      id: req.body.id || `study-${Date.now()}`
    };

    const study = new Study(studyData);
    await study.save();

    res.status(201).json(study);
  } catch (error) {
    console.error('[STUDIES] Error creating study:', error);
    res.status(500).json({ error: 'Failed to create study' });
  }
});

// PUT /studies/:id - Atualizar um estudo
router.put('/:id', requireUserId, async (req, res) => {
  try {
    const study = await Study.findOneAndUpdate(
      { id: req.params.id, userId: req.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!study) {
      return res.status(404).json({ error: 'Study not found' });
    }

    res.json(study);
  } catch (error) {
    console.error('[STUDIES] Error updating study:', error);
    res.status(500).json({ error: 'Failed to update study' });
  }
});

// DELETE /studies/:id - Deletar um estudo
router.delete('/:id', requireUserId, async (req, res) => {
  try {
    const study = await Study.findOneAndDelete({
      id: req.params.id,
      userId: req.userId
    });

    if (!study) {
      return res.status(404).json({ error: 'Study not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[STUDIES] Error deleting study:', error);
    res.status(500).json({ error: 'Failed to delete study' });
  }
});

// POST /studies/bulk - Criar ou atualizar múltiplos estudos
router.post('/bulk', requireUserId, async (req, res) => {
  try {
    const studies = req.body.map(study => ({
      ...study,
      userId: req.userId,
      id: study.id || `study-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

    const operations = studies.map(study => ({
      updateOne: {
        filter: { id: study.id, userId: req.userId },
        update: { $set: study },
        upsert: true
      }
    }));

    await Study.bulkWrite(operations);

    res.status(201).json({ success: true, count: studies.length });
  } catch (error) {
    console.error('[STUDIES] Error bulk upserting studies:', error);
    res.status(500).json({ error: 'Failed to bulk upsert studies' });
  }
});

module.exports = router; 