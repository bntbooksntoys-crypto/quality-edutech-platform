// Paste into the browser DevTools console on the Quality Education site.
// Downloads a JSON file with all student data stored in this browser:
// current profile, all registered accounts (password hashes removed), quiz progress.
(() => {
  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const data = {
    exportedAt: new Date().toISOString(),
    currentStudent: read('qe_user'),
    registeredStudents: (read('qe_users') || []).map(({ passwordHash, ...rest }) => rest),
    quizProgress: read('qe_qz'),
  };
  console.log(data);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'student-data.json';
  a.click();
})();
