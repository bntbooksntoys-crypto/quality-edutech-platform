// Export every student record from MongoDB (password hashes excluded).
// Usage:  node scripts/export-students.js            -> prints JSON
//         node scripts/export-students.js out.json   -> writes file
//         node scripts/export-students.js out.csv    -> writes CSV
// Uses MONGO_URI from .env (same as server.js).
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quality_education';
const User = mongoose.model('User', new mongoose.Schema({
  name: String, email: String, password: String, grade: String,
  age: Number, role: String, createdAt: Date
}));

(async () => {
  await mongoose.connect(MONGO_URI);
  const students = await User.find({}).select('-password').sort({ createdAt: -1 }).lean();
  const out = process.argv[2];
  if (out && out.endsWith('.csv')) {
    const cols = ['_id', 'name', 'email', 'grade', 'age', 'role', 'createdAt'];
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    fs.writeFileSync(out, [cols.join(','), ...students.map(s => cols.map(c => esc(s[c])).join(','))].join('\n'));
    console.log(`Wrote ${students.length} students to ${out}`);
  } else if (out) {
    fs.writeFileSync(out, JSON.stringify(students, null, 2));
    console.log(`Wrote ${students.length} students to ${out}`);
  } else {
    console.log(JSON.stringify(students, null, 2));
  }
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
