/* ============================================================
   Quality EduTech Platform — Supabase integration
   Saves signups, logins, quiz results and lab visits to your
   Supabase database (while keeping localStorage working as-is,
   so the site still works offline).

   SETUP (once):
   1. Create a free project at https://supabase.com
   2. Run supabase_schema.sql in Dashboard -> SQL Editor
   3. Dashboard -> Settings -> API: copy the Project URL and
      the "anon public" key into the two constants below.
   4. Add to index.html just BEFORE your main <script>:
        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
        <script src="scripts/supabase-integration.js"></script>
   5. Make the 3 one-line edits listed at the bottom.
   ============================================================ */

const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co';   // <-- paste yours
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';             // <-- paste yours

const sb = (typeof supabase !== 'undefined' && SUPABASE_URL.indexOf('YOUR-') === -1)
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/* ---------- 1. Save a new signup (call from doSignUp) ---------- */
async function sbSaveSignup(user) {
  // user: {name, email, passwordHash, grade, age, createdAt}
  if (!sb) return;
  try {
    await sb.from('students').insert({
      name: user.name,
      email: user.email,
      password_hash: user.passwordHash,
      grade: user.grade,
      age: user.age
    });
  } catch (e) { console.warn('[supabase] signup save failed', e); }
}

/* ---------- 2. Record a login (call from doSignIn/doSignUp) ---------- */
async function sbRecordLogin(email) {
  if (!sb) return;
  try {
    const { data } = await sb.from('students').select('id').eq('email', email).maybeSingle();
    await sb.from('login_events').insert({
      student_id: data ? data.id : null,
      email: email,
      user_agent: navigator.userAgent.slice(0, 200)
    });
  } catch (e) { console.warn('[supabase] login record failed', e); }
}

/* ---------- 3. Save a finished quiz (call when state.qz.done) ---------- */
async function sbSaveQuiz(qz, userEmail, score, total) {
  if (!sb) return;
  try {
    const { data } = await sb.from('students').select('id').eq('email', userEmail).maybeSingle();
    await sb.from('quiz_results').insert({
      student_id: data ? data.id : null,
      grade: String(qz.grade),
      subject: qz.subject,
      answers: qz.answers,
      score: score,
      total: total
    });
  } catch (e) { console.warn('[supabase] quiz save failed', e); }
}

/* ---------- 4. Record a lab visit (call from labs/*.html) ---------- */
async function sbRecordLab(labName, userEmail) {
  if (!sb) return;
  try {
    let studentId = null;
    if (userEmail) {
      const { data } = await sb.from('students').select('id').eq('email', userEmail).maybeSingle();
      studentId = data ? data.id : null;
    }
    await sb.from('lab_activity').insert({ student_id: studentId, lab: labName });
  } catch (e) { console.warn('[supabase] lab record failed', e); }
}

/* ============================================================
   THE 3 EDITS IN index.html
   ============================================================
   A) In doSignUp(), right after saveUsers(users); add:
        sbSaveSignup(users[users.length-1]);
        sbRecordLogin(email);

   B) In doSignIn(), right after state.user = userData; add:
        sbRecordLogin(email);

   C) Where the quiz finishes (where qz.done becomes true /
      the score is shown), add:
        sbSaveQuiz(state.qz, state.user.email, score, total);
      (use your actual score/total variable names)

   And in each lab page (labs/chemistry.html etc.), inside a
   <script> at the bottom, add:
        const u = JSON.parse(localStorage.getItem('qe_user')||'null');
        sbRecordLab('chemistry', u ? u.email : null);   // match the lab name
   (also include the two <script> tags from step 4 of SETUP)
   ============================================================ */