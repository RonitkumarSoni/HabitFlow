const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Check-in must belong to a user'],
      index: true
    },
    habit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: [true, 'Check-in must belong to a habit'],
      index: true
    },
    date: {
      type: String,
      required: [true, 'Please provide a check-in date in YYYY-MM-DD format'],
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Unique compound index on habit and date to prevent duplicate check-ins for the same habit on the same day
checkInSchema.index({ habit: 1, date: 1 }, { unique: true });

// Compound index on habit, date, and user for fast range queries and ownership checks
checkInSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('CheckIn', checkInSchema);

