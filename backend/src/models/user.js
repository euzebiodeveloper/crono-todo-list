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
  weekdays: { type: [String], default: [] },
  dueDate: { type: Date },
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
    cardColor: { type: String, default: null }
  }, { _id: false })], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
