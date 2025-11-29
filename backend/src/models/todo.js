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
  weekdays: { type: [String], default: [] }, // e.g. ['mon','wed']
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Todo', TodoSchema);
