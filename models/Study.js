const mongoose = require('mongoose');

const studySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 0
  },
  questions: {
    type: Number,
    default: 0,
    min: 0
  },
  correctAnswers: {
    type: Number,
    default: 0,
    min: 0
  },
  topic: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    default: 'Gran Cursos'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    default: 1
  },
  cycleId: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

// Índices para melhorar a performance das queries
studySchema.index({ userId: 1, date: -1 });
studySchema.index({ userId: 1, subject: 1 });

// Middleware para atualizar o updatedAt antes de salvar
studySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware para atualizar o updatedAt antes de atualizar
studySchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Study', studySchema); 