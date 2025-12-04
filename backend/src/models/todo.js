const mongoose = require('mongoose');

const TodoSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  color: { type: String, default: '#000000' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Todo', default: null },
  name: { type: String },
  completed: { type: Boolean, default: false },
  recurring: { type: Boolean, default: false },
  // whether this todo is a one-off reminder
  reminder: { type: Boolean, default: false },
  // when the reminder should happen
  reminderDate: { type: Date },
  // meta-type tasks (user-defined goal composed of repeated intervals)
  meta: { type: Boolean, default: false },
  metaTime: { type: Number, default: 1 },
  metaUnit: { type: String, default: 'min' },
  metaReps: { type: Number, default: 1 },
  metaCompletedCount: { type: Number, default: 0 },
  // when the reminder email was sent (used to avoid duplicate sends)
  reminderSentAt: { type: Date, default: null },
  weekdays: { type: [String], default: [] }, // e.g. ['mon','wed']
  dueDate: { type: Date },
  // tracking for overdue notification emails
  overdueEmailCount: { type: Number, default: 0 },
  lastOverdueEmailAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Todo', TodoSchema);
