const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Habit must belong to a user'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a habit title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    icon: {
      type: String,
      trim: true,
      default: 'check'
    },
    color: {
      type: String,
      trim: true,
      default: '#6366F1'
    },
    frequency: {
      type: String,
      enum: {
        values: ['daily'],
        message: 'Frequency must be daily'
      },
      default: 'daily'
    },
    reminderTime: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: props => `${props.value} is not a valid reminder time! Must be in HH:mm (24h) format`
      }
    },
    isArchived: {
      type: Boolean,
      default: false
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

// Compound index on user and isArchived for quick querying of active habits
habitSchema.index({ user: 1, isArchived: 1 });

module.exports = mongoose.model('Habit', habitSchema);

