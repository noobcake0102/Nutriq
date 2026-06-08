/* ── DEFENSE FLOORING LMS — MAIN APPLICATION ────────────────────────────── */
(function(DATA, Store) {
  'use strict';

  // ── STATE ─────────────────────────────────────────────────────────────────
  let currentView  = 'dashboard';
  let currentParams = {};
  let examState    = null;
  let examTimer    = null;
  let toastQueue   = [];

  // ── PHOTOS ────────────────────────────────────────────────────────────────
  // All paths relative to index.html at LMS root
  const PHOTOS = {
    teamTrailer:   { src: 'assets/photos/2S5A8497.jpg',  caption: 'The Defense Flooring Team' },
    crewWarehouse: { src: 'assets/photos/2S5A8434.jpg',  caption: 'Field Crew — Hampton Roads, VA' },
    headshot1:     { src: 'assets/photos/2S5A8329.jpg',  caption: 'Defense Flooring Leadership' },
    headshot2:     { src: 'assets/photos/2S5A8345.jpg',  caption: 'Defense Flooring Crew' },
    teamWide:      { src: 'assets/photos/2S5A8490.jpg',  caption: 'Bold Flooring. Bold People.' },
    flakeAction:   { src: 'assets/photos/2S5A9131.jpg',  caption: 'Full Broadcast — Flake Application' },
    flakeGlove:    { src: 'assets/photos/2S5A9100.jpg',  caption: 'Quartz Broadcast — Close Up' },
    epoxyRoller:   { src: 'assets/photos/2S5A8863.jpg',  caption: 'Epoxy Primer Application' },
    mixingCrew:    { src: 'assets/photos/2S5A8746.jpg',  caption: 'Crew Mixing Resinous Coating' },
    mixingDrill:   { src: 'assets/photos/2S5A8720.jpg',  caption: 'Specialty Chemical Corp — Transfer Mix' },
    floorSand:     { src: 'assets/photos/2S5A9192.jpg',  caption: 'Quartz Broadcast — Finished Surface' },
    floorBlue:     { src: 'assets/photos/2S5A9206.jpg',  caption: 'Full Broadcast Flake — Finished Floor' },
    floorTan:      { src: 'assets/photos/2S5A9218.jpg',  caption: 'Decorative Flake — Finished Floor' },
    trailerLoad:   { src: 'assets/photos/2S5A8566.jpg',  caption: 'DF Mobile Unit — Equipment Ready' },
    trailerExtra:  { src: 'assets/photos/2S5A8552.jpg',  caption: 'Defense Flooring Operations' }
  };

  // Lesson ID → photo key(s) to inject above key-takeaways
  const LESSON_PHOTOS = {
    'm1-l1': ['headshot1', 'crewWarehouse'],       // Company overview: Mission/Values
    'm1-l2': ['teamWide'],                          // Company overview: Markets
    'm2-l1': ['teamTrailer'],                       // Company overview: DF Standard
    // Resinous Mastery
    'm1-l1-concrete': ['floorSand'],                // Concrete fundamentals (keyed by course context)
    'm1-l2-concrete': ['floorBlue'],
    'm2-l1-prep': ['flakeGlove', 'epoxyRoller'],    // Surface prep
    'm2-l2-prep': ['flakeAction'],
    'm3-l1-bond': ['mixingDrill'],                  // Bond mechanisms
    'm4-l1-coat': ['mixingCrew'],                   // Coating foundations
    'm5-l1-systems': ['floorTan', 'floorBlue'],     // Coating systems
    'm6-l1-mix': ['mixingDrill', 'mixingCrew'],     // Mixing
    'm7-l1-app': ['epoxyRoller', 'flakeAction'],    // Application techniques
    'm8-l1-mvb': ['floorSand'],                     // Moisture
    'm9-l1-slc': ['epoxyRoller'],                   // SLC
    'm12-l1-safety': ['mixingCrew'],                // Safety
    'm13-l1-qc': ['flakeGlove']                     // QC
  };

  // ── SVG ICONS ─────────────────────────────────────────────────────────────
  const ICONS = {
    home:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M7 18v-5h6v5"/></svg>`,
    book:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3h9a2 2 0 012 2v11a2 2 0 01-2 2H4a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M15 14h1a1 1 0 001-1V5"/><path d="M7 7h5M7 10h5M7 13h3"/></svg>`,
    path:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="5" r="2"/><circle cx="15" cy="10" r="2"/><circle cx="5" cy="15" r="2"/><path d="M7 5h4a2 2 0 012 2v1M13 12v1a2 2 0 01-2 2H7"/></svg>`,
    exam:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="2" width="14" height="16" rx="2"/><path d="M7 7h6M7 10h6M7 13h4"/><circle cx="14" cy="13" r="2.5" fill="none"/><path d="M16 15l1.5 1.5"/></svg>`,
    trophy: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13c-3.3 0-6-2.7-6-6V4h12v3c0 3.3-2.7 6-6 6z"/><path d="M4 4H2v2a3 3 0 003 3M16 4h2v2a3 3 0 01-3 3M10 13v4M7 17h6"/></svg>`,
    chart:  `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17V7l4-3 4 3 4-3v13"/><path d="M3 17h14"/><path d="M7 17V9M11 17V7M15 17v-5"/></svg>`,
    handbook:`<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"/><path d="M8 6h4M8 9h4M8 12h2"/></svg>`,
    star:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2l2.4 5 5.6.8-4 3.9.9 5.5L10 14.5l-4.9 2.7.9-5.5L2 7.8l5.6-.8z"/></svg>`,
    user:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="6" r="3"/><path d="M3 18c0-3.9 3.1-7 7-7s7 3.1 7 7"/></svg>`,
    check:  `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10l5 5L16 6"/></svg>`,
    lock:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6a3 3 0 016 0v3"/></svg>`,
    play:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="8"/><path d="M8 7l5 3-5 3V7z" fill="currentColor" stroke="none"/></svg>`,
    clock:  `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="8"/><path d="M10 5v5l3 3"/></svg>`,
    bolt:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2L4 11h6l-1 7 7-9h-6l1-7z"/></svg>`,
    shield: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2l7 3v5c0 4-3 7-7 8C6 17 3 14 3 10V5l7-3z"/></svg>`,
    medal:  `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="13" r="5"/><path d="M7 8l-3-6h12l-3 6"/><path d="M10 10v6"/></svg>`,
    grid:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="7" height="7" rx="1"/><rect x="11" y="2" width="7" height="7" rx="1"/><rect x="2" y="11" width="7" height="7" rx="1"/><rect x="11" y="11" width="7" height="7" rx="1"/></svg>`,
    fire:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c0 4-4 5-4 9a4 4 0 008 0c0-2-1-3-2-4 0 2-1 3-2 4-1-3 0-5 0-9z"/></svg>`,
    target: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="8"/><circle cx="10" cy="10" r="4"/><circle cx="10" cy="10" r="1" fill="currentColor"/></svg>`,
    cert:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="9" rx="2"/><circle cx="16" cy="14" r="3"/><path d="M14.5 17l1.5 2 1.5-2"/><path d="M5 7h6M5 10h4"/></svg>`,
    level:  `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2l8 16H2z"/><path d="M10 10v4"/></svg>`,
    arrowR: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12M12 6l4 4-4 4"/></svg>`,
    arrowL: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 10H4M8 14l-4-4 4-4"/></svg>`,
    print:  `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7V3h10v4M5 15H3a1 1 0 01-1-1V9a1 1 0 011-1h14a1 1 0 011 1v5a1 1 0 01-1 1h-2"/><rect x="5" y="12" width="10" height="6" rx="1"/></svg>`,
    dl:     `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3v10M6 10l4 4 4-4M3 17h14"/></svg>`,
    refresh:`<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10a7 7 0 01-7 7A7 7 0 013 10a7 7 0 017-7 7 7 0 015 2.1"/><path d="M17 3v4h-4"/></svg>`,
    xmark:  `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>`,
    info:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="8"/><path d="M10 9v6M10 7v.01"/></svg>`,
    df: `<svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h8c5 0 8 3.1 8 8s-3 8-8 8H4V4z" fill="#0a0a0a"/><path d="M4 4h7c4.4 0 7 2.8 7 7s-2.6 7-7 7H4V4z" stroke="#0a0a0a" stroke-width="0.5"/><text x="5" y="17" font-family="Barlow Condensed,sans-serif" font-weight="900" font-size="12" fill="#c8a84b">DF</text></svg>`
  };

  // ── UTILS ─────────────────────────────────────────────────────────────────
  const Utils = {
    progressRing(pct, size = 80, color = '#c8a84b', trackColor = 'rgba(255,255,255,0.06)', showText = true) {
      const r = (size / 2) - 7;
      const circ = 2 * Math.PI * r;
      const fill = circ * (Math.min(pct, 100) / 100);
      const cx = size / 2, cy = size / 2;
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${trackColor}" stroke-width="6"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="6"
          stroke-dasharray="${fill} ${circ - fill}"
          stroke-linecap="round"
          transform="rotate(-90 ${cx} ${cy})"/>
        ${showText ? `<text x="${cx}" y="${cy + 5}" text-anchor="middle"
          fill="${color}" font-family="Barlow Condensed,sans-serif"
          font-weight="700" font-size="${Math.round(size * 0.2)}">${pct}%</text>` : ''}
      </svg>`;
    },

    barChart(data, width = 320, height = 140) {
      if (!data || !data.length) return `<svg width="${width}" height="${height}"><text x="${width/2}" y="${height/2}" text-anchor="middle" fill="#555" font-size="12">No data</text></svg>`;
      const max = Math.max(...data.map(d => d.value), 1);
      const barW = Math.floor((width - (data.length + 1) * 8) / data.length);
      const chartH = height - 36;
      let bars = '';
      data.forEach((d, i) => {
        const barH = Math.max(2, Math.round((d.value / max) * chartH));
        const x = 8 + i * (barW + 8);
        const y = chartH - barH + 4;
        const color = d.color || '#c8a84b';
        bars += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="2" fill="${color}" opacity="0.85"/>`;
        bars += `<text x="${x + barW/2}" y="${height - 6}" text-anchor="middle" fill="#666" font-family="Inter,sans-serif" font-size="9">${d.label || ''}</text>`;
        if (d.value > 0) bars += `<text x="${x + barW/2}" y="${y - 3}" text-anchor="middle" fill="${color}" font-family="Barlow Condensed,sans-serif" font-weight="700" font-size="10">${d.value}</text>`;
      });
      return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="transparent"/>
        <line x1="0" y1="${chartH + 4}" x2="${width}" y2="${chartH + 4}" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
        ${bars}
      </svg>`;
    },

    lineChart(data, width = 320, height = 100) {
      if (!data || data.length < 2) return `<svg width="${width}" height="${height}"><text x="${width/2}" y="${height/2}" text-anchor="middle" fill="#555" font-size="12">No data yet</text></svg>`;
      const max = Math.max(...data.map(d => d.value), 1);
      const padH = 16, padV = 10;
      const chartW = width - padH * 2;
      const chartH = height - padV * 2;
      const step = chartW / (data.length - 1);
      const pts = data.map((d, i) => {
        const x = padH + i * step;
        const y = padV + chartH - (d.value / max) * chartH;
        return `${x},${y}`;
      }).join(' ');
      const areaClose = `${padH + (data.length - 1) * step},${padV + chartH} ${padH},${padV + chartH}`;
      return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#c8a84b" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#c8a84b" stop-opacity="0"/>
        </linearGradient></defs>
        <polygon points="${pts} ${areaClose}" fill="url(#lg)"/>
        <polyline points="${pts}" fill="none" stroke="#c8a84b" stroke-width="2" stroke-linejoin="round"/>
        ${data.map((d, i) => {
          const x = padH + i * step;
          const y = padV + chartH - (d.value / max) * chartH;
          return `<circle cx="${x}" cy="${y}" r="3" fill="#c8a84b"/>`;
        }).join('')}
      </svg>`;
    },

    formatDate(iso) {
      if (!iso) return '—';
      try {
        return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch(e) { return iso; }
    },

    initials(name) {
      if (!name) return 'DF';
      return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    },

    courseStatus(courseId) {
      const cp = Store.getCourseProgress(courseId);
      if (!cp || !cp.started) return 'not-started';
      if (cp.completedAt) return 'completed';
      return 'in-progress';
    },

    coursePct(courseId) {
      const course = DATA.COURSES[courseId];
      if (!course) return 0;
      const cp = Store.getCourseProgress(courseId);
      if (!cp) return 0;
      const allLessons = [];
      course.modules.forEach(m => m.lessons.forEach(l => allLessons.push(l.id)));
      if (!allLessons.length) return 0;
      const done = (cp.lessonsCompleted || []).filter(id => allLessons.includes(id)).length;
      return Math.round((done / allLessons.length) * 100);
    },

    pathPct(pathId) {
      const path = DATA.LEARNING_PATHS.find(p => p.id === pathId);
      if (!path || !path.courses.length) return 0;
      let total = 0, done = 0;
      path.courses.forEach(cid => {
        const course = DATA.COURSES[cid];
        if (!course) return;
        course.modules.forEach(m => m.lessons.forEach(l => {
          total++;
          const cp = Store.getCourseProgress(cid);
          if (cp && cp.lessonsCompleted && cp.lessonsCompleted.includes(l.id)) done++;
        }));
      });
      return total ? Math.round((done / total) * 100) : 0;
    }
  };

  // ── NAVIGATION ────────────────────────────────────────────────────────────
  const NAV_ITEMS = [
    { id: 'dashboard',  label: 'Dashboard',     icon: 'home' },
    { id: 'paths',      label: 'Learning Paths', icon: 'path' },
    { id: 'courses',    label: 'My Courses',     icon: 'book' },
    { id: 'exam',       label: 'Exam Center',    icon: 'exam' },
    { id: 'certs',      label: 'Certifications', icon: 'trophy' },
    { id: 'handbook',   label: 'Handbook',       icon: 'handbook' },
    { id: 'analytics',  label: 'Analytics',      icon: 'chart' }
  ];

  // ── NAVIGATE ──────────────────────────────────────────────────────────────
  function navigate(view, params = {}) {
    currentView = view;
    currentParams = params;
    renderTopbar();
    renderNav();
    const container = document.getElementById('view-container');
    if (!container) return;
    container.innerHTML = '';
    container.scrollTop = 0;

    const views = {
      dashboard:    renderDashboard,
      paths:        renderPaths,
      courses:      renderCourses,
      course:       () => renderCoursePlayer(params.courseId, params.moduleIdx || 0, params.lessonIdx || 0),
      exam:         renderExamStart,
      'exam-active': renderExamActive,
      certs:        renderCertifications,
      handbook:     renderHandbook,
      analytics:    renderAnalytics
    };

    const fn = views[view];
    if (fn) fn();
  }

  // ── APP SHELL ─────────────────────────────────────────────────────────────
  function renderShell() {
    const user = Store.getUser();
    const level = Store.getLevelForXP(user ? user.xp || 0 : 0);
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="app-layout">
        <nav class="sidebar" id="sidebar">
          <div class="sidebar-logo">
            <div class="logo-wordmark">
              <div class="logo-icon">${ICONS.df}</div>
              <div>
                <div>Defense Flooring</div>
                <div class="logo-sub">Learning Portal</div>
              </div>
            </div>
          </div>
          <div class="sidebar-nav" id="sidebar-nav"></div>
          <div class="sidebar-user">
            <div class="sidebar-user-inner" onclick="navigate('analytics')">
              <div class="user-avatar">${Utils.initials(user ? user.name : 'DF')}</div>
              <div class="user-meta">
                <div class="user-name">${user ? user.name : 'Crew Member'}</div>
                <div class="user-role">${user ? user.role : ''}</div>
              </div>
              <div class="user-xp-label">${level.title}</div>
            </div>
          </div>
        </nav>
        <div class="content-area">
          <header class="topbar" id="topbar"></header>
          <main class="view-container fade-in" id="view-container"></main>
        </div>
      </div>
      <div class="toast-container" id="toast-container"></div>
    `;
    renderNav();
    renderTopbar();
  }

  function renderNav() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;
    const certs = Store.getCertifications();
    nav.innerHTML = `
      <div class="nav-section-label">Main</div>
      ${NAV_ITEMS.slice(0,5).map(item => `
        <div class="nav-item ${currentView === item.id ? 'active' : ''}" onclick="navigate('${item.id}')">
          ${ICONS[item.icon]}
          <span>${item.label}</span>
          ${item.id === 'certs' && certs.length ? `<span class="nav-badge">${certs.length}</span>` : ''}
        </div>
      `).join('')}
      <div class="nav-section-label">Resources</div>
      ${NAV_ITEMS.slice(5).map(item => `
        <div class="nav-item ${currentView === item.id ? 'active' : ''}" onclick="navigate('${item.id}')">
          ${ICONS[item.icon]}
          <span>${item.label}</span>
        </div>
      `).join('')}
    `;
  }

  function renderTopbar() {
    const topbar = document.getElementById('topbar');
    if (!topbar) return;
    const user = Store.getUser();
    const xp = user ? (user.xp || 0) : 0;
    const level = Store.getLevelForXP(xp);
    const nextLevel = DATA.LEVELS.find(l => l.level === level.level + 1);
    const xpInLevel = xp - level.minXP;
    const xpNeeded = nextLevel ? (nextLevel.minXP - level.minXP) : 1;
    const xpPct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

    const titles = { dashboard:'Dashboard', paths:'Learning Paths', courses:'My Courses', exam:'Exam Center', 'exam-active':'Certification Exam', certs:'Certifications', handbook:'Employee Handbook', analytics:'Analytics', course:'Course' };
    topbar.innerHTML = `
      <div class="topbar-title">${titles[currentView] || currentView}</div>
      <div class="topbar-right">
        <div class="xp-display">
          ${ICONS.bolt.replace('currentColor','#c8a84b')}
          <span class="xp-val">${xp.toLocaleString()}</span>
          <span class="xp-label">XP</span>
        </div>
        <div class="level-badge">Lvl ${level.level} · ${level.title}</div>
      </div>
    `;
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  function renderDashboard() {
    const user = Store.getUser();
    const stats = Store.getStats();
    const xp = user ? (user.xp || 0) : 0;
    const level = Store.getLevelForXP(xp);
    const nextLevel = DATA.LEVELS.find(l => l.level === level.level + 1);
    const xpInLevel = xp - level.minXP;
    const xpNeeded = nextLevel ? (nextLevel.minXP - level.minXP) : xp;
    const xpPct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

    // Active courses
    const activeCourses = Object.keys(DATA.COURSES).filter(id => {
      const cp = Store.getCourseProgress(id);
      return cp && cp.started && !cp.completedAt;
    }).slice(0, 4);

    const completedCourses = Object.keys(DATA.COURSES).filter(id => {
      const cp = Store.getCourseProgress(id);
      return cp && cp.completedAt;
    });

    // Path progress rings
    const availPaths = DATA.LEARNING_PATHS.filter(p => p.available);

    // Recent achievements
    const earnedIds = Store.getAchievements();
    const recentAchievements = earnedIds.slice(-4).reverse().map(id =>
      DATA.ACHIEVEMENTS.find(a => a.id === id)
    ).filter(Boolean);

    // Recommended next
    const notStarted = Object.keys(DATA.COURSES).filter(id => !Store.getCourseProgress(id));

    const container = document.getElementById('view-container');
    container.innerHTML = `
      <!-- WELCOME -->
      <div class="welcome-card fade-up" style="position:relative;overflow:hidden">
        <div style="position:absolute;right:0;top:0;bottom:0;width:220px;overflow:hidden;border-radius:0 var(--radius) var(--radius) 0">
          <img src="${PHOTOS.teamTrailer.src}" alt="Defense Flooring Team"
            style="width:100%;height:100%;object-fit:cover;object-position:center 20%;opacity:0.25">
        </div>
        <div>
          ${Utils.progressRing(xpPct, 76, '#c8a84b')}
        </div>
        <div class="welcome-text" style="flex:1;position:relative;z-index:1">
          <h2>Welcome back, ${user ? user.name.split(' ')[0] : 'Crew Member'}</h2>
          <p>${user ? user.role : ''} · ${level.title} · ${xp.toLocaleString()} XP earned</p>
          <div class="xp-bar-wrap">
            <div class="xp-bar-track"><div class="xp-bar-fill" style="width:${xpPct}%"></div></div>
            <div class="xp-bar-labels">
              <span>${xpInLevel.toLocaleString()} / ${xpNeeded.toLocaleString()} XP to Level ${level.level + 1}</span>
              <span>${nextLevel ? nextLevel.title : 'Max Level'}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;position:relative;z-index:1">
          <button class="btn btn-gold btn-sm" onclick="navigate('paths')">${ICONS.arrowR} Explore Paths</button>
          <button class="btn btn-outline btn-sm" onclick="navigate('exam')">${ICONS.exam} Take Exam</button>
        </div>
      </div>

      <!-- STATS -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon gold">${ICONS.book.replace('currentColor','#c8a84b')}</div>
          <div class="stat-body">
            <div class="stat-val">${stats.coursesCompleted}</div>
            <div class="stat-label">Courses Completed</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">${ICONS.clock.replace('currentColor','#4caf7d')}</div>
          <div class="stat-body">
            <div class="stat-val">${stats.hoursLearned}</div>
            <div class="stat-label">Hours Learned</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">${ICONS.chart.replace('currentColor','#5b9cf6')}</div>
          <div class="stat-body">
            <div class="stat-val">${stats.avgScore ? stats.avgScore + '%' : '—'}</div>
            <div class="stat-label">Exam Average</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon gold">${ICONS.trophy.replace('currentColor','#c8a84b')}</div>
          <div class="stat-body">
            <div class="stat-val">${stats.certifications}</div>
            <div class="stat-label">Certifications</div>
          </div>
        </div>
      </div>

      <!-- PHOTO STRIP -->
      ${renderPhotoStrip()}

      <!-- LEARNING PATH PROGRESS -->
      <div class="section-head"><h2>Learning Path Progress</h2><span class="card-action" onclick="navigate('paths')">View all →</span></div>
      <div class="progress-rings-row">
        ${availPaths.map(path => {
          const pct = Utils.pathPct(path.id);
          return `<div class="progress-ring-item" onclick="navigate('paths')">
            ${Utils.progressRing(pct, 72, path.color || '#c8a84b')}
            <span class="ring-label">${path.title.split(' ').slice(0,2).join(' ')}</span>
            <span class="ring-sublabel">${path.courses.length} courses</span>
          </div>`;
        }).join('')}
      </div>

      <div class="grid-2">
        <!-- ACTIVE COURSES -->
        <div>
          <div class="section-head"><h2>In Progress</h2><span class="card-action" onclick="navigate('courses')">See all →</span></div>
          ${activeCourses.length ? activeCourses.map(id => {
            const course = DATA.COURSES[id];
            const pct = Utils.coursePct(id);
            const path = DATA.LEARNING_PATHS.find(p => p.id === course.pathId);
            return `<div class="card" style="margin-bottom:10px;cursor:pointer" onclick="navigate('course',{courseId:'${id}'})">
              <div style="font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--text-muted);margin-bottom:5px">${path ? path.title : course.pathId}</div>
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;text-transform:uppercase;color:var(--text);margin-bottom:10px">${course.title}</div>
              <div class="course-progress-bar"><div class="course-progress-fill" style="width:${pct}%"></div></div>
              <div style="display:flex;justify-content:space-between;margin-top:5px;font-size:10px;color:var(--text-muted)">
                <span>${pct}% complete</span>
                <span>${ICONS.arrowR.replace('width="20"','width="13"')} Continue</span>
              </div>
            </div>`;
          }).join('') : `<div class="card"><div class="empty-state" style="padding:20px"><p>No courses in progress. <span class="card-action" onclick="navigate('paths')">Start a learning path →</span></p></div></div>`}
        </div>

        <!-- ACHIEVEMENTS -->
        <div>
          <div class="section-head"><h2>Recent Achievements</h2><span class="card-action" onclick="navigate('analytics')">View all →</span></div>
          <div class="card">
            ${recentAchievements.length ? recentAchievements.map(a => achievementItem(a, true)).join('') : `<div class="empty-state" style="padding:20px"><p>Complete lessons to earn achievements</p></div>`}
            ${recentAchievements.length < DATA.ACHIEVEMENTS.length ? `<div style="margin-top:10px;font-size:11px;color:var(--text-muted);text-align:center">${DATA.ACHIEVEMENTS.length - earnedIds.length} achievements remaining</div>` : ''}
          </div>
        </div>
      </div>

      <!-- RECOMMENDED -->
      ${notStarted.length ? `
        <div class="section-head mt-24"><h2>Recommended Next</h2></div>
        <div class="grid-auto">
          ${notStarted.slice(0,3).map(id => renderCourseCard(id)).join('')}
        </div>
      ` : ''}
    `;
  }

  function renderPhotoStrip() {
    return `
      <div class="photo-strip">
        <div class="section-head"><h2>Defense Flooring in the Field</h2><span class="card-action" onclick="navigate('courses',{pathId:'resinous-mastery'})">Start Learning →</span></div>
        <div class="photo-grid">
          <div class="photo-tile" onclick="navigate('courses',{pathId:'new-employee'})">
            <img src="${PHOTOS.teamTrailer.src}" alt="${PHOTOS.teamTrailer.caption}" loading="lazy">
            <div class="photo-overlay"></div>
            <div class="photo-caption">${PHOTOS.teamTrailer.caption}</div>
          </div>
          <div class="photo-tile" onclick="navigate('course',{courseId:'concrete-fundamentals'})">
            <img src="${PHOTOS.flakeAction.src}" alt="${PHOTOS.flakeAction.caption}" loading="lazy">
            <div class="photo-overlay"></div>
            <div class="photo-caption">${PHOTOS.flakeAction.caption}</div>
          </div>
          <div class="photo-tile" onclick="navigate('course',{courseId:'concrete-fundamentals'})">
            <img src="${PHOTOS.floorBlue.src}" alt="${PHOTOS.floorBlue.caption}" loading="lazy">
            <div class="photo-overlay"></div>
            <div class="photo-caption">${PHOTOS.floorBlue.caption}</div>
          </div>
        </div>
        <div class="photo-grid-2" style="margin-top:10px">
          <div class="photo-tile" onclick="navigate('course',{courseId:'coating-systems-application'})">
            <img src="${PHOTOS.epoxyRoller.src}" alt="${PHOTOS.epoxyRoller.caption}" loading="lazy">
            <div class="photo-overlay"></div>
            <div class="photo-caption">${PHOTOS.epoxyRoller.caption}</div>
          </div>
          <div class="photo-tile" onclick="navigate('course',{courseId:'coating-systems-application'})">
            <img src="${PHOTOS.mixingCrew.src}" alt="${PHOTOS.mixingCrew.caption}" loading="lazy">
            <div class="photo-overlay"></div>
            <div class="photo-caption">${PHOTOS.mixingCrew.caption}</div>
          </div>
          <div class="photo-tile" onclick="navigate('course',{courseId:'moisture-specialty'})">
            <img src="${PHOTOS.floorTan.src}" alt="${PHOTOS.floorTan.caption}" loading="lazy">
            <div class="photo-overlay"></div>
            <div class="photo-caption">${PHOTOS.floorTan.caption}</div>
          </div>
          <div class="photo-tile" onclick="navigate('courses')">
            <img src="${PHOTOS.crewWarehouse.src}" alt="${PHOTOS.crewWarehouse.caption}" loading="lazy">
            <div class="photo-overlay"></div>
            <div class="photo-caption">${PHOTOS.crewWarehouse.caption}</div>
          </div>
        </div>
      </div>
    `;
  }

  function achievementItem(a, earned) {
    return `<div class="achievement-item ${earned ? '' : 'locked'}">
      <div class="achievement-badge">${achievementBadgeSVG(a.icon, earned)}</div>
      <div class="achievement-meta">
        <div class="achievement-name">${a.name}</div>
        <div class="achievement-desc">${a.desc}</div>
      </div>
      ${earned ? `<div class="achievement-xp">+${a.xp} XP</div>` : `<div class="achievement-xp" style="color:var(--text-dim)">${a.xp} XP</div>`}
    </div>`;
  }

  function achievementBadgeSVG(icon, earned) {
    const c = earned ? '#c8a84b' : '#444';
    const bg = earned ? 'rgba(200,168,75,0.15)' : 'rgba(255,255,255,0.03)';
    const iconSvg = ICONS[icon] || ICONS.star;
    return `<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <polygon points="18,2 22,13 34,13 25,21 28,33 18,26 8,33 11,21 2,13 14,13" fill="${bg}" stroke="${c}" stroke-width="1.5"/>
      <g transform="translate(10,10) scale(0.44)" color="${c}">${iconSvg}</g>
    </svg>`;
  }

  // ── LEARNING PATHS ────────────────────────────────────────────────────────
  function renderPaths() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="page-header"><h1>Learning Paths</h1><p>Structured programs designed to take you from recruit to expert in every area of Defense Flooring's business.</p></div>
      <div class="grid-auto fade-up">
        ${DATA.LEARNING_PATHS.map(path => pathCard(path)).join('')}
      </div>
    `;
  }

  function pathCard(path) {
    const pct = Utils.pathPct(path.id);
    const colorBg = path.color ? `rgba(${hexToRgb(path.color)},0.1)` : 'rgba(200,168,75,0.1)';
    const available = path.available;
    return `<div class="path-card ${available ? '' : ''}" onclick="${available ? `navigate('courses',{pathId:'${path.id}'})` : ''}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between">
        <div class="path-card-icon" style="background:${colorBg}">
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="${path.color}" stroke-width="1.5">${getPathIcon(path.id)}</svg>
        </div>
        ${!available ? '<span class="path-coming-soon">Coming Soon</span>' : pct > 0 ? `<span class="chip gold">${pct}% done</span>` : ''}
      </div>
      <div>
        <div class="path-card-title">${path.title}</div>
        <div class="path-card-desc">${path.desc}</div>
      </div>
      ${available ? `
        <div class="course-progress-bar" style="margin-bottom:8px"><div class="course-progress-fill" style="width:${pct}%;background:${path.color}"></div></div>
      ` : ''}
      <div class="path-card-stats">
        <div class="path-stat"><div class="path-stat-val">${path.courses.length || '?'}</div><div class="path-stat-label">Courses</div></div>
        <div class="path-stat"><div class="path-stat-val">${path.totalLessons}</div><div class="path-stat-label">Lessons</div></div>
        <div class="path-stat"><div class="path-stat-val">${path.estimatedHours}</div><div class="path-stat-label">Duration</div></div>
        ${path.certId ? `<div class="path-stat"><div class="path-stat-val" style="color:var(--gold)">${ICONS.trophy.replace('width="20"','width="16"').replace('height="20"','height="16"')}</div><div class="path-stat-label">Cert Available</div></div>` : ''}
      </div>
    </div>`;
  }

  function getPathIcon(id) {
    const icons = {
      'new-employee': `<path d="M10 12a4 4 0 100-8 4 4 0 000 8zM3 18c0-3.3 3.1-6 7-6s7 2.7 7 6"/>`,
      'resinous-mastery': `<rect x="2" y="2" width="16" height="16" rx="2"/><path d="M6 6h8M6 10h8M6 14h5"/>`,
      'salesforce-training': `<circle cx="10" cy="10" r="8"/><path d="M10 6v4l3 3"/>`,
      'gov-contracting': `<path d="M3 17V8l7-5 7 5v9M8 17v-5h4v5"/>`,
      'estimating': `<path d="M4 4h12v12H4zM4 8h12M8 4v12"/>`,
      'safety-academy': `<path d="M10 2l7 3v5c0 4-3 7-7 8C6 17 3 14 3 10V5l7-3z"/>`
    };
    return icons[id] || icons['new-employee'];
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  }

  // ── MY COURSES ────────────────────────────────────────────────────────────
  function renderCourses() {
    const pathId = currentParams.pathId;
    const path = pathId ? DATA.LEARNING_PATHS.find(p => p.id === pathId) : null;
    const courseIds = path ? path.courses : Object.keys(DATA.COURSES);
    const container = document.getElementById('view-container');

    container.innerHTML = `
      <div class="page-header">
        <h1>${path ? path.title : 'All Courses'}</h1>
        <p>${path ? path.desc : 'All available courses across your learning paths.'}</p>
      </div>
      ${!path ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
          <button class="btn btn-outline btn-sm ${!currentParams.filter ? 'btn-gold' : ''}" onclick="navigate('courses')">All</button>
          <button class="btn btn-outline btn-sm ${currentParams.filter==='in-progress'?'btn-gold':''}" onclick="navigate('courses',{filter:'in-progress'})">In Progress</button>
          <button class="btn btn-outline btn-sm ${currentParams.filter==='completed'?'btn-gold':''}" onclick="navigate('courses',{filter:'completed'})">Completed</button>
        </div>
      ` : ''}
      <div class="grid-auto fade-up">
        ${courseIds
          .filter(id => {
            if (!currentParams.filter) return true;
            return Utils.courseStatus(id) === currentParams.filter;
          })
          .map(id => renderCourseCard(id))
          .join('') || `<div class="empty-state"><p>No courses match this filter.</p></div>`}
      </div>
    `;
  }

  function renderCourseCard(courseId) {
    const course = DATA.COURSES[courseId];
    if (!course) return '';
    const status = Utils.courseStatus(courseId);
    const pct = Utils.coursePct(courseId);
    const path = DATA.LEARNING_PATHS.find(p => p.id === course.pathId);
    const color = path ? path.color : '#c8a84b';
    const bgStyle = `background:linear-gradient(135deg,${color}22,${color}08)`;
    const totalLessons = course.modules.reduce((t, m) => t + m.lessons.length, 0);
    const statusLabels = { 'not-started': 'Not Started', 'in-progress': 'In Progress', 'completed': 'Completed' };
    return `<div class="course-card" onclick="navigate('course',{courseId:'${courseId}'})">
      <div class="course-card-banner" style="${bgStyle}">
        <svg width="48" height="48" viewBox="0 0 20 20" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.6">
          <rect x="3" y="2" width="14" height="16" rx="2"/><path d="M7 6h6M7 9h6M7 12h4"/>
        </svg>
      </div>
      <div class="course-card-body">
        <div class="course-card-path">${path ? path.title : course.pathId}</div>
        <div class="course-card-title">${course.title}</div>
        <div class="course-card-meta">
          <span class="course-meta-item">${ICONS.book.replace('width="20"','width="11"')} ${course.modules.length} modules</span>
          <span class="course-meta-item">${ICONS.clock.replace('width="20"','width="11"')} ${course.duration}</span>
          <span class="course-meta-item">${ICONS.play.replace('width="20"','width="11"')} ${totalLessons} lessons</span>
        </div>
        <div class="course-card-footer">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span class="status-tag ${status}">${statusLabels[status]}</span>
            ${status === 'not-started' ? `<span class="chip">Start →</span>` : `<span style="font-size:10px;color:var(--text-muted)">${pct}%</span>`}
          </div>
          <div class="course-progress-bar"><div class="course-progress-fill" style="width:${pct}%;background:${color}"></div></div>
        </div>
      </div>
    </div>`;
  }

  // ── COURSE PLAYER ─────────────────────────────────────────────────────────
  function renderCoursePlayer(courseId, moduleIdx, lessonIdx) {
    const course = DATA.COURSES[courseId];
    if (!course) { navigate('courses'); return; }
    const container = document.getElementById('view-container');
    container.style.padding = '0';
    container.style.overflow = 'hidden';

    // Flatten all lessons for navigation
    const allLessons = [];
    course.modules.forEach((m, mi) => m.lessons.forEach((l, li) => allLessons.push({ m, mi, l, li })));
    const currentFlat = allLessons.findIndex(x => x.mi === moduleIdx && x.li === lessonIdx);
    const prev = currentFlat > 0 ? allLessons[currentFlat - 1] : null;
    const next = currentFlat < allLessons.length - 1 ? allLessons[currentFlat + 1] : null;
    const lesson = course.modules[moduleIdx] && course.modules[moduleIdx].lessons[lessonIdx];
    if (!lesson) { navigate('courses'); return; }

    const cp = Store.getCourseProgress(courseId);
    const completed = cp && cp.lessonsCompleted && cp.lessonsCompleted.includes(lesson.id);

    // Total progress
    const totalLessons = allLessons.length;
    const doneLessons = cp ? (cp.lessonsCompleted || []).filter(lid => allLessons.some(x => x.l.id === lid)).length : 0;
    const progressPct = Math.round((doneLessons / totalLessons) * 100);

    container.innerHTML = `
      <div class="course-player">
        <!-- Sidebar -->
        <div class="player-sidebar">
          <div class="player-sidebar-header">
            <button class="btn btn-ghost btn-sm" style="margin-bottom:8px;padding-left:0" onclick="navigate('courses')">
              ${ICONS.arrowL} Back to Courses
            </button>
            <div class="player-course-title">${course.title}</div>
            <div class="player-progress-text">${doneLessons} / ${totalLessons} lessons complete</div>
            <div class="player-progress-bar"><div class="player-progress-fill" style="width:${progressPct}%"></div></div>
          </div>
          <div class="player-modules">
            ${course.modules.map((m, mi) => `
              <div class="player-module">
                <div class="player-module-title">${m.title}</div>
                ${m.lessons.map((l, li) => {
                  const isActive = mi === moduleIdx && li === lessonIdx;
                  const isDone = cp && cp.lessonsCompleted && cp.lessonsCompleted.includes(l.id);
                  return `<div class="player-lesson ${isActive ? 'active' : ''} ${isDone && !isActive ? 'completed' : ''}"
                    onclick="navigate('course',{courseId:'${courseId}',moduleIdx:${mi},lessonIdx:${li}})">
                    <span class="lesson-icon">${isDone ? ICONS.check.replace('width="20"','width="16"') : ICONS.play.replace('width="20"','width="16"')}</span>
                    <span style="flex:1;line-height:1.3">${l.title}</span>
                    <span class="lesson-dur">${l.duration}</span>
                  </div>`;
                }).join('')}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Content -->
        <div class="player-content-area">
          <div class="player-content-body" id="lesson-content">
            <div class="player-lesson-title">${lesson.title}</div>
            ${lesson.objectives ? `
              <div class="lesson-objectives">
                <h4>Learning Objectives</h4>
                <ul>${lesson.objectives.map(o => `<li>${o}</li>`).join('')}</ul>
              </div>
            ` : ''}
            <div class="lesson-body">${lesson.content || ''}</div>
            ${renderLessonPhotos(courseId, lesson.id, moduleIdx, lessonIdx)}
            ${lesson.knowledgeCheck && lesson.knowledgeCheck.length ? renderKnowledgeCheck(lesson.knowledgeCheck, courseId, lesson.id) : ''}
            ${completed ? `
              <div style="margin-top:24px;padding:16px 20px;background:var(--green-dim);border:1px solid rgba(76,175,125,0.3);border-radius:var(--radius);display:flex;align-items:center;gap:12px">
                ${ICONS.check.replace('currentColor','#4caf7d')}
                <div>
                  <div style="font-size:12px;font-weight:700;color:var(--green)">Lesson Complete</div>
                  <div style="font-size:11px;color:var(--text-muted)">You've already completed this lesson. +25 XP earned.</div>
                </div>
              </div>
            ` : `
              <div style="margin-top:28px">
                <button class="btn btn-gold btn-full btn-lg" onclick="completeLesson('${courseId}','${lesson.id}',${moduleIdx},${lessonIdx})">
                  ${ICONS.check} Mark Lesson Complete · +25 XP
                </button>
              </div>
            `}
          </div>
          <div class="player-nav">
            ${prev ? `<button class="btn btn-outline" onclick="navigate('course',{courseId:'${courseId}',moduleIdx:${prev.mi},lessonIdx:${prev.li}})">${ICONS.arrowL} Previous</button>` : `<div></div>`}
            <span class="player-nav-center">${currentFlat + 1} of ${allLessons.length}</span>
            ${next ? `<button class="btn btn-gold" onclick="navigate('course',{courseId:'${courseId}',moduleIdx:${next.mi},lessonIdx:${next.li}})">Next ${ICONS.arrowR}</button>` : `<button class="btn btn-gold" onclick="navigate('courses')">Finish Course ${ICONS.check}</button>`}
          </div>
        </div>
      </div>
    `;
  }

  function completeLesson(courseId, lessonId, moduleIdx, lessonIdx) {
    const result = Store.markLessonComplete(courseId, lessonId, 25);
    showToast('Lesson Complete', '+25 XP earned', 'gold');

    // Check achievements
    const allDone = Object.values(Store.getState().courseProgress).reduce((sum, cp) => sum + (cp.lessonsCompleted||[]).length, 0);
    if (allDone >= 1 && Store.awardAchievement('first-lesson')) showAchievementToast('first-lesson');
    if (allDone >= 5 && Store.awardAchievement('five-lessons'))  showAchievementToast('five-lessons');
    if (allDone >= 10 && Store.awardAchievement('ten-lessons'))  showAchievementToast('ten-lessons');

    if (result && result.leveledUp) showToast('Level Up!', `You reached ${result.newLevel.title}!`, 'gold');

    // Check course complete
    if (Store.checkAndMarkCourseComplete(courseId)) {
      showToast('Course Complete!', `+150 XP — ${DATA.COURSES[courseId].title}`, 'green');
      const xpRes = Store.addXP(150);
      if (Store.awardAchievement('first-course')) showAchievementToast('first-course');
      if (xpRes.leveledUp) showToast('Level Up!', `You reached ${xpRes.newLevel.title}!`, 'gold');
    }

    renderTopbar();
    renderNav();

    // Navigate to next lesson if exists
    const course = DATA.COURSES[courseId];
    const allLessons = [];
    course.modules.forEach((m, mi) => m.lessons.forEach((l, li) => allLessons.push({m, mi, l, li})));
    const currentFlat = allLessons.findIndex(x => x.mi === moduleIdx && x.li === lessonIdx);
    if (currentFlat < allLessons.length - 1) {
      const next = allLessons[currentFlat + 1];
      setTimeout(() => navigate('course', { courseId, moduleIdx: next.mi, lessonIdx: next.li }), 600);
    } else {
      navigate('course', { courseId, moduleIdx, lessonIdx });
    }
  }

  // ── LESSON PHOTOS ─────────────────────────────────────────────────────────
  function renderLessonPhotos(courseId, lessonId, moduleIdx, lessonIdx) {
    // Map course+module+lesson to relevant photos
    const photoMap = {
      // company-overview
      'company-overview|m1|m1-l1': [PHOTOS.headshot1, PHOTOS.headshot2],
      'company-overview|m1|m1-l2': [PHOTOS.crewWarehouse],
      'company-overview|m2|m2-l1': [PHOTOS.teamTrailer, PHOTOS.trailerLoad],
      // concrete-fundamentals
      'concrete-fundamentals|m1|m1-l1': [PHOTOS.floorSand],
      'concrete-fundamentals|m1|m1-l2': [PHOTOS.floorBlue],
      'concrete-fundamentals|m2|m2-l1': [PHOTOS.flakeGlove],
      'concrete-fundamentals|m2|m2-l2': [PHOTOS.flakeAction],
      'concrete-fundamentals|m3|m3-l1': [PHOTOS.mixingDrill],
      // coating-systems-application
      'coating-systems-application|m4|m4-l1': [PHOTOS.mixingCrew, PHOTOS.mixingDrill],
      'coating-systems-application|m5|m5-l1': [PHOTOS.floorTan, PHOTOS.floorBlue],
      'coating-systems-application|m6|m6-l1': [PHOTOS.mixingDrill],
      'coating-systems-application|m7|m7-l1': [PHOTOS.epoxyRoller, PHOTOS.flakeAction],
      // moisture-specialty
      'moisture-specialty|m8|m8-l1': [PHOTOS.floorSand],
      'moisture-specialty|m9|m9-l1': [PHOTOS.epoxyRoller],
      // safety-qc
      'safety-qc|m12|m12-l1': [PHOTOS.mixingCrew],
      'safety-qc|m13|m13-l1': [PHOTOS.flakeGlove, PHOTOS.epoxyRoller]
    };
    const key = `${courseId}|m${moduleIdx + 1}|${lessonId}`;
    const photos = photoMap[key];
    if (!photos || !photos.length) return '';
    if (photos.length === 1) {
      return `<div class="lesson-photo">
        <img src="${photos[0].src}" alt="${photos[0].caption}" loading="lazy">
        <div class="lesson-photo-caption">${photos[0].caption}</div>
      </div>`;
    }
    return `<div class="photo-pair">
      ${photos.slice(0,2).map(p => `
        <div class="lesson-photo">
          <img src="${p.src}" alt="${p.caption}" loading="lazy">
          <div class="lesson-photo-caption">${p.caption}</div>
        </div>
      `).join('')}
    </div>`;
  }

  // ── KNOWLEDGE CHECK ───────────────────────────────────────────────────────
  function renderKnowledgeCheck(qIndices, courseId, lessonId) {
    const questions = qIndices.map(i => DATA.QUESTIONS[i]).filter(Boolean).slice(0, 3);
    if (!questions.length) return '';
    const kcId = `kc-${lessonId}`;
    return `
      <div class="knowledge-check" id="${kcId}">
        <div class="knowledge-check-header">
          ${ICONS.bolt.replace('currentColor','#c8a84b')}
          <h4>Knowledge Check</h4>
        </div>
        ${questions.map((q, qi) => `
          <div id="${kcId}-q${qi}" style="margin-bottom:18px">
            <div class="kc-question">${qi + 1}. ${q.q}</div>
            <div class="kc-options">
              ${q.opts.map((opt, oi) => `
                <div class="kc-option" id="${kcId}-q${qi}-o${oi}" onclick="selectKC('${kcId}',${qi},${oi},${q.a},'${escapeStr(q.exp)}')">
                  <div class="kc-letter">${'ABCD'[oi]}</div>
                  <div class="kc-text">${opt}</div>
                </div>
              `).join('')}
            </div>
            <div class="kc-explanation" id="${kcId}-q${qi}-exp"></div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function escapeStr(s) { return (s||'').replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

  window.selectKC = function(kcId, qi, oi, correctIdx, exp) {
    const opts = document.querySelectorAll(`#${kcId}-q${qi} .kc-option`);
    opts.forEach(el => el.classList.remove('selected','correct','wrong'));
    opts[oi].classList.add('selected');
    opts[oi].classList.add(oi === correctIdx ? 'correct' : 'wrong');
    if (oi !== correctIdx) opts[correctIdx].classList.add('correct');
    const expEl = document.getElementById(`${kcId}-q${qi}-exp`);
    if (expEl) { expEl.innerHTML = `<strong>Explanation:</strong> ${exp}`; expEl.style.display = 'block'; }
    if (oi === correctIdx && Store.awardAchievement('perfect-quiz')) showAchievementToast('perfect-quiz');
    if (Store.awardAchievement('first-quiz')) showAchievementToast('first-quiz');
  };

  window.completeLesson = completeLesson;
  window.navigate = navigate;

  // ── EXAM START ────────────────────────────────────────────────────────────
  function renderExamStart() {
    const attempts = Store.getExamAttempts('resinous-mastery');
    const bestScore = Store.getBestScore('resinous-mastery');
    const hasCert = Store.hasCertification('cert-resinous');
    const container = document.getElementById('view-container');

    container.innerHTML = `
      <div class="exam-start-screen fade-up">
        <div class="page-header">
          <h1>Exam Center</h1>
          <p>Earn your Defense Flooring certification by demonstrating mastery of the Resinous Coatings program.</p>
        </div>

        ${hasCert ? `
          <div style="background:var(--green-dim);border:1px solid rgba(76,175,125,0.3);border-radius:var(--radius);padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:12px">
            ${ICONS.trophy.replace('currentColor','#4caf7d')}
            <div><div style="font-size:13px;font-weight:700;color:var(--green)">Certified!</div>
            <div style="font-size:11px;color:var(--text-muted)">You have earned the Certified Resinous Installer credential. You may retake the exam to improve your score.</div></div>
          </div>
        ` : ''}

        ${attempts.length ? `
          <div class="rules-card" style="margin-bottom:16px">
            <div class="rules-title">Your Exam History</div>
            <div style="display:flex;gap:20px;flex-wrap:wrap">
              <div><div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:var(--gold)">${attempts.length}</div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Attempts</div></div>
              <div><div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:${bestScore >= 80 ? 'var(--green)' : 'var(--gold)'}">${bestScore}%</div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Best Score</div></div>
              <div><div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:var(--text)">${Math.round(attempts.reduce((s,a)=>s+a.score,0)/attempts.length)}%</div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Average</div></div>
            </div>
          </div>
        ` : ''}

        <div class="rules-card">
          <div class="rules-title">Exam Rules & Information</div>
          <div class="rule-row"><div class="rule-dot"></div><span>This exam contains <strong>80 questions</strong> drawn from all 13 course modules. You have <strong>90 minutes</strong> to complete it.</span></div>
          <div class="rule-row"><div class="rule-dot"></div><span>A passing score is <strong>64 correct answers (80%)</strong>. Your score and breakdown will be shown immediately upon submission.</span></div>
          <div class="rule-row"><div class="rule-dot"></div><span>Questions are multiple choice with one correct answer. You may review and change answers before submitting.</span></div>
          <div class="rule-row"><div class="rule-dot"></div><span>After submitting, correct answers and explanations are revealed. You can print or download your results.</span></div>
          <div class="rule-row"><div class="rule-dot"></div><span>The timer begins when you click <strong>Start Exam</strong>. Do not refresh the page during the exam.</span></div>
          <div class="rule-row"><div class="rule-dot"></div><span>Passing this exam earns the <strong>Certified Resinous Installer</strong> credential and <strong>+500 XP</strong>.</span></div>
        </div>

        <div class="rules-card">
          <div class="rules-title">Modules Covered</div>
          <div class="modules-list">
            ${[...new Set(DATA.QUESTIONS.map(q => q.m))].map(mod => {
              const qs = DATA.QUESTIONS.filter(q => q.m === mod);
              return `<div class="mod-pill"><strong>${mod}</strong>${qs[0].mt} — ${qs.length} questions</div>`;
            }).join('')}
          </div>
        </div>

        <button class="btn btn-gold btn-full btn-lg" style="margin-top:8px" onclick="startExam()">
          ${ICONS.play} Begin Certification Exam
        </button>
      </div>
    `;
  }

  // ── EXAM ENGINE ───────────────────────────────────────────────────────────
  function startExam() {
    const questions = shuffleArray([...DATA.QUESTIONS]);
    examState = {
      questions,
      answers: new Array(questions.length).fill(null),
      submitted: false,
      startTime: Date.now(),
      secondsLeft: 90 * 60
    };
    navigate('exam-active');
    startExamTimer();
    if (Store.awardAchievement('first-quiz')) showAchievementToast('first-quiz');
  }

  function startExamTimer() {
    clearInterval(examTimer);
    examTimer = setInterval(() => {
      if (!examState || examState.submitted) { clearInterval(examTimer); return; }
      examState.secondsLeft--;
      updateTimerDisplay();
      if (examState.secondsLeft <= 0) { clearInterval(examTimer); submitExam(true); }
    }, 1000);
  }

  function updateTimerDisplay() {
    const el = document.getElementById('exam-timer');
    const fill = document.getElementById('exam-timer-fill');
    if (!el || !examState) return;
    const m = Math.floor(examState.secondsLeft / 60);
    const s = examState.secondsLeft % 60;
    el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    if (examState.secondsLeft <= 300) el.classList.add('warn');
    if (fill) fill.style.width = `${(examState.secondsLeft / (90*60)) * 100}%`;
    const answered = examState.answers.filter(a => a !== null).length;
    const pb = document.getElementById('tb-progress');
    if (pb) pb.textContent = `${answered} / ${examState.questions.length}`;
  }

  function renderExamActive() {
    if (!examState) { navigate('exam'); return; }
    const container = document.getElementById('view-container');
    container.style.padding = '0';
    container.style.overflow = 'hidden';

    const grouped = {};
    examState.questions.forEach((q, i) => {
      if (!grouped[q.m]) grouped[q.m] = [];
      grouped[q.m].push({ ...q, idx: i });
    });

    container.innerHTML = `
      <div class="exam-shell">
        <div style="padding:0 32px;padding-top:16px;flex-shrink:0">
          <div class="exam-timer-bar">
            <span id="exam-timer" class="exam-timer-text">90:00</span>
            <div class="exam-timer-bar-track"><div class="exam-timer-fill" id="exam-timer-fill" style="width:100%"></div></div>
            <span class="exam-answered-label">Answered:<span id="tb-progress" class="exam-answered-val">0 / ${examState.questions.length}</span></span>
          </div>
          <div class="sec-dots" id="sec-dots" style="margin-top:12px">
            ${examState.questions.map((_,i) => `<div class="sec-dot" id="dot-${i}" title="Q${i+1}" onclick="scrollToQ(${i})"></div>`).join('')}
          </div>
        </div>
        <div class="exam-body" id="exam-body">
          ${Object.entries(grouped).map(([mod, qs]) => `
            <div class="exam-section-label">${mod} — ${qs[0].mt}</div>
            ${qs.map(q => `
              <div class="q-card" id="qc-${q.idx}">
                <div class="q-header">
                  <span class="q-num">Q${q.idx+1}</span>
                  <div class="q-text">${q.q}</div>
                </div>
                <div class="q-options">
                  ${q.opts.map((o,oi) => `
                    <div class="q-opt" id="opt-${q.idx}-${oi}" onclick="selectExamAnswer(${q.idx},${oi})">
                      <div class="opt-letter">${'ABCD'[oi]}</div>
                      <div class="opt-text">${o}</div>
                    </div>
                  `).join('')}
                </div>
                <div class="q-explanation" id="exp-${q.idx}"><strong>Explanation:</strong> ${q.exp}</div>
              </div>
            `).join('')}
          `).join('')}
        </div>
        <div class="exam-submit-area">
          <button class="btn btn-gold btn-full btn-lg" id="submit-btn" onclick="submitExam(false)" disabled>
            Submit Exam for Grading
          </button>
          <div class="exam-submit-note">All ${examState.questions.length} questions must be answered before submitting</div>
        </div>
      </div>
    `;
  }

  window.scrollToQ = function(i) {
    const el = document.getElementById(`qc-${i}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  window.selectExamAnswer = function(qIdx, optIdx) {
    if (!examState || examState.submitted) return;
    examState.answers[qIdx] = optIdx;
    for (let i = 0; i < 4; i++) {
      const el = document.getElementById(`opt-${qIdx}-${i}`);
      if (el) el.classList.remove('selected');
    }
    const sel = document.getElementById(`opt-${qIdx}-${optIdx}`);
    if (sel) sel.classList.add('selected');
    const card = document.getElementById(`qc-${qIdx}`);
    if (card) card.classList.add('answered');
    const dot = document.getElementById(`dot-${qIdx}`);
    if (dot) { dot.classList.add('done'); dot.classList.remove('active'); }
    const answered = examState.answers.filter(a => a !== null).length;
    const pb = document.getElementById('tb-progress');
    if (pb) pb.textContent = `${answered} / ${examState.questions.length}`;
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.disabled = answered < examState.questions.length;
  };

  window.startExam = startExam;
  window.submitExam = submitExam;

  function submitExam(timedOut) {
    if (!examState || examState.submitted) return;
    examState.submitted = true;
    clearInterval(examTimer);

    const elapsed = Math.round((Date.now() - examState.startTime) / 1000);
    let correct = 0;
    examState.questions.forEach((q, i) => { if (examState.answers[i] === q.a) correct++; });
    const pct = Math.round((correct / examState.questions.length) * 100);
    const passed = pct >= 80;

    Store.addExamAttempt({ pathId: 'resinous-mastery', score: pct, correct, total: examState.questions.length, passed, elapsed });

    if (passed) {
      const certAdded = Store.addCertification({ id: 'cert-resinous', name: 'Certified Resinous Installer', pathId: 'resinous-mastery', score: pct });
      const xpRes = Store.addXP(500);
      if (Store.awardAchievement('exam-passed')) showAchievementToast('exam-passed');
      if (certAdded && Store.awardAchievement('certified')) showAchievementToast('certified');
      if (certAdded && Store.awardAchievement('resinous-cert')) showAchievementToast('resinous-cert');
      if (pct >= 95 && Store.awardAchievement('high-score')) showAchievementToast('high-score');
      if (Store.getExamAttempts('resinous-mastery').length === 1 && passed) {
        if (Store.awardAchievement('exam-first-try')) showAchievementToast('exam-first-try');
      }
      if (xpRes && xpRes.leveledUp) showToast('Level Up!', `You reached ${xpRes.newLevel.title}!`, 'gold');
    }

    renderExamResults(correct, pct, passed, elapsed);
    renderTopbar();
    renderNav();
  }

  function renderExamResults(correct, pct, passed, elapsed) {
    const container = document.getElementById('view-container');
    container.style.padding = '0';
    container.style.overflowY = 'auto';
    const em = Math.floor(elapsed / 60);
    const es = elapsed % 60;
    const cert = Store.getCertifications().find(c => c.id === 'cert-resinous');

    const moduleScores = {};
    [...new Set(DATA.QUESTIONS.map(q => q.m))].forEach(mod => {
      const qs = examState.questions.filter(q => q.m === mod);
      const correctCount = qs.filter((q, qi) => {
        const flatIdx = examState.questions.indexOf(q);
        return examState.answers[flatIdx] === q.a;
      }).length;
      moduleScores[mod] = { correct: correctCount, total: qs.length, title: qs[0] ? qs[0].mt : '' };
    });

    container.innerHTML = `
      <div class="results-screen fade-up">
        <div class="results-hero">
          <div class="score-ring-wrap">
            ${Utils.progressRing(pct, 120, passed ? '#4caf7d' : '#e5534b', 'rgba(255,255,255,0.06)')}
          </div>
          <div class="result-title ${passed ? 'pass' : 'fail'}">${passed ? 'Certified' : 'Not Passed'}</div>
          <div class="result-sub">${passed
            ? `Congratulations! You scored ${pct}% and met the 80% passing requirement. You have earned the Certified Resinous Installer credential.`
            : `You scored ${pct}%. A minimum score of 80% (64/80) is required. Review the explanations below, revisit the course modules, and retake when ready.`
          }</div>
          <div class="result-stats">
            <div class="rs"><div class="rs-num">${correct}</div><div class="rs-label">Correct</div></div>
            <div class="rs"><div class="rs-num">${examState.questions.length - correct}</div><div class="rs-label">Incorrect</div></div>
            <div class="rs"><div class="rs-num">${pct}%</div><div class="rs-label">Score</div></div>
            <div class="rs"><div class="rs-num">${em}:${String(es).padStart(2,'0')}</div><div class="rs-label">Time Used</div></div>
          </div>
          <div class="result-btns">
            <button class="btn btn-gold" onclick="window.print()">${ICONS.print} Print Results</button>
            ${passed && cert ? `<button class="btn btn-gold" onclick="showCertModal()">${ICONS.trophy} View Certificate</button>` : ''}
            <button class="btn btn-outline" onclick="showReview()">${ICONS.book} Review Answers</button>
            <button class="btn btn-ghost" onclick="navigate('exam')">${ICONS.refresh} Retake Exam</button>
          </div>
        </div>

        <div class="rules-card">
          <div class="rules-title">Module Breakdown</div>
          <div class="breakdown-grid">
            ${Object.entries(moduleScores).map(([mod, ms]) => {
              const p = Math.round((ms.correct / ms.total) * 100);
              const color = p >= 80 ? 'var(--green)' : p >= 60 ? 'var(--gold)' : 'var(--red)';
              return `<div class="bd-card">
                <div class="bd-title">${mod}: ${ms.title}</div>
                <div class="bd-bar"><div class="bd-fill" style="width:${p}%;background:${color}"></div></div>
                <div class="bd-score">${ms.correct} / ${ms.total} correct (${p}%)</div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <div id="review-section" style="display:none">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border)">Full Exam Review — All Questions with Answers & Explanations</div>
          ${examState.questions.map((q, i) => {
            const ua = examState.answers[i];
            const isCorrect = ua === q.a;
            return `<div class="q-card" style="border-color:${isCorrect ? 'rgba(76,175,125,0.2)' : 'rgba(229,83,75,0.2)'}">
              <div class="q-header">
                <span class="q-num" style="color:${isCorrect ? 'var(--green)' : 'var(--red)'}">Q${i+1}</span>
                <div class="q-text">${q.q}</div>
              </div>
              <div class="q-options">
                ${q.opts.map((o, oi) => {
                  let cls = '';
                  if (oi === q.a) cls = 'correct';
                  else if (oi === ua && ua !== q.a) cls = 'wrong';
                  return `<div class="q-opt ${cls}" style="cursor:default"><div class="opt-letter">${'ABCD'[oi]}</div><div class="opt-text">${o}</div></div>`;
                }).join('')}
              </div>
              <div class="q-explanation show"><strong>Explanation:</strong> ${q.exp}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  window.showReview = function() {
    const sec = document.getElementById('review-section');
    if (sec) { sec.style.display = 'block'; sec.scrollIntoView({ behavior: 'smooth' }); }
  };

  window.showCertModal = function() {
    const cert = Store.getCertifications().find(c => c.id === 'cert-resinous');
    const user = Store.getUser();
    if (!cert || !user) return;
    const certDef = DATA.CERTIFICATIONS.find(c => c.id === 'cert-resinous');
    showModal('Certification Document', `
      <div class="cert-preview-wrap">
        ${generateCertSVG(user, certDef, cert)}
      </div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn btn-gold btn-full" onclick="downloadCert()">${ICONS.dl} Download Certificate</button>
        <button class="btn btn-outline" onclick="window.print()">${ICONS.print} Print</button>
      </div>
    `);
  };

  window.downloadCert = function() {
    const cert = Store.getCertifications().find(c => c.id === 'cert-resinous');
    const user = Store.getUser();
    if (!cert || !user) return;
    const certDef = DATA.CERTIFICATIONS.find(c => c.id === 'cert-resinous');
    const svgStr = generateCertSVG(user, certDef, cert);
    const blob = new Blob([svgStr.replace(/<\/div>.*/, '').replace(/^.*<svg/, '<svg')], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `DF-Certificate-${cert.number}.svg`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── CERTIFICATIONS VIEW ───────────────────────────────────────────────────
  function renderCertifications() {
    const earned = Store.getCertifications();
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="page-header"><h1>Certifications</h1><p>Earned credentials and available certifications. Pass the required exams to unlock new credentials.</p></div>

      ${earned.length ? `
        <div class="section-head"><h2>Earned</h2></div>
        <div class="cert-grid fade-up">
          ${earned.map(c => {
            const certDef = DATA.CERTIFICATIONS.find(cd => cd.id === c.id);
            return certDef ? certCardEarned(c, certDef) : '';
          }).join('')}
        </div>
        <div class="section-divider"></div>
      ` : ''}

      <div class="section-head"><h2>${earned.length ? 'All Certifications' : 'Available Certifications'}</h2></div>
      <div class="cert-grid">
        ${DATA.CERTIFICATIONS.map(certDef => {
          const ec = earned.find(c => c.id === certDef.id);
          return ec ? certCardEarned(ec, certDef) : certCardLocked(certDef);
        }).join('')}
      </div>
    `;
  }

  function certCardEarned(cert, certDef) {
    return `<div class="cert-card earned">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="cert-icon">${certIconSVG(certDef.color)}</div>
        <div>
          <div class="cert-name">${certDef.name}</div>
          <div class="cert-date">Earned: ${Utils.formatDate(cert.earnedAt)}</div>
          <div class="cert-number">${cert.number}</div>
        </div>
      </div>
      <div class="cert-desc">${certDef.desc}</div>
      <div class="cert-actions">
        <button class="btn btn-gold btn-sm" onclick="showCertModal()">${ICONS.trophy} View Certificate</button>
        <button class="btn btn-outline btn-sm" onclick="downloadCert()">${ICONS.dl} Download</button>
      </div>
    </div>`;
  }

  function certCardLocked(certDef) {
    const passed = Store.getBestScore(certDef.pathId);
    return `<div class="cert-card">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="cert-icon" style="opacity:0.4">${certIconSVG('#888')}</div>
        <div>
          <div class="cert-name" style="color:var(--text-muted)">${certDef.name}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
            ${ICONS.lock.replace('width="20"','width="13"')} <span style="font-size:10px;color:var(--text-dim)">Not Yet Earned</span>
          </div>
        </div>
      </div>
      <div class="cert-desc" style="color:var(--text-dim)">${certDef.desc}</div>
      <div class="cert-requirements" style="margin-bottom:8px">${certDef.requirements}</div>
      ${passed !== null ? `<div style="font-size:11px;color:var(--gold)">Best exam score: ${passed}%</div>` : ''}
      <button class="btn btn-outline btn-full btn-sm" onclick="navigate('exam')">${ICONS.exam} Go to Exam Center</button>
    </div>`;
  }

  function certIconSVG(color) {
    return `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="8" fill="${color}20"/>
      <path d="M24 8l4 12 12 0-10 7 4 12-10-8-10 8 4-12-10-7 12 0z" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>
    </svg>`;
  }

  // ── CERTIFICATE SVG GENERATOR ─────────────────────────────────────────────
  function generateCertSVG(user, certDef, cert) {
    const date = Utils.formatDate(cert.earnedAt);
    const name = user.name || 'Crew Member';
    const certNum = cert.number || 'DF-2024-0001';
    return `<svg viewBox="0 0 800 560" xmlns="http://www.w3.org/2000/svg" font-family="Georgia,serif">
      <defs>
        <linearGradient id="certBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1a1510"/>
          <stop offset="100%" stop-color="#0f0f0f"/>
        </linearGradient>
        <linearGradient id="borderGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#8a6c1e"/>
          <stop offset="50%" stop-color="#c8a84b"/>
          <stop offset="100%" stop-color="#8a6c1e"/>
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="800" height="560" fill="url(#certBg)"/>

      <!-- Outer border -->
      <rect x="12" y="12" width="776" height="536" fill="none" stroke="#c8a84b" stroke-width="2.5" opacity="0.6"/>
      <rect x="18" y="18" width="764" height="524" fill="none" stroke="#c8a84b" stroke-width="0.8" opacity="0.3"/>

      <!-- Corner ornaments -->
      <g stroke="#c8a84b" stroke-width="1.5" fill="none" opacity="0.7">
        <path d="M12 42 L12 12 L42 12"/>
        <path d="M758 12 L788 12 L788 42"/>
        <path d="M12 518 L12 548 L42 548"/>
        <path d="M758 548 L788 548 L788 518"/>
      </g>

      <!-- Top geometric accent -->
      <rect x="0" y="0" width="800" height="90" fill="#c8a84b" opacity="0.07"/>
      <line x1="80" y1="90" x2="720" y2="90" stroke="#c8a84b" stroke-width="1" opacity="0.4"/>

      <!-- DF Logo area -->
      <rect x="358" y="28" width="84" height="44" rx="6" fill="#c8a84b" opacity="0.12"/>
      <rect x="358" y="28" width="84" height="44" rx="6" fill="none" stroke="#c8a84b" stroke-width="1" opacity="0.4"/>
      <text x="400" y="56" text-anchor="middle" font-family="'Barlow Condensed',Impact,sans-serif" font-weight="900" font-size="20" letter-spacing="2" fill="#c8a84b">DF</text>

      <!-- Defense Flooring header -->
      <text x="400" y="112" text-anchor="middle" font-family="'Barlow Condensed',Impact,sans-serif" font-weight="700" font-size="11" letter-spacing="6" fill="#c8a84b" text-transform="uppercase">DEFENSE FLOORING LLC</text>

      <!-- Certificate of heading -->
      <text x="400" y="162" text-anchor="middle" font-family="Georgia,serif" font-size="14" letter-spacing="8" fill="#a89060" opacity="0.9">CERTIFICATE OF</text>

      <!-- Certification -->
      <text x="400" y="215" text-anchor="middle" font-family="'Barlow Condensed',Impact,sans-serif" font-weight="900" font-size="48" letter-spacing="3" fill="#c8a84b">CERTIFICATION</text>

      <!-- Divider line with dots -->
      <line x1="160" y1="232" x2="640" y2="232" stroke="url(#borderGrad)" stroke-width="1.5"/>
      <circle cx="400" cy="232" r="4" fill="#c8a84b"/>

      <!-- This certifies text -->
      <text x="400" y="265" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#9a8a6a" letter-spacing="3">This certifies that</text>

      <!-- Recipient Name -->
      <text x="400" y="318" text-anchor="middle" font-family="'Palatino Linotype',Georgia,serif" font-style="italic" font-size="38" fill="#e8e0c8">${name}</text>
      <line x1="160" y1="335" x2="640" y2="335" stroke="#c8a84b" stroke-width="0.8" opacity="0.4"/>

      <!-- Has demonstrated text -->
      <text x="400" y="365" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#9a8a6a" letter-spacing="2">has successfully demonstrated mastery in</text>

      <!-- Cert name -->
      <text x="400" y="400" text-anchor="middle" font-family="'Barlow Condensed',Impact,sans-serif" font-weight="700" font-size="22" letter-spacing="1.5" fill="#c8a84b">${certDef ? certDef.name.toUpperCase() : 'RESINOUS FLOORING SYSTEMS'}</text>

      <!-- Bottom divider -->
      <line x1="160" y1="420" x2="640" y2="420" stroke="url(#borderGrad)" stroke-width="1"/>

      <!-- Signature area left -->
      <line x1="120" y1="490" x2="280" y2="490" stroke="#c8a84b" stroke-width="1" opacity="0.5"/>
      <text x="200" y="510" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="#6a5a3a" letter-spacing="1">PROGRAM DIRECTOR</text>
      <text x="200" y="524" text-anchor="middle" font-family="Georgia,serif" font-size="9" fill="#554a30" letter-spacing="1">Defense Flooring LLC</text>

      <!-- Center details -->
      <text x="400" y="456" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="#8a7a5a" letter-spacing="2">Issued: ${date}</text>

      <!-- Star seal -->
      <polygon points="400,438 404,449 416,449 407,456 410,467 400,460 390,467 393,456 384,449 396,449" fill="none" stroke="#c8a84b" stroke-width="1.5" opacity="0.6"/>

      <!-- Signature area right -->
      <line x1="520" y1="490" x2="680" y2="490" stroke="#c8a84b" stroke-width="1" opacity="0.5"/>
      <text x="600" y="510" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="#6a5a3a" letter-spacing="1">OPERATIONS DIRECTOR</text>
      <text x="600" y="524" text-anchor="middle" font-family="Georgia,serif" font-size="9" fill="#554a30" letter-spacing="1">Defense Flooring LLC</text>

      <!-- Cert number footer -->
      <text x="400" y="546" text-anchor="middle" font-family="'Courier New',monospace" font-size="9" fill="#5a4a2a" letter-spacing="2">CERTIFICATE NO: ${certNum} · HAMPTON ROADS, VA · NAICS 238330 · CAGE: 12GB6</text>
    </svg>`;
  }

  // ── HANDBOOK ──────────────────────────────────────────────────────────────
  function renderHandbook() {
    const handbookProgress = Store.getHandbookProgress();
    const container = document.getElementById('view-container');
    container.style.padding = '0';
    container.style.overflow = 'hidden';

    const sections = DATA.HANDBOOK_SECTIONS;
    const firstId = sections[0] ? sections[0].id : '';

    container.innerHTML = `
      <div class="handbook-layout">
        <div class="handbook-toc">
          <div style="padding:12px 16px 4px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text)">Employee Handbook</div>
          ${sections.map((s, i) => {
            const read = handbookProgress.includes(s.id);
            return `<div class="handbook-toc-item ${i === 0 ? 'active' : ''}" id="toc-${s.id}" onclick="showHandbookSection('${s.id}')">
              <span style="color:${read ? 'var(--green)' : 'var(--text-dim)'};width:12px;flex-shrink:0">${read ? ICONS.check.replace('width="20"','width="12"') : '○'}</span>
              ${s.title}
            </div>`;
          }).join('')}
          <div style="padding:16px;margin-top:8px">
            <div style="font-size:10px;color:var(--text-muted);text-align:center">${handbookProgress.length} / ${sections.length} sections read</div>
          </div>
        </div>
        <div class="handbook-content" id="handbook-content">
          ${renderHandbookSection(sections[0])}
        </div>
      </div>
    `;

    // Mark first section read
    if (firstId) setTimeout(() => markHandbookSection(firstId), 1000);
  }

  function renderHandbookSection(section) {
    if (!section) return '';
    return `<div class="handbook-section">
      <div class="handbook-section-title">${section.title}</div>
      ${section.content}
      <div style="margin-top:24px">
        <button class="btn btn-gold btn-sm" onclick="markHandbookSection('${section.id}')">
          ${ICONS.check} Mark as Read
        </button>
      </div>
    </div>`;
  }

  window.showHandbookSection = function(id) {
    const section = DATA.HANDBOOK_SECTIONS.find(s => s.id === id);
    if (!section) return;
    const content = document.getElementById('handbook-content');
    if (content) { content.innerHTML = renderHandbookSection(section); content.scrollTop = 0; }
    document.querySelectorAll('.handbook-toc-item').forEach(el => el.classList.remove('active'));
    const toc = document.getElementById(`toc-${id}`);
    if (toc) toc.classList.add('active');
    setTimeout(() => markHandbookSection(id), 1000);
  };

  window.markHandbookSection = function(id) {
    Store.markHandbookRead(id);
    const toc = document.getElementById(`toc-${id}`);
    if (toc) toc.innerHTML = toc.innerHTML.replace('○', ICONS.check.replace('width="20"','width="12"'));
    // Check if all read
    const allSections = DATA.HANDBOOK_SECTIONS.map(s => s.id);
    const allRead = allSections.every(sid => Store.getHandbookProgress().includes(sid));
    if (allRead && Store.awardAchievement('handbook-read')) showAchievementToast('handbook-read');
    renderTopbar();
  };

  // ── ANALYTICS ─────────────────────────────────────────────────────────────
  function renderAnalytics() {
    const user = Store.getUser();
    const stats = Store.getStats();
    const xp = user ? (user.xp || 0) : 0;
    const level = Store.getLevelForXP(xp);
    const attempts = Store.getExamAttempts();
    const earnedIds = Store.getAchievements();
    const allAchievements = DATA.ACHIEVEMENTS;

    // Chart data
    const courseList = Object.keys(DATA.COURSES);
    const completionData = courseList.map(id => ({
      label: DATA.COURSES[id].title.split(' ').slice(0,2).join(' '),
      value: Utils.coursePct(id),
      color: Utils.courseStatus(id) === 'completed' ? 'var(--green)' : 'var(--gold)'
    })).filter(d => Store.getCourseProgress(d.label) !== null || d.value > 0).slice(0, 6);

    const scoreHistory = attempts.slice(-8).map((a, i) => ({
      label: `#${i+1}`,
      value: a.score,
      color: a.passed ? 'var(--green)' : 'var(--red)'
    }));

    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="page-header">
        <h1>Analytics</h1>
        <p>Your learning progress, performance data, and achievement history.</p>
      </div>

      <!-- Profile Summary -->
      <div class="card" style="margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
          <div style="width:64px;height:64px;background:var(--gold-dim);border:2px solid rgba(200,168,75,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;color:var(--gold);flex-shrink:0">
            ${Utils.initials(user ? user.name : 'DF')}
          </div>
          <div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;text-transform:uppercase;color:var(--text)">${user ? user.name : '—'}</div>
            <div style="font-size:12px;color:var(--text-muted)">${user ? user.role : '—'}</div>
            <div style="display:flex;gap:8px;margin-top:6px">
              <span class="chip gold">Level ${level.level} — ${level.title}</span>
              <span class="chip">${xp.toLocaleString()} XP</span>
              <span class="chip">${earnedIds.length} Achievements</span>
            </div>
          </div>
          <div style="margin-left:auto">
            <div style="font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px">Member Since</div>
            <div style="font-size:13px;color:var(--text)">${Utils.formatDate(user ? user.joinedAt : null)}</div>
          </div>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card"><div class="stat-icon gold">${ICONS.book.replace('currentColor','#c8a84b')}</div><div class="stat-body"><div class="stat-val">${stats.coursesCompleted}</div><div class="stat-label">Courses Done</div></div></div>
        <div class="stat-card"><div class="stat-icon green">${ICONS.check.replace('currentColor','#4caf7d')}</div><div class="stat-body"><div class="stat-val">${stats.totalLessonsCompleted}</div><div class="stat-label">Lessons Done</div></div></div>
        <div class="stat-card"><div class="stat-icon blue">${ICONS.clock.replace('currentColor','#5b9cf6')}</div><div class="stat-body"><div class="stat-val">${stats.hoursLearned}</div><div class="stat-label">Hours Learned</div></div></div>
        <div class="stat-card"><div class="stat-icon gold">${ICONS.exam.replace('currentColor','#c8a84b')}</div><div class="stat-body"><div class="stat-val">${attempts.length}</div><div class="stat-label">Exam Attempts</div></div></div>
      </div>

      <div class="grid-2">
        <!-- Course Completion Chart -->
        <div class="analytics-chart-card">
          <div class="analytics-chart-title">Course Completion (%)</div>
          ${completionData.length ? Utils.barChart(completionData, 380, 160) : '<div class="empty-state" style="padding:20px"><p>Start a course to see progress</p></div>'}
        </div>

        <!-- Exam Score History -->
        <div class="analytics-chart-card">
          <div class="analytics-chart-title">Exam Score History</div>
          ${scoreHistory.length >= 2 ? Utils.lineChart(scoreHistory, 380, 140) : '<div class="empty-state" style="padding:20px"><p>Take the exam to see score history</p></div>'}
          ${attempts.length ? `<div style="display:flex;gap:14px;margin-top:12px;flex-wrap:wrap">
            <span style="font-size:11px;color:var(--text-muted)">Best: <strong style="color:var(--gold)">${Store.getBestScore('resinous-mastery') || '—'}%</strong></span>
            <span style="font-size:11px;color:var(--text-muted)">Avg: <strong style="color:var(--gold)">${stats.avgScore}%</strong></span>
            <span style="font-size:11px;color:var(--text-muted)">Attempts: <strong style="color:var(--text)">${attempts.length}</strong></span>
          </div>` : ''}
        </div>
      </div>

      <!-- Achievements -->
      <div class="section-head mt-24"><h2>All Achievements</h2><span style="font-size:11px;color:var(--text-muted)">${earnedIds.length} / ${allAchievements.length} earned</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:10px" class="fade-up">
        ${allAchievements.map(a => achievementItem(a, earnedIds.includes(a.id))).join('')}
      </div>

      <!-- Reset section -->
      <div class="section-divider"></div>
      <div class="card" style="margin-top:0">
        <div class="card-title">Reset Progress</div>
        <p style="font-size:12px;color:var(--text-muted);margin:8px 0 14px">This will permanently delete all your learning progress, exam history, and certifications. This action cannot be undone.</p>
        <button class="btn btn-danger btn-sm" onclick="confirmReset()">Reset All Progress</button>
      </div>
    `;
  }

  window.confirmReset = function() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      Store.reset();
      location.reload();
    }
  };

  // ── ONBOARDING ────────────────────────────────────────────────────────────
  function renderOnboarding() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="onboarding-overlay">
        <div class="onboarding-card fade-up">
          <div class="onboarding-logo">
            <div class="onboarding-logo-icon">
              <svg viewBox="0 0 26 26" width="26" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="2" y="20" font-family="Barlow Condensed,sans-serif" font-weight="900" font-size="18" fill="#0a0a0a">DF</text>
              </svg>
            </div>
            <div class="onboarding-logo-text">
              <h1>Defense Flooring</h1>
              <p>Learning Portal</p>
            </div>
          </div>
          <!-- Team photo -->
          <div style="border-radius:6px;overflow:hidden;margin-bottom:20px;height:130px;position:relative">
            <img src="assets/photos/2S5A8497.jpg" alt="The Defense Flooring Team"
              style="width:100%;height:100%;object-fit:cover;object-position:center 30%">
            <div style="position:absolute;inset:0;background:linear-gradient(to right,rgba(10,10,10,0.6) 0%,transparent 60%)"></div>
            <div style="position:absolute;bottom:10px;left:14px">
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#fff">Bold Flooring. Bold People.</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.6);letter-spacing:0.15em;text-transform:uppercase">Hampton Roads, VA</div>
            </div>
          </div>
          <div class="onboarding-heading">Welcome Aboard</div>
          <div class="onboarding-sub">Set up your profile to get started with the Defense Flooring training program.</div>
          <div class="form-group">
            <label class="form-label">Your Full Name</label>
            <input class="form-input" id="ob-name" type="text" placeholder="e.g. Mike Brown" autofocus>
          </div>
          <div class="form-group">
            <label class="form-label">Your Role</label>
            <select class="form-select" id="ob-role">
              <option value="" disabled selected>Select your role...</option>
              ${DATA.ROLES.map(r => `<option>${r}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-gold btn-full btn-lg" style="margin-top:8px" onclick="completeOnboarding()">
            Get Started ${ICONS.arrowR}
          </button>
          <div style="text-align:center;margin-top:16px;font-size:11px;color:var(--text-muted)">
            Defense Flooring LLC · Hampton Roads, VA · defenseflooring.com
          </div>
        </div>
      </div>
    `;
  }

  window.completeOnboarding = function() {
    const name = document.getElementById('ob-name').value.trim();
    const role = document.getElementById('ob-role').value;
    if (!name) { document.getElementById('ob-name').focus(); return; }
    if (!role) { document.getElementById('ob-role').focus(); return; }
    Store.setUser({ name, role, xp: 0, joinedAt: new Date().toISOString() });
    Store.awardAchievement('first-login');
    renderShell();
    navigate('dashboard');
    setTimeout(() => showToast('Welcome, ' + name.split(' ')[0] + '!', 'Your learning journey begins now. +25 XP', 'gold'), 400);
    setTimeout(() => showAchievementToast('first-login'), 1200);
  };

  // ── MODAL ─────────────────────────────────────────────────────────────────
  function showModal(title, body) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="modal-overlay" onclick="closeModalOnOverlay(event)">
        <div class="modal-box fade-up">
          <div class="modal-header">
            <div class="modal-title">${title}</div>
            <button class="modal-close" onclick="closeModal()">${ICONS.xmark}</button>
          </div>
          <div class="modal-body">${body}</div>
        </div>
      </div>
    `;
  }

  window.closeModal = function() {
    const root = document.getElementById('modal-root');
    if (root) root.innerHTML = '';
  };

  window.closeModalOnOverlay = function(e) {
    if (e.target === e.currentTarget) window.closeModal();
  };

  // ── TOASTS ────────────────────────────────────────────────────────────────
  function showToast(title, desc, type = 'gold') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const id = 'toast-' + Date.now();
    const icon = type === 'gold' ? ICONS.bolt : ICONS.check;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.id = id;
    el.innerHTML = `<div class="toast-icon">${achievementBadgeSVG('star', true)}</div><div class="toast-body"><div class="toast-title">${title}</div><div class="toast-desc">${desc}</div></div>`;
    el.onclick = () => el.remove();
    container.appendChild(el);
    setTimeout(() => el && el.remove(), 4000);
  }

  function showAchievementToast(id) {
    const a = DATA.ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return;
    showToast('Achievement Unlocked: ' + a.name, a.desc + ' · +' + a.xp + ' XP', 'gold');
  }

  // ── UTILS ─────────────────────────────────────────────────────────────────
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ── INIT ──────────────────────────────────────────────────────────────────
  function init() {
    const user = Store.getUser();
    if (!user) {
      renderOnboarding();
    } else {
      renderShell();
      navigate('dashboard');
    }
  }

  // Expose navigate globally
  window.navigate = navigate;

  init();

})(window.DF_DATA, window.DF_STORE);
