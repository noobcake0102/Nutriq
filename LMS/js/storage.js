/* ── DEFENSE FLOORING LMS — STORAGE LAYER ───────────────────────────────── */
window.DF_STORE = (function() {
  'use strict';

  const KEY = 'df_lms_v1';

  const DEFAULT_STATE = {
    user: null,
    courseProgress: {},
    achievements: [],
    examAttempts: [],
    certifications: [],
    handbookProgress: [],
    settings: {
      sidebarCollapsed: false
    }
  };

  let _state = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        _state = Object.assign({}, DEFAULT_STATE, parsed);
      } else {
        _state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      }
    } catch(e) {
      console.warn('DF LMS: storage parse error, resetting', e);
      _state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    return _state;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(_state));
    } catch(e) {
      console.warn('DF LMS: storage save error', e);
    }
  }

  function getState() {
    if (!_state) load();
    return _state;
  }

  // ── USER ──────────────────────────────────────────────────────────────────
  function getUser() {
    return getState().user;
  }

  function setUser(userData) {
    _state.user = Object.assign({}, _state.user || {}, userData);
    save();
  }

  function addXP(amount) {
    if (!_state.user) return { newXP: 0, leveledUp: false, newLevel: 1 };
    const oldXP = _state.user.xp || 0;
    const newXP = oldXP + amount;
    const oldLevel = getLevelForXP(oldXP);
    const newLevel = getLevelForXP(newXP);
    _state.user.xp = newXP;
    save();
    return {
      newXP,
      leveledUp: newLevel.level > oldLevel.level,
      newLevel
    };
  }

  function getLevelForXP(xp) {
    const levels = window.DF_DATA.LEVELS;
    let current = levels[0];
    for (let i = 0; i < levels.length; i++) {
      if (xp >= levels[i].minXP) current = levels[i];
      else break;
    }
    return current;
  }

  // ── COURSE PROGRESS ───────────────────────────────────────────────────────
  function getCourseProgress(courseId) {
    return getState().courseProgress[courseId] || null;
  }

  function updateCourseProgress(courseId, updates) {
    if (!_state.courseProgress[courseId]) {
      _state.courseProgress[courseId] = {
        started: false,
        startedAt: null,
        completedAt: null,
        lessonsCompleted: [],
        quizScores: {}
      };
    }
    Object.assign(_state.courseProgress[courseId], updates);
    save();
  }

  function markLessonComplete(courseId, lessonId, xpToAward) {
    const cp = _state.courseProgress[courseId] || {
      started: true,
      startedAt: new Date().toISOString(),
      completedAt: null,
      lessonsCompleted: [],
      quizScores: {}
    };
    if (!cp.lessonsCompleted.includes(lessonId)) {
      cp.lessonsCompleted.push(lessonId);
    }
    cp.started = true;
    if (!cp.startedAt) cp.startedAt = new Date().toISOString();
    _state.courseProgress[courseId] = cp;
    save();
    if (xpToAward) return addXP(xpToAward);
    return null;
  }

  function isCourseComplete(courseId) {
    const course = window.DF_DATA.COURSES[courseId];
    if (!course) return false;
    const cp = getCourseProgress(courseId);
    if (!cp) return false;
    const allLessons = [];
    course.modules.forEach(m => m.lessons.forEach(l => allLessons.push(l.id)));
    return allLessons.every(lid => cp.lessonsCompleted && cp.lessonsCompleted.includes(lid));
  }

  function checkAndMarkCourseComplete(courseId) {
    if (isCourseComplete(courseId)) {
      const cp = _state.courseProgress[courseId];
      if (!cp.completedAt) {
        cp.completedAt = new Date().toISOString();
        save();
        return true;
      }
    }
    return false;
  }

  // ── ACHIEVEMENTS ──────────────────────────────────────────────────────────
  function getAchievements() {
    return getState().achievements || [];
  }

  function hasAchievement(id) {
    return getAchievements().includes(id);
  }

  function awardAchievement(id) {
    if (hasAchievement(id)) return false;
    const def = window.DF_DATA.ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return false;
    _state.achievements.push(id);
    save();
    if (def.xp > 0) addXP(def.xp);
    return true;
  }

  // ── EXAM ATTEMPTS ─────────────────────────────────────────────────────────
  function addExamAttempt(attempt) {
    _state.examAttempts.push({
      ...attempt,
      date: new Date().toISOString()
    });
    save();
  }

  function getExamAttempts(pathId) {
    const attempts = getState().examAttempts || [];
    if (pathId) return attempts.filter(a => a.pathId === pathId);
    return attempts;
  }

  function getBestScore(pathId) {
    const attempts = getExamAttempts(pathId);
    if (!attempts.length) return null;
    return Math.max(...attempts.map(a => a.score));
  }

  // ── CERTIFICATIONS ────────────────────────────────────────────────────────
  function addCertification(cert) {
    const existing = _state.certifications.find(c => c.id === cert.id);
    if (existing) return false;
    _state.certifications.push({
      ...cert,
      earnedAt: new Date().toISOString(),
      number: generateCertNumber()
    });
    save();
    return true;
  }

  function getCertifications() {
    return getState().certifications || [];
  }

  function hasCertification(id) {
    return getCertifications().some(c => c.id === id);
  }

  function generateCertNumber() {
    const year = new Date().getFullYear();
    const seq = String((_state.certifications.length || 0) + 1).padStart(4, '0');
    return `DF-${year}-${seq}`;
  }

  // ── HANDBOOK ──────────────────────────────────────────────────────────────
  function markHandbookRead(sectionId) {
    if (!_state.handbookProgress.includes(sectionId)) {
      _state.handbookProgress.push(sectionId);
      save();
    }
  }

  function getHandbookProgress() {
    return getState().handbookProgress || [];
  }

  // ── STATS HELPERS ─────────────────────────────────────────────────────────
  function getStats() {
    const state = getState();
    const courses = window.DF_DATA.COURSES;
    let coursesCompleted = 0;
    let totalLessonsCompleted = 0;

    Object.entries(state.courseProgress || {}).forEach(([id, cp]) => {
      if (cp.completedAt) coursesCompleted++;
      totalLessonsCompleted += (cp.lessonsCompleted || []).length;
    });

    const examAttempts = state.examAttempts || [];
    const avgScore = examAttempts.length
      ? Math.round(examAttempts.reduce((s, a) => s + a.score, 0) / examAttempts.length)
      : 0;

    const hoursLearned = Math.round(totalLessonsCompleted * 0.28);

    return {
      coursesCompleted,
      totalLessonsCompleted,
      hoursLearned,
      avgScore,
      certifications: (state.certifications || []).length,
      achievements: (state.achievements || []).length,
      examAttempts: examAttempts.length
    };
  }

  // ── RESET ─────────────────────────────────────────────────────────────────
  function reset() {
    _state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    save();
  }

  // ── INIT ──────────────────────────────────────────────────────────────────
  load();

  return {
    load,
    save,
    getState,
    getUser,
    setUser,
    addXP,
    getLevelForXP,
    getCourseProgress,
    updateCourseProgress,
    markLessonComplete,
    isCourseComplete,
    checkAndMarkCourseComplete,
    getAchievements,
    hasAchievement,
    awardAchievement,
    addExamAttempt,
    getExamAttempts,
    getBestScore,
    addCertification,
    getCertifications,
    hasCertification,
    markHandbookRead,
    getHandbookProgress,
    getStats,
    reset
  };

})();
