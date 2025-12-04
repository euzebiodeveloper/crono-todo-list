const mongoose = require('mongoose');

// Subdocument schema for embedded todos
const TodoSubSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  color: { type: String, default: '#000000' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Todo', default: null },
  name: { type: String },
  completed: { type: Boolean, default: false },
  recurring: { type: Boolean, default: false },
  // whether this todo is a one-off reminder (mutually exclusive with recurring)
  reminder: { type: Boolean, default: false },
  // date/time when the reminder should be sent (required when `reminder` is true)
  reminderDate: { type: Date },
  // when the reminder email was sent (used to avoid duplicate sends)
  reminderSentAt: { type: Date, default: null },
  weekdays: { type: [String], default: [] },
  dueDate: { type: Date },
  // meta-type tasks support (goal with repeated intervals)
  meta: { type: Boolean, default: false },
  metaTime: { type: Number, default: 1 },
  metaUnit: { type: String, default: 'min' },
  metaReps: { type: Number, default: 1 },
  metaCompletedCount: { type: Number, default: 0 },
  // tracking for overdue notification emails on embedded todos
  overdueEmailCount: { type: Number, default: 0 },
  lastOverdueEmailAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  todos: { type: [TodoSubSchema], default: [] },
  completedActivities: { type: [new mongoose.Schema({
    originalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Todo' },
    title: { type: String },
    description: { type: String },
    completedAt: { type: Date, default: Date.now },
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Todo', default: null },
    cardTitle: { type: String, default: null },
    cardColor: { type: String, default: null },
    // whether the original activity was recurring
    recurring: { type: Boolean, default: false },
    // whether this completed snapshot can be recovered back into active todos
    recoverable: { type: Boolean, default: true }
  }, { _id: false })], default: [] },
  // password reset token and expiry (optional)
  resetPasswordCode: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
