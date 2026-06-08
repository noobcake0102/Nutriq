/* ── DEFENSE FLOORING LMS — DATA LAYER ─────────────────────────────────── */
window.DF_DATA = (function() {
  'use strict';

  const ROLES = [
    'Field Installer',
    'Lead Installer',
    'Crew Chief',
    'Estimator',
    'Project Manager',
    'Sales Representative',
    'Operations Staff',
    'Office/Admin',
    'Other'
  ];

  const LEVELS = [
    { level: 1,  title: 'Recruit',           minXP: 0,     maxXP: 200   },
    { level: 2,  title: 'Apprentice',        minXP: 201,   maxXP: 500   },
    { level: 3,  title: 'Installer',         minXP: 501,   maxXP: 1000  },
    { level: 4,  title: 'Lead Installer',    minXP: 1001,  maxXP: 2000  },
    { level: 5,  title: 'Crew Chief',        minXP: 2001,  maxXP: 3500  },
    { level: 6,  title: 'Site Supervisor',   minXP: 3501,  maxXP: 5500  },
    { level: 7,  title: 'Project Manager',   minXP: 5501,  maxXP: 8000  },
    { level: 8,  title: 'Senior PM',         minXP: 8001,  maxXP: 11000 },
    { level: 9,  title: 'Master Installer',  minXP: 11001, maxXP: 15000 },
    { level: 10, title: 'DF Expert',         minXP: 15001, maxXP: 99999 }
  ];

  const ACHIEVEMENTS = [
    { id: 'first-login',       name: 'First Mission',         desc: 'Logged into the DF Learning Portal',           xp: 25,  icon: 'star' },
    { id: 'first-lesson',      name: 'Knowledge Seeker',      desc: 'Completed your first lesson',                  xp: 50,  icon: 'book' },
    { id: 'first-quiz',        name: 'Quiz Taker',            desc: 'Passed your first knowledge check',            xp: 75,  icon: 'check' },
    { id: 'first-course',      name: 'Course Complete',       desc: 'Completed your first full course',             xp: 150, icon: 'trophy' },
    { id: 'five-lessons',      name: 'On the Move',           desc: 'Completed 5 lessons',                          xp: 100, icon: 'bolt' },
    { id: 'ten-lessons',       name: 'Building Momentum',     desc: 'Completed 10 lessons',                         xp: 150, icon: 'bolt' },
    { id: 'perfect-quiz',      name: 'Sharpshoter',           desc: 'Scored 100% on a knowledge check',             xp: 100, icon: 'target' },
    { id: 'exam-first-try',    name: 'One and Done',          desc: 'Passed the certification exam on first attempt',xp: 250, icon: 'medal' },
    { id: 'exam-passed',       name: 'Exam Ready',            desc: 'Passed a certification exam',                  xp: 200, icon: 'medal' },
    { id: 'certified',         name: 'Certified',             desc: 'Earned your first Defense Flooring certification',xp:500, icon: 'cert' },
    { id: 'resinous-cert',     name: 'Resinous Master',       desc: 'Earned the Certified Resinous Installer credential',xp:500,'icon':'cert'},
    { id: 'all-modules',       name: 'Full Coverage',         desc: 'Completed all 13 course modules',              xp: 300, icon: 'grid' },
    { id: 'quiz-streak-5',     name: 'On a Roll',             desc: 'Answered 5 questions correct in a row',        xp: 75,  icon: 'fire' },
    { id: 'fast-learner',      name: 'Fast Learner',          desc: 'Completed a lesson in under 10 minutes',       xp: 50,  icon: 'clock' },
    { id: 'level-3',           name: 'Installer Status',      desc: 'Reached Installer level',                      xp: 0,   icon: 'level' },
    { id: 'level-5',           name: 'Crew Chief Status',     desc: 'Reached Crew Chief level',                     xp: 0,   icon: 'level' },
    { id: 'level-7',           name: 'PM Status',             desc: 'Reached Project Manager level',                xp: 0,   icon: 'level' },
    { id: 'handbook-read',     name: 'By the Book',           desc: 'Read through the Employee Handbook',           xp: 100, icon: 'book' },
    { id: 'high-score',        name: 'High Score',            desc: 'Scored 95%+ on any exam',                      xp: 200, icon: 'star' },
    { id: 'safety-complete',   name: 'Safety First',          desc: 'Completed the Safety module',                  xp: 150, icon: 'shield' }
  ];

  const LEARNING_PATHS = [
    {
      id: 'new-employee',
      title: 'New Employee Onboarding',
      desc: 'Everything you need to get started at Defense Flooring — our mission, values, processes, and team structure.',
      color: '#5b9cf6',
      courses: ['company-overview'],
      totalLessons: 8,
      estimatedHours: '2 hrs',
      available: true
    },
    {
      id: 'resinous-mastery',
      title: 'Resinous Flooring Mastery',
      desc: 'The complete technical training program for resinous coating systems. From concrete fundamentals to QC and troubleshooting.',
      color: '#c8a84b',
      courses: ['concrete-fundamentals', 'surface-prep-bonding', 'coating-systems-application', 'moisture-specialty', 'safety-qc'],
      totalLessons: 39,
      estimatedHours: '12 hrs',
      available: true,
      certId: 'cert-resinous'
    },
    {
      id: 'salesforce-training',
      title: 'Salesforce CRM Training',
      desc: 'Lead management, opportunity tracking, reporting, and dashboards inside Salesforce.',
      color: '#00a1e0',
      courses: [],
      totalLessons: 24,
      estimatedHours: '6 hrs',
      available: false
    },
    {
      id: 'gov-contracting',
      title: 'Government Contracting',
      desc: 'SAM registration, NAICS codes, set-asides, compliance requirements, and contract vehicles.',
      color: '#888c79',
      courses: [],
      totalLessons: 18,
      estimatedHours: '5 hrs',
      available: false
    },
    {
      id: 'estimating',
      title: 'Estimating & Bidding',
      desc: 'Takeoffs, bid process, proposal writing, and pricing strategy for commercial and government work.',
      color: '#4caf7d',
      courses: [],
      totalLessons: 20,
      estimatedHours: '6 hrs',
      available: false
    },
    {
      id: 'safety-academy',
      title: 'Safety Academy',
      desc: 'OSHA compliance, silica awareness, PPE selection, equipment safety, and emergency response.',
      color: '#e5534b',
      courses: [],
      totalLessons: 16,
      estimatedHours: '4 hrs',
      available: false
    }
  ];

  const COURSES = {
    'company-overview': {
      id: 'company-overview',
      title: 'Defense Flooring Company Overview',
      pathId: 'new-employee',
      duration: '2 hrs',
      lessons: 8,
      desc: 'Our story, mission, values, structure, and what it means to be part of the DF team.',
      modules: [
        {
          id: 'm1',
          title: 'Who We Are',
          lessons: [
            {
              id: 'm1-l1',
              title: 'Mission, Vision & Values',
              duration: '15 min',
              objectives: ['Understand Defense Flooring\'s core mission', 'Identify our three core values', 'Describe the markets we serve'],
              content: `
                <h3>Our Mission</h3>
                <p>Defense Flooring's mission is to provide custom turn-key flooring solutions to the Department of Defense through <strong>unparalleled customer service</strong>, durable products, and using top-of-the-line materials to transform spaces where our military live, work, and play.</p>
                <p>We are more than a flooring contractor. We are a precision-driven small business operating at a military-grade standard — one that serves the people who serve our country.</p>
                <div class="callout warn">
                  <h5>Core Values</h5>
                  <p><strong>Service. Integrity. Excellence.</strong> — These aren't taglines. They're the standard every crew member, every bid, and every installation is held to.</p>
                </div>
                <h3>What We Do</h3>
                <p>Defense Flooring is a specialty flooring contractor with deep expertise in resinous systems, resilient flooring, and concrete work. Our primary clients are Department of Defense facilities, but we also serve commercial, industrial, healthcare, and aviation customers nationwide.</p>
                <h3>Where We Operate</h3>
                <p>We are headquartered in Virginia Beach, VA — right in the heart of Hampton Roads, one of the largest concentrations of military installations in the world. Our crews are badged and qualified to work on most Hampton Roads military facilities, and we deploy nationally on government contracts.</p>
                <div class="callout info">
                  <h5>Key Credentials</h5>
                  <p>NAICS: 238330 · CAGE Code: 12GB6 · UEI: PPCUD7Z8NTS9 · VA Class A License: 2705196975</p>
                </div>
              `,
              knowledgeCheck: [0, 1]
            },
            {
              id: 'm1-l2',
              title: 'Our Markets & Services',
              duration: '12 min',
              objectives: ['List Defense Flooring\'s primary service lines', 'Identify our primary and secondary customer segments'],
              content: `
                <h3>Core Service Lines</h3>
                <p>Defense Flooring provides a comprehensive range of flooring systems:</p>
                <ul>
                  <li><strong>Resinous Systems:</strong> Epoxy, polyaspartic, urethane cement, MMA coatings</li>
                  <li><strong>Polished & Decorative Concrete:</strong> Grind-and-seal, full polish, overlays</li>
                  <li><strong>Resilient Flooring:</strong> LVT/LVP, sheet vinyl, rubber flooring</li>
                  <li><strong>Carpet & VCT:</strong> Carpet tile, vinyl composition tile</li>
                  <li><strong>Concrete Repair & Prep:</strong> Crack repair, moisture barriers, surface profiling</li>
                </ul>
                <h3>Who We Serve</h3>
                <p><strong>Primary (70%) — DOD/Government:</strong> Contracting Officers, Base Facility Managers, and GC Project Managers working in military installations, hangars, and federal facilities.</p>
                <p><strong>Secondary (30%) — Commercial:</strong> General Contractors, Seller Partners (ADS Inc., Grainger, SpaceSaver, Patterson Pope), and institutional facility managers in healthcare, education, aviation, and industrial sectors.</p>
              `,
              knowledgeCheck: []
            }
          ]
        },
        {
          id: 'm2',
          title: 'How We Work',
          lessons: [
            {
              id: 'm2-l1',
              title: 'The Defense Flooring Standard',
              duration: '18 min',
              objectives: ['Understand the DF quality standard', 'Know our communication expectations', 'Describe what mission-ready means on a job site'],
              content: `
                <h3>Mission-Ready Standard</h3>
                <p>At Defense Flooring, "mission-ready" isn't a marketing phrase — it's a job site standard. Every installation must be:</p>
                <ul>
                  <li>Prepared to the correct surface profile (CSP)</li>
                  <li>Applied to manufacturer specifications</li>
                  <li>Documented with timestamped photos and QC records</li>
                  <li>Completed on schedule, on spec, and without rework</li>
                </ul>
                <div class="callout warn">
                  <h5>Zero Rework Policy</h5>
                  <p>Rework is the most expensive cost in this business — it wastes materials, labor, and customer trust. Every crew member is expected to understand the spec before they start, not after they make a mistake.</p>
                </div>
                <h3>Communication Standard</h3>
                <p>We communicate clearly and promptly with customers, GCs, and each other. If something is wrong on a job site, you escalate immediately — not after the coating is applied. Silence is not an option.</p>
                <h3>Documentation</h3>
                <p>Every job requires: timestamped progress photos, ambient condition records (temp, humidity, dew point), product batch numbers, and signed completion documentation. This protects the customer and Defense Flooring.</p>
              `,
              knowledgeCheck: []
            }
          ]
        }
      ]
    },

    'concrete-fundamentals': {
      id: 'concrete-fundamentals',
      title: 'Concrete Science & Surface Fundamentals',
      pathId: 'resinous-mastery',
      duration: '3 hrs',
      lessons: 9,
      desc: 'Portland cement chemistry, slab properties, surface profiling, and bond mechanisms — the foundation of every resinous installation.',
      modules: [
        {
          id: 'm1',
          title: 'Module 1 — Concrete Chemistry',
          lessons: [
            {
              id: 'm1-l1',
              title: 'Portland Cement & Hydration',
              duration: '18 min',
              objectives: ['Describe the hydration reaction and C-S-H formation', 'Explain why the 28-day rule exists', 'Identify the pH range of fresh concrete and its impact on coatings'],
              content: `
                <h3>The Hydration Reaction</h3>
                <p>When portland cement is mixed with water, a chemical reaction called <strong>hydration</strong> begins. The primary product of hydration is <strong>calcium silicate hydrate (C-S-H)</strong> — a gel-like compound that progressively binds the aggregates together and gives concrete its compressive strength.</p>
                <p>C-S-H continues to develop over time, which is why freshly poured concrete is weak and why we must wait before applying coatings.</p>
                <div class="lesson-svg-block">
                  <svg viewBox="0 0 400 120" width="400" height="120" xmlns="http://www.w3.org/2000/svg">
                    <rect width="400" height="120" fill="#1a1a1a" rx="6"/>
                    <text x="20" y="22" fill="#888c79" font-family="Barlow Condensed,sans-serif" font-size="10" font-weight="700" letter-spacing="2">CONCRETE STRENGTH DEVELOPMENT</text>
                    <!-- bars -->
                    <rect x="20" y="90" width="40" height="20" fill="#333" rx="2"/>
                    <rect x="20" y="74" width="40" height="36" fill="rgba(200,168,75,0.3)" rx="2"/>
                    <text x="40" y="68" fill="#888" font-size="9" text-anchor="middle">3 days</text>
                    <text x="40" y="64" fill="#c8a84b" font-size="9" text-anchor="middle">40%</text>
                    <rect x="80" y="90" width="40" height="20" fill="#333" rx="2"/>
                    <rect x="80" y="54" width="40" height="56" fill="rgba(200,168,75,0.4)" rx="2"/>
                    <text x="100" y="48" fill="#888" font-size="9" text-anchor="middle">7 days</text>
                    <text x="100" y="44" fill="#c8a84b" font-size="9" text-anchor="middle">65%</text>
                    <rect x="140" y="90" width="40" height="20" fill="#333" rx="2"/>
                    <rect x="140" y="34" width="40" height="76" fill="rgba(200,168,75,0.6)" rx="2"/>
                    <text x="160" y="28" fill="#888" font-size="9" text-anchor="middle">14 days</text>
                    <text x="160" y="24" fill="#c8a84b" font-size="9" text-anchor="middle">85%</text>
                    <rect x="200" y="90" width="40" height="20" fill="#333" rx="2"/>
                    <rect x="200" y="20" width="40" height="90" fill="#c8a84b" rx="2"/>
                    <text x="220" y="15" fill="#e0e0e0" font-size="9" text-anchor="middle" font-weight="700">28 days</text>
                    <text x="220" y="10" fill="#c8a84b" font-size="9" text-anchor="middle" font-weight="700">100%</text>
                    <rect x="260" y="90" width="40" height="20" fill="#333" rx="2"/>
                    <rect x="260" y="10" width="40" height="100" fill="rgba(76,175,125,0.5)" rx="2"/>
                    <text x="280" y="7" fill="#888" font-size="9" text-anchor="middle">1 year</text>
                    <text x="280" y="3" fill="#4caf7d" font-size="8" text-anchor="middle">125%+</text>
                    <!-- baseline -->
                    <line x1="10" y1="90" x2="340" y2="90" stroke="#333" stroke-width="1"/>
                    <!-- coat window marker -->
                    <line x1="215" y1="10" x2="215" y2="100" stroke="#c8a84b" stroke-width="1" stroke-dasharray="3,3"/>
                    <text x="340" y="35" fill="#c8a84b" font-size="9" font-weight="700">← Earliest</text>
                    <text x="340" y="47" fill="#c8a84b" font-size="9" font-weight="700">   coat date</text>
                  </svg>
                </div>
                <h3>The 28-Day Rule</h3>
                <p>The industry-standard minimum age before applying most resinous coatings is <strong>28 days</strong>. At this point, concrete has reached its design compressive strength. Applying coatings to "green" concrete risks delamination because the substrate is still shifting and the surface pH is extremely high.</p>
                <h3>Concrete pH & Saponification</h3>
                <p>Fresh concrete has a pH of <strong>12–13</strong> — highly alkaline. This matters because some epoxy chemistries undergo <strong>saponification</strong> on high-pH surfaces, a soap-forming reaction that destroys adhesion at the bond line. Surface pH should ideally be below 10 before applying most coating systems.</p>
                <div class="callout warn">
                  <h5>Rule of Thumb</h5>
                  <p>Always test surface pH with calibrated strips before coating. If pH is above 10, the concrete may still be too green or there may be moisture-related alkali migration.</p>
                </div>
              `,
              knowledgeCheck: [3, 4]
            },
            {
              id: 'm1-l2',
              title: 'Slab Properties & Laitance',
              duration: '15 min',
              objectives: ['Explain the role of w/c ratio in coating adhesion', 'Define laitance and explain why it must be removed', 'Describe how porosity affects mechanical bonding'],
              content: `
                <h3>Water-Cement (w/c) Ratio</h3>
                <p>The water-cement ratio is the mass of water divided by the mass of cement in a concrete mix. A typical residential/commercial slab has a w/c ratio of <strong>0.40–0.60</strong>.</p>
                <ul>
                  <li><strong>Lower w/c ratio (0.40):</strong> Denser concrete, fewer capillary pores, better for coating adhesion</li>
                  <li><strong>Higher w/c ratio (0.60):</strong> More porous concrete, can help primer penetration but reduces structural strength</li>
                </ul>
                <h3>Porosity & Surface Texture</h3>
                <p>Porosity and surface texture (profile) are the most important properties for mechanical bonding of thin-film coatings. A burnished or trowel-finished surface has near-zero open porosity — coatings cannot penetrate and lock in. Mechanical grinding is required to open the surface.</p>
                <h3>Laitance — The Silent Killer</h3>
                <p><strong>Laitance</strong> is a weak, friable layer of fine cement particles and water that rises to the concrete surface during finishing. It looks like regular concrete but has very low tensile strength.</p>
                <div class="callout danger">
                  <h5>Critical Warning</h5>
                  <p>Any coating bonded to laitance will delaminate when the laitance fails — regardless of how good the coating chemistry is. Laitance must be mechanically removed before any coating application.</p>
                </div>
                <div class="key-takeaways">
                  <h4>Key Takeaways</h4>
                  <ul>
                    <li>C-S-H is the binding compound formed during cement hydration</li>
                    <li>Wait 28 days before coating — it's the industry standard minimum</li>
                    <li>Fresh concrete is pH 12–13; test before coating</li>
                    <li>Laitance must be mechanically removed — it has no bond strength</li>
                    <li>Lower w/c ratio = denser concrete = better coating substrate</li>
                  </ul>
                </div>
              `,
              knowledgeCheck: [5]
            }
          ]
        },
        {
          id: 'm2',
          title: 'Module 2 — Surface Preparation',
          lessons: [
            {
              id: 'm2-l1',
              title: 'Why Surface Prep Is Everything',
              duration: '20 min',
              objectives: ['Explain why surface prep is the most critical step', 'Describe the water bead test', 'Understand ICRI CSP scale 1–10'],
              content: `
                <h3>The #1 Cause of Coating Failures</h3>
                <p>Industry data consistently shows that <strong>over 80% of coating failures are caused by inadequate surface preparation</strong> — not by defective materials. The most expensive coating system in the world will fail on a poorly prepared substrate.</p>
                <h3>The Water Bead Test</h3>
                <p>Before starting any prep work, pour a small amount of water on the slab. If the water <strong>absorbs immediately</strong>, the surface is open and porous — a good start. If the water <strong>beads up</strong>, the surface is sealed, contaminated, or over-troweled and requires mechanical profiling before coating.</p>
                <h3>ICRI Concrete Surface Profiles (CSP)</h3>
                <p>The <strong>International Concrete Repair Institute (ICRI)</strong> defines a standardized scale from CSP 1–10 for communicating surface roughness requirements.</p>
                <table class="comparison-table">
                  <thead><tr><th>CSP Level</th><th>Description</th><th>Method</th><th>Typical Use</th></tr></thead>
                  <tbody>
                    <tr><td>CSP 1–2</td><td>Very light, acid-etched feel</td><td>Acid etch, light grind</td><td>Thin film sealers only</td></tr>
                    <tr><td>CSP 3–5</td><td>Moderate roughness</td><td>Diamond grinding, shot blast</td><td>Epoxy/polyaspartic systems</td></tr>
                    <tr><td>CSP 6–9</td><td>Heavy, aggressive profile</td><td>Shot blast, scarify</td><td>Overlays, urethane cement</td></tr>
                    <tr><td>CSP 10</td><td>Maximum aggregate exposure</td><td>Scarify, bush-hammer</td><td>Heavy-duty overlays</td></tr>
                  </tbody>
                </table>
                <div class="callout info">
                  <h5>Rule of Thumb</h5>
                  <p>For standard 100% solids epoxy systems, target CSP 3–5. For self-leveling overlays, you need minimum CSP 6. Always verify with the product TDS.</p>
                </div>
              `,
              knowledgeCheck: [6, 7]
            },
            {
              id: 'm2-l2',
              title: 'Prep Methods & Silica Safety',
              duration: '20 min',
              objectives: ['Compare shot blasting vs. diamond grinding vs. acid etching', 'Know OSHA 29 CFR 1926.1153 requirements for silica', 'Explain correct overlap technique for grinding'],
              content: `
                <h3>Shot Blasting</h3>
                <p>Shot blasting uses centrifugal force to propel steel shot at the slab surface at high speed. It simultaneously <strong>cleans and profiles</strong> the surface and produces a highly consistent CSP 3–5 across large areas. It is the preferred method for large commercial and industrial floors.</p>
                <h3>Diamond Grinding</h3>
                <p>Diamond grinding uses rotating diamond-segmented heads to mechanically abrade the surface. It provides precise profile control and is ideal for smaller areas or areas where shot blasting isn't practical. <strong>Always overlap passes by 50%</strong> to prevent visible striping patterns in the finished floor.</p>
                <h3>Acid Etching — Least Preferred</h3>
                <p>Acid etching produces only a CSP 1–2 profile, reacts inconsistently based on the slab's w/c ratio, and leaves salt residue. <strong>Many manufacturers void warranties on acid-etched substrates.</strong> Use acid etching only as a last resort for light-duty sealers.</p>
                <div class="callout danger">
                  <h5>OSHA 29 CFR 1926.1153 — Silica Standard</h5>
                  <p>Concrete grinding is on OSHA's Table 1. Required engineering controls include HEPA-filtered vacuum systems attached to the grinding equipment, or wet grinding methods. <strong>Respirable crystalline silica (RCS)</strong> causes silicosis and lung cancer — there is no cure.</p>
                </div>
                <div class="key-takeaways">
                  <h4>Key Takeaways</h4>
                  <ul>
                    <li>80%+ of coating failures trace back to inadequate surface prep</li>
                    <li>Water bead test reveals sealed or contaminated surfaces</li>
                    <li>Shot blasting is the preferred method for large commercial areas (CSP 3–5)</li>
                    <li>Overlap grinding passes by 50% to prevent striping</li>
                    <li>Silica requires HEPA vacuum or wet suppression — OSHA Table 1</li>
                    <li>Acid etching = CSP 1–2 only, and voids many warranties</li>
                  </ul>
                </div>
              `,
              knowledgeCheck: [8, 9, 10, 11]
            }
          ]
        },
        {
          id: 'm3',
          title: 'Module 3 — Bond Mechanisms',
          lessons: [
            {
              id: 'm3-l1',
              title: 'How Coatings Bond to Concrete',
              duration: '16 min',
              objectives: ['Distinguish between mechanical and chemical bonding', 'Know what to do when you miss the recoat window', 'Understand ASTM D4541 pull-off adhesion test'],
              content: `
                <h3>Mechanical Bonding</h3>
                <p>Mechanical bonding occurs when coating material flows into the anchor profile (peaks and valleys) of a prepared concrete surface and physically interlocks with it upon curing — like Velcro at a microscopic level. The CSP profile directly controls the depth and geometry of these anchor points.</p>
                <h3>Chemical Bonding</h3>
                <p>Chemical bonding occurs between reactive coating components and surface hydroxyl (–OH) groups on concrete. Moisture-tolerant epoxy primers exploit this: their amine-curing agents react with –OH groups on damp concrete surfaces, forming chemical bonds rather than relying entirely on a dry mechanical substrate.</p>
                <h3>The Recoat Window</h3>
                <p>Every coating system has a <strong>recoat window</strong> — a period after application during which you can apply the next coat and achieve both mechanical and chemical intercoat adhesion. If the epoxy is still tacky (within the window), the topcoat will chemically bond.</p>
                <div class="callout danger">
                  <h5>Missed Recoat Window</h5>
                  <p>If the cured epoxy surface has exceeded the manufacturer's recoat window, you must <strong>mechanically abrade (scuff-sand)</strong> the entire surface before topcoating. Failure to do so will result in intercoat delamination.</p>
                </div>
                <h3>ASTM D4541 — Pull-Off Adhesion</h3>
                <p>ASTM D4541 is the standard test method for pull-off strength of coatings. A metal dolly is bonded to the coating surface; a portable tensile tester measures the force required to detach it. This gives a quantitative measurement of adhesion quality and is the gold standard for QC documentation.</p>
                <div class="key-takeaways">
                  <h4>Key Takeaways</h4>
                  <ul>
                    <li>Mechanical bonding = coating locks into CSP anchor points</li>
                    <li>Chemical bonding = amine groups react with surface OH groups</li>
                    <li>Missed recoat window requires mechanical abrasion before topcoat</li>
                    <li>ASTM D4541 measures pull-off adhesion strength</li>
                  </ul>
                </div>
              `,
              knowledgeCheck: [12, 13, 14, 15]
            }
          ]
        }
      ]
    },

    'coating-systems-application': {
      id: 'coating-systems-application',
      title: 'Coating Systems & Application',
      pathId: 'resinous-mastery',
      duration: '4 hrs',
      lessons: 16,
      desc: 'Coating types, mixing procedures, environmental requirements, and application techniques for professional resinous installations.',
      modules: [
        {
          id: 'm4',
          title: 'Module 4 — Resinous Coating Foundations',
          lessons: [
            {
              id: 'm4-l1',
              title: 'Two-Component System Fundamentals',
              duration: '20 min',
              objectives: ['Define induction time and explain why it matters', 'State the dew point differential requirement', 'Explain what happens with off-ratio mixing'],
              content: `
                <h3>Two-Component (2K) Systems</h3>
                <p>Resinous coatings are typically two-component systems: a <strong>Part A (resin)</strong> and a <strong>Part B (hardener/catalyst)</strong>. When combined, a chemical cross-linking reaction occurs that produces a hard, durable film. Both components are inert on their own — the reaction only begins when they are mixed together.</p>
                <h3>Induction Time (Sweat-In Time)</h3>
                <p><strong>Induction time</strong> is the waiting period after mixing Part A and Part B before application begins. This allows the initial chemical reaction to proceed and the material to reach optimal application viscosity. Always check the product TDS for the specified induction time — typically 10–30 minutes.</p>
                <div class="callout warn">
                  <h5>Skipping Induction Time</h5>
                  <p>Applying before the induction time is up means you're applying material that hasn't fully activated. This can result in poor film formation, soft spots, and adhesion failures.</p>
                </div>
                <h3>The 5°F Dew Point Rule</h3>
                <p>The substrate surface temperature must be at least <strong>5°F above the dew point temperature</strong>. Below this threshold, moisture condenses on the surface between the slab and the coating — causing immediate adhesion failure. Always check dew point before starting and monitor throughout the shift.</p>
                <h3>Off-Ratio Mixing — A Critical Failure</h3>
                <p>If Part A and Part B are mixed in the wrong ratio, not all reactive groups are consumed in the cross-linking reaction. The result is an under-cured film that is soft, tacky, lacks chemical resistance, and has poor adhesion. Off-ratio coatings almost always require complete removal — there is no fix.</p>
              `,
              knowledgeCheck: [16, 17, 18, 19]
            }
          ]
        },
        {
          id: 'm5',
          title: 'Module 5 — Coating System Types',
          lessons: [
            {
              id: 'm5-l1',
              title: 'Epoxy, Polyaspartic & MMA Systems',
              duration: '25 min',
              objectives: ['Know why epoxy cannot be used as a UV-exposed topcoat', 'Select the right system for thermal shock environments', 'Understand MMA\'s cold-weather advantage'],
              content: `
                <h3>Epoxy Systems</h3>
                <p>Standard aromatic epoxy coatings are the workhorse of industrial flooring. They provide excellent adhesion, chemical resistance, and compressive strength. However, <strong>aromatic epoxy chemistry yellows, chalks, and degrades under UV radiation</strong>. Epoxy must never be used as the final topcoat on any UV-exposed or exterior surface.</p>
                <h3>Polyaspartic Coatings</h3>
                <p>Polyaspartics are <strong>aliphatic polyurea-aspartic ester hybrids</strong>. The aliphatic chemistry provides UV stability (unlike aromatic epoxies). Key characteristics:</p>
                <ul>
                  <li>Fast cure — walkable in as little as 2–4 hours</li>
                  <li>UV stable — won't yellow or chalk</li>
                  <li>Excellent chemical resistance</li>
                  <li><strong>Pot life is temperature-sensitive</strong> — shortens dramatically in hot weather</li>
                </ul>
                <h3>Urethane Cement (Cementitious Urethane)</h3>
                <p>Urethane cement is specifically designed for <strong>thermal shock resistance</strong>. It handles boiling water, steam cleaning, and rapid temperature cycling that would cause standard epoxy systems to delaminate. It is the correct specification for commercial kitchens, food processing, and brewery floors.</p>
                <h3>MMA (Methyl Methacrylate)</h3>
                <p>MMA coatings cure via free-radical polymerization — not temperature-limited like amine-curing epoxies. MMA can cure to full strength at <strong>−30°F</strong> and achieves walkable cure in 1–2 hours. It is the only viable system for freezer floors and cold storage environments. It requires full ventilation and elimination of ignition sources due to flammability.</p>
                <table class="comparison-table">
                  <thead><tr><th>System</th><th>UV Stable?</th><th>Thermal Shock?</th><th>Cold Cure?</th><th>Pot Life</th></tr></thead>
                  <tbody>
                    <tr><td>Aromatic Epoxy</td><td style="color:#e5534b">No</td><td style="color:#e5534b">No</td><td style="color:#e5534b">No</td><td>Long</td></tr>
                    <tr><td>Cycloaliphatic Epoxy</td><td style="color:#c8a84b">Better</td><td style="color:#e5534b">No</td><td style="color:#e5534b">No</td><td>Long</td></tr>
                    <tr><td>Polyaspartic</td><td style="color:#4caf7d">Yes</td><td style="color:#e5534b">No</td><td style="color:#c8a84b">Partial</td><td>Short</td></tr>
                    <tr><td>Urethane Cement</td><td style="color:#c8a84b">Partial</td><td style="color:#4caf7d">Yes</td><td style="color:#e5534b">No</td><td>Medium</td></tr>
                    <tr><td>MMA</td><td style="color:#e5534b">No</td><td style="color:#c8a84b">Partial</td><td style="color:#4caf7d">Yes (−30°F)</td><td>Very short</td></tr>
                  </tbody>
                </table>
              `,
              knowledgeCheck: [20, 21, 22, 23, 24]
            }
          ]
        },
        {
          id: 'm6',
          title: 'Module 6 — Mixing Materials',
          lessons: [
            {
              id: 'm6-l1',
              title: 'Proper Mixing Technique',
              duration: '15 min',
              objectives: ['State the correct drill speed range for mixing', 'Explain the transfer bucket method', 'Know the minimum mix time'],
              content: `
                <h3>The Transfer Bucket Method</h3>
                <p>Always mix in a <strong>dedicated transfer bucket</strong>, never in the original manufacturer containers. Original containers have unmixed material settled in corners, bottom seams, and along the sides from manufacturing and settling. Mixing in the original container incorporates this unmixed residue into your batch, causing soft spots, fisheyes, and delamination.</p>
                <h3>Drill Speed — Low and Slow</h3>
                <p>Maximum recommended drill speed for mixing most epoxy, polyaspartic, and primer systems is <strong>300–400 RPM</strong>. Higher speeds create a vortex that whips air into the material, forming micro-bubbles that transfer to the floor and appear as outgassing pits or fisheyes in the cured coating.</p>
                <h3>Minimum Mix Time</h3>
                <p>The industry standard minimum mix time is <strong>2–3 minutes of continuous mixing</strong>. Set a timer on every batch. Under field conditions, 90 seconds feels like 3 minutes — undermixing is a leading cause of soft spots that manufacturers won't cover under warranty.</p>
                <div class="callout warn">
                  <h5>Exothermic Warning</h5>
                  <p>If the mixing bucket feels warm to the touch, the cross-linking reaction is accelerating. <strong>Spread and apply immediately</strong> — keeping material in a thick mass in a bucket dramatically accelerates the reaction. If the material shows resistance to stirring, it's gelling. Discard it.</p>
                </div>
              `,
              knowledgeCheck: [25, 26, 27, 28]
            }
          ]
        },
        {
          id: 'm7',
          title: 'Module 7 — Application Techniques',
          lessons: [
            {
              id: 'm7-l1',
              title: 'Roller Application & Back-Rolling',
              duration: '18 min',
              objectives: ['State the correct roller nap for 100% solids epoxy', 'Explain the purpose of back-rolling', 'Describe the Cabosil paste method for vertical work'],
              content: `
                <h3>Roller Selection</h3>
                <p>For applying 100% solids epoxy over a diamond-ground surface, use a <strong>3/8" nap roller cover</strong>. A 1/4" nap holds too little material for even distribution on profiled concrete. A 3/4" or 1" nap holds too much and creates excess mil thickness and roller texture issues.</p>
                <h3>Back-Rolling</h3>
                <p>Back-rolling at 90° to the initial application pass eliminates roller marks, levels material that was poured unevenly, and ensures a consistent wet film thickness across the section. It should be done immediately while the material is still fluid — don't let it flash off first.</p>
                <h3>Cabosil (Fumed Silica) Paste</h3>
                <p>Mixing Cabosil (fumed silica) into epoxy at approximately 5–8% by weight creates a <strong>non-sag paste</strong> similar in consistency to peanut butter. This is ideal for vertical applications — cove bases, step nosings, and crack filling — where standard liquid epoxy would run before curing.</p>
                <h3>Flake Application</h3>
                <p>Decorative vinyl flake chips should be thrown <strong>from above head height in a wide upward arc</strong>, like throwing confetti. This allows chips to slow, spread out, and fall flat onto the wet surface. Throwing from a low angle causes chips to skip and embed edge-first, creating uneven coverage and poor topcoat encapsulation.</p>
                <div class="key-takeaways">
                  <h4>Key Takeaways</h4>
                  <ul>
                    <li>3/8" nap roller for 100% solids epoxy on prepared concrete</li>
                    <li>Back-roll at 90° immediately after initial application pass</li>
                    <li>Cabosil at 5–8% by weight creates non-sag vertical paste</li>
                    <li>Epoxy mortar ratio: 3 parts sand to 1 part epoxy by weight</li>
                    <li>Throw flake from above head height in a wide arc</li>
                    <li>After full broadcast cure: scrape, then grind flat before topcoat</li>
                  </ul>
                </div>
              `,
              knowledgeCheck: [29, 30, 31, 32, 33, 34, 35]
            }
          ]
        }
      ]
    },

    'moisture-specialty': {
      id: 'moisture-specialty',
      title: 'Moisture, Overlays & Specialty Systems',
      pathId: 'resinous-mastery',
      duration: '3 hrs',
      lessons: 10,
      desc: 'Moisture vapor barriers, self-leveling overlays, pigment systems, and chemical resistance specifications.',
      modules: [
        {
          id: 'm8',
          title: 'Module 8 — Moisture & MVB Systems',
          lessons: [
            {
              id: 'm8-l1',
              title: 'Moisture Testing & Vapor Barriers',
              duration: '22 min',
              objectives: ['Distinguish ASTM F1869 from ASTM F2170', 'State the sensor depth for in-situ RH testing', 'Explain osmotic delamination under MVBs'],
              content: `
                <h3>Why Moisture Destroys Coatings</h3>
                <p>Moisture vapor traveling upward through a concrete slab is the single most common cause of coating delamination on on-grade and below-grade slabs. Even after a slab appears dry, moisture vapor emission can continue for years.</p>
                <h3>Calcium Chloride Test (ASTM F1869)</h3>
                <p>The calcium chloride test measures the <strong>Moisture Vapor Emission Rate (MVER)</strong> in pounds per 1,000 sq ft per 24 hours. A sealed dish of calcium chloride is placed on the slab for 60–72 hours; the weight gain indicates how much moisture is being emitted. Typical acceptable limit for most coating systems: <strong>3–5 lbs/1,000 sf/24 hr</strong>.</p>
                <h3>In-Situ RH Test (ASTM F2170) — Gold Standard</h3>
                <p>ASTM F2170 involves drilling holes to <strong>40% of slab depth</strong>, inserting humidity sensors, and allowing 72 hours of equilibration before reading. This is the gold standard for concrete moisture assessment because it measures conditions at the depth most predictive of surface moisture behavior after coating.</p>
                <div class="callout warn">
                  <h5>Why 40% Depth?</h5>
                  <p>Research shows that 40% of slab depth best represents the moisture condition at the slab surface after the coating is applied and the surface dries. Readings taken at the surface or too shallow are not representative.</p>
                </div>
                <h3>Moisture Vapor Barriers (MVBs)</h3>
                <p>MVBs are applied in <strong>two coats at 90° to each other</strong>. The perpendicular second coat covers any pinholes in the first coat — open pinholes are vapor pathways that defeat the system entirely.</p>
                <div class="callout danger">
                  <h5>Osmotic Delamination</h5>
                  <p>If an MVB is applied over a contaminated or poorly prepped substrate, moisture vapor can accumulate beneath it. Osmotic pressure builds until the hydrostatic force causes the MVB — and everything above it — to delaminate in dramatic bubbles or sheets. Prep quality is just as critical under an MVB as under any other system.</p>
                </div>
              `,
              knowledgeCheck: [36, 37, 38, 39, 40]
            }
          ]
        },
        {
          id: 'm9',
          title: 'Module 9 — Self-Leveling Overlays',
          lessons: [
            {
              id: 'm9-l1',
              title: 'SLC Application Fundamentals',
              duration: '20 min',
              objectives: ['Explain why primer is mandatory before SLC', 'Describe the spike roller\'s function', 'Know the consequence of adding excess water'],
              content: `
                <h3>Primer — Non-Negotiable</h3>
                <p>Primer is absolutely mandatory before self-leveling concrete (SLC). Without primer, the dry, porous concrete substrate rapidly absorbs water from the SLC mix, causing pinholes, bubbling, and bond failure. Primer seals the substrate and provides a chemically receptive surface.</p>
                <h3>The Spike Roller</h3>
                <p>The spike roller is rolled through fresh SLC immediately after pouring. The spikes penetrate the material, releasing trapped air bubbles (which would become pinholes) and helping to blend the leading edge of one pour into the previous pour for a monolithic surface. Do not skip this step.</p>
                <h3>Never Add Excess Water</h3>
                <p>Adding extra water to SLC to improve workability raises the w/c ratio beyond design spec. This produces a weaker, more porous material that dusts, cracks, and delaminate. <strong>Never exceed the manufacturer's specified water quantity.</strong></p>
                <h3>Crew Roles for Large Pours (1,000+ sq ft)</h3>
                <p>SLC cannot be slowed down once started. Large pours require dedicated roles: dedicated mixer, dedicated pourer/gauge raker, spike roller operator, and a materials runner. Slowing the operation allows the leading edge to begin gelling before the adjacent pour can knit to it.</p>
              `,
              knowledgeCheck: [41, 42, 43, 44, 45]
            }
          ]
        }
      ]
    },

    'safety-qc': {
      id: 'safety-qc',
      title: 'Safety, QC & Troubleshooting',
      pathId: 'resinous-mastery',
      duration: '2.5 hrs',
      lessons: 10,
      desc: 'Coatings safety, SDS sections, PPE requirements, QC documentation, and systematic troubleshooting of common coating failures.',
      modules: [
        {
          id: 'm12',
          title: 'Module 12 — Coatings Safety',
          lessons: [
            {
              id: 'm12-l1',
              title: 'SDS Navigation & PPE Requirements',
              duration: '22 min',
              objectives: ['Identify SDS Section 8 and its contents', 'Know the correct glove material for epoxy work', 'Understand epoxy sensitization and why it\'s permanent'],
              content: `
                <h3>SDS Section 8 — The Most Important Section</h3>
                <p><strong>Section 8 (Exposure Controls / Personal Protection)</strong> of the GHS Safety Data Sheet contains everything you need to protect yourself: Occupational Exposure Limits (TLV, PEL, REL), engineering control requirements, and specific PPE recommendations including respirator type, cartridge selection, glove material, and eye protection.</p>
                <h3>Respiratory Protection</h3>
                <p>For combined coating application and concrete grinding operations, use an <strong>OV/P100 combination cartridge</strong>: the OV (Organic Vapor) cartridge absorbs coating vapors and solvents, while the P100 particulate filter captures 99.97% of airborne particles including respirable silica.</p>
                <h3>Glove Selection</h3>
                <p>Use <strong>nitrile gloves (disposable, chemical-resistant)</strong> when handling epoxy resins and amine hardeners. Latex gloves can cause latex sensitization and have poor epoxy resistance. Cotton allows chemical absorption. Thin vinyl has low chemical resistance. Change nitrile gloves frequently — breakthrough occurs with extended contact.</p>
                <h3>Epoxy Sensitization — Permanent</h3>
                <p>Epoxy sensitization is a type IV delayed hypersensitivity reaction. Once the immune system is sensitized, even trace exposures can trigger severe allergic reactions indefinitely. <strong>There is no cure, no desensitization treatment.</strong> The only management strategy is complete avoidance — which ends careers. Prevent sensitization through consistent PPE use from day one.</p>
                <div class="callout danger">
                  <h5>MMA Special Hazards</h5>
                  <p>MMA monomers have a strong, sweet odor and a relatively low flash point. Before any MMA application: evacuate the space, ensure full ventilation, and remove all ignition sources. Full-face respirators required.</p>
                </div>
              `,
              knowledgeCheck: [56, 57, 58, 59, 60]
            }
          ]
        },
        {
          id: 'm13',
          title: 'Module 13 — Troubleshooting & QC',
          lessons: [
            {
              id: 'm13-l1',
              title: 'Common Failures & Root Causes',
              duration: '25 min',
              objectives: ['Identify the cause of fisheyes/cratering', 'Distinguish amine blush from other surface defects', 'Explain outgassing and how to prevent it'],
              content: `
                <h3>Fisheyes & Cratering</h3>
                <p>Fisheyes and cratering are caused by <strong>surface tension differences between the coating and a contaminant</strong>. Silicone (from WD-40, mold release, furniture polish) is the most common culprit. The coating retracts away from contaminated areas, leaving circular craters. Prevention: degrease all surfaces and never allow silicone products near coating areas.</p>
                <h3>Amine Blush</h3>
                <p>Amine blush appears as a <strong>waxy, greasy, or milky film</strong> on the surface of curing epoxy. It is caused by the amine hardener (Part B) reacting with atmospheric moisture and CO₂, forming carbamate salts. High relative humidity (above 70–80%) accelerates amine blush. It impairs intercoat adhesion and must be removed by washing with clean water before recoating.</p>
                <h3>Outgassing / Bubbling</h3>
                <p>As a concrete slab <strong>warms</strong> (from sunlight, HVAC, or heaters), the air in surface pores expands and pushes upward through the wet coating, creating bubbles. The fix: apply coating when substrate temperature is <strong>stable or slightly dropping</strong>. Never apply to a rising substrate temperature.</p>
                <h3>Soft/Tacky Coating at 24 Hours</h3>
                <p>Three most likely causes: (1) off-ratio mixing; (2) application below minimum temperature; (3) expired or contaminated hardener. The coating usually requires full removal and reapplication.</p>
                <h3>QC Documentation Package</h3>
                <p>At project turnover, deliver: timestamped photos of each phase, moisture test results, ambient condition logs (temp, RH, dew point, dew point differential), product batch/lot numbers, application records, and a signed QC checklist. This documentation is your protection if a warranty dispute arises.</p>
                <div class="key-takeaways">
                  <h4>Key Takeaways</h4>
                  <ul>
                    <li>Fisheyes = silicone or oil contamination on the substrate</li>
                    <li>Amine blush = waxy film from high-humidity cure; wash off before recoat</li>
                    <li>Outgassing = rising substrate temperature pushing air through wet coating</li>
                    <li>Soft coating = off-ratio, cold, or expired hardener</li>
                    <li>WFT checks every 5–10 minutes during application</li>
                    <li>QC package = photos + moisture logs + ambient logs + batch numbers + signed checklist</li>
                  </ul>
                </div>
              `,
              knowledgeCheck: [61, 62, 63, 64, 65, 66, 67, 68, 69]
            }
          ]
        }
      ]
    }
  };

  // ── ALL 80 QUESTIONS (from the Resinous Coatings Mastery Program exam) ──────
  const QUESTIONS = [
    // MODULE 1 — Concrete Fundamentals (Q0–Q5)
    {m:"Module 01",mt:"Concrete Fundamentals",q:"What is the primary binding compound formed when portland cement undergoes hydration?",opts:["Calcium carbonate (CaCO₃)","Calcium silicate hydrate (C-S-H)","Silica dioxide (SiO₂)","Calcium hydroxide only"],a:1,exp:"The hydration reaction between cement and water forms calcium silicate hydrate (C-S-H), the gel-like compound that provides concrete's compressive strength and binds the aggregates together."},
    {m:"Module 01",mt:"Concrete Fundamentals",q:"A typical residential concrete slab has a water-cement (w/c) ratio in what range?",opts:["0.10 – 0.25","0.40 – 0.60","0.70 – 0.90","1.00 – 1.20"],a:1,exp:"Most residential and commercial slabs have a w/c ratio of 0.40–0.60. Lower ratios produce denser, stronger concrete with fewer capillary pores, which is better for coating adhesion."},
    {m:"Module 01",mt:"Concrete Fundamentals",q:"What is the industry-standard minimum age for concrete before applying most resinous coatings?",opts:["7 days","14 days","21 days","28 days"],a:3,exp:"The 28-day rule is the industry-standard minimum. At 28 days, concrete reaches its design compressive strength. Some moisture-tolerant primers can be applied earlier, but always verify with the product TDS."},
    {m:"Module 01",mt:"Concrete Fundamentals",q:"What pH range is typical for fresh concrete?",opts:["4 – 6","7 – 9","10 – 11","12 – 13"],a:3,exp:"Fresh concrete is highly alkaline, with a pH of 12–13. This high pH can cause saponification of epoxy coatings, which destroys adhesion. Surface pH should ideally be below 10 before applying most coating systems."},
    {m:"Module 01",mt:"Concrete Fundamentals",q:"Which concrete property most directly affects whether a thin-film coating will physically lock into the surface?",opts:["Compressive strength","Thermal conductivity","Porosity and surface texture","Slump value"],a:2,exp:"Porosity and surface texture (profile) are critical for mechanical bonding. A burnished or trowel-finished surface has near-zero open porosity, so coatings cannot penetrate and lock — mechanical grinding is required."},
    {m:"Module 01",mt:"Concrete Fundamentals",q:"What is laitance, and why must it be removed before coating?",opts:["A curing compound brand; it must be neutralized","The coarse aggregate layer; it is too hard for adhesion","A weak surface layer of fine cement particles and water; it lacks bond strength","Efflorescence from moisture; it can be painted over"],a:2,exp:"Laitance is a weak, friable layer of fine cement particles, water, and fines that rises to the surface during finishing. It must be mechanically removed because coatings bonded to laitance will delaminate when the laitance fails."},
    // MODULE 2 — Surface Preparation (Q6–Q13)
    {m:"Module 02",mt:"Surface Preparation",q:"Which test is used to quickly assess whether a concrete surface has been sealed or contaminated?",opts:["pH strip test","Schmidt hammer rebound","Water absorption (water bead) test","Calcium chloride MVER test"],a:2,exp:"The water absorption (bead) test is fast and simple: water dropped on an open, porous surface will absorb immediately. If it beads up, the surface is sealed, contaminated, or over-troweled and requires mechanical profiling before coating."},
    {m:"Module 02",mt:"Surface Preparation",q:"What does ICRI stand for in the context of concrete surface profiles?",opts:["Institute of Coating Research International","International Concrete Repair Institute","Integrated Coating & Resinous Index","International Chemical Resistance Institute"],a:1,exp:"ICRI stands for International Concrete Repair Institute. Their technical guideline 310.2 defines the Concrete Surface Profile (CSP) scale from 1–10, which is the industry-standard language for communicating surface roughness requirements."},
    {m:"Module 02",mt:"Surface Preparation",q:"Which surface preparation method typically produces the most consistent and repeatable profile over large commercial areas?",opts:["Acid etching","Hand grinding","Shot blasting","Scarifying"],a:2,exp:"Shot blasting uses centrifugal force to propel steel shot at the surface. It cleans and profiles simultaneously, and produces a highly consistent CSP 3–5 across large areas. It is the preferred method for large commercial and industrial floors."},
    {m:"Module 02",mt:"Surface Preparation",q:"What minimum CSP is generally required before applying a self-leveling concrete overlay?",opts:["CSP 1","CSP 2–3","CSP 4–5","CSP 6+"],a:3,exp:"Self-leveling concrete overlays require a minimum CSP 6 or higher. The aggressive profile is necessary for the cementitious overlay material to achieve adequate mechanical bonding to the substrate."},
    {m:"Module 02",mt:"Surface Preparation",q:"Why is acid etching considered the least preferred method for professional resinous coating applications?",opts:["It is too expensive for most projects","It produces an inconsistent profile, leaves salt residue, and many manufacturers void warranties on acid-etched substrates","It is only available in industrial quantities","It requires a 72-hour cure before coating can be applied"],a:1,exp:"Acid etching produces only a CSP 1–2 profile, reacts inconsistently based on the slab's w/c ratio, leaves salt residue, and many coating manufacturers explicitly void warranties on acid-etched surfaces."},
    {m:"Module 02",mt:"Surface Preparation",q:"According to OSHA 29 CFR 1926.1153, what engineering controls are required when grinding concrete?",opts:["A warning sign posted at the entrance","HEPA vacuum or wet suppression methods","A dust mask rated N95","Ventilation fans pointing away from the work area"],a:1,exp:"OSHA 29 CFR 1926.1153 (the silica standard) places concrete grinding on Table 1. Required engineering controls include HEPA-filtered vacuum systems attached to the grinding equipment, or wet grinding methods that suppress respirable silica dust."},
    {m:"Module 02",mt:"Surface Preparation",q:"When using a diamond grinder, overlapping passes by what percentage prevents visible stripe patterns in the finished floor?",opts:["10%","25%","50%","75%"],a:2,exp:"Overlapping grinding passes by at least 50% ensures even material removal and prevents visible striping or banding in the profile, which would show through thin coating systems."},
    {m:"Module 02",mt:"Surface Preparation",q:"What is the primary hazard associated with concrete surface preparation that requires respirator use?",opts:["Carbon monoxide from diesel equipment","Respirable crystalline silica (RCS)","Hydrogen sulfide from the slab","Benzene vapors from old adhesives"],a:1,exp:"Respirable crystalline silica (RCS) is the primary hazard. Concrete typically contains 15–25% free silica, and grinding or scarifying creates fine particles small enough to penetrate deep into the lungs, causing silicosis, lung cancer, and other irreversible diseases."},
    // MODULE 3 — Bond Mechanisms (Q14–Q17)
    {m:"Module 03",mt:"Bond Mechanisms",q:"What type of bonding occurs when a coating mechanically locks into the peaks and valleys of a profiled concrete surface?",opts:["Chemical bonding","Electrostatic bonding","Mechanical bonding","Ionic bonding"],a:2,exp:"Mechanical bonding occurs when coating material flows into the anchor profile of the substrate and physically interlocks with it upon curing — like Velcro at the microscopic level. The CSP directly controls the depth and geometry of these anchor points."},
    {m:"Module 03",mt:"Bond Mechanisms",q:"You applied an epoxy basecoat 36 hours ago and the manufacturer's recoat window is 24 hours. To apply the topcoat now, you must:",opts:["Apply immediately — full cure is better than green coat","Thin the topcoat with solvent to improve penetration","Mechanically abrade (scuff-sand) the cured epoxy surface first","Apply a bonding primer only on the perimeter"],a:2,exp:"Once a coating has exceeded the manufacturer's recoat window, the chemical bond opportunity is gone. You must mechanically abrade the cured surface (scuff-sand or light grind) to create a mechanical anchor profile for the topcoat to bond to."},
    {m:"Module 03",mt:"Bond Mechanisms",q:"Which statement best describes why moisture-tolerant epoxy primers can bond to slightly damp concrete?",opts:["They contain solvents that displace surface water","Their amine-curing agents react chemically with surface hydroxyl groups on concrete","They create a physical film barrier over the moisture","They are water-based and therefore miscible with water"],a:1,exp:"Moisture-tolerant epoxy primers use amine-curing agents that can chemically react with surface hydroxyl groups (–OH groups) present on damp concrete, forming a chemical bond rather than relying entirely on a dry mechanical substrate."},
    {m:"Module 03",mt:"Bond Mechanisms",q:"The ASTM D4541 test measures:",opts:["Concrete surface pH","Pull-off adhesion strength","Moisture vapor emission rate","Compressive strength of the coating"],a:1,exp:"ASTM D4541 is the standard test method for pull-off strength of coatings using a portable adhesion tester. It directly measures the force required to detach a coating from the substrate, providing a quantitative measurement of adhesion quality."},
    // MODULE 4 — Coating Foundations (Q18–Q22)
    {m:"Module 04",mt:"Resinous Coating Foundations",q:"The 'induction time' for a two-component resinous coating refers to:",opts:["The time required to allow Part A to settle before mixing","The waiting period after combining Part A and Part B before application begins","The minimum temperature hold time before coating","The cure time before foot traffic is allowed"],a:1,exp:"Induction time (also called sweat-in time) is the waiting period after mixing Part A and Part B together before application begins. This allows the initial chemical reaction to proceed and the material to reach optimal application viscosity. Always check the TDS for the specified induction time."},
    {m:"Module 04",mt:"Resinous Coating Foundations",q:"What is the minimum substrate-to-dew point temperature differential required before applying resinous coatings?",opts:["2°F","3°F","5°F","10°F"],a:2,exp:"The substrate surface temperature must be at least 5°F above the dew point temperature. Below this threshold, moisture can condense on the surface between the slab and the coating, causing immediate adhesion failure."},
    {m:"Module 04",mt:"Resinous Coating Foundations",q:"An applicator is working when the ambient temperature is 85°F and relative humidity is 72%. Why is this a concern for coating application?",opts:["High temperature alone prevents epoxy from curing","High humidity can cause amine blush on epoxy surfaces during cure","Humidity above 70% automatically voids manufacturer warranties","High temperature reduces pot life to zero"],a:1,exp:"High relative humidity (above 70–80%) creates risk of amine blush — a reaction between moisture in the air and the amine hardener on the surface of curing epoxy. This creates a waxy, oily film that impairs intercoat adhesion if not addressed."},
    {m:"Module 04",mt:"Resinous Coating Foundations",q:"What happens when a two-component coating is mixed with the wrong Part A to Part B ratio?",opts:["The pot life doubles, giving more working time","The color changes, alerting the applicator","Incomplete curing occurs, resulting in a soft, tacky, or chemically deficient film","The coating immediately gels and cannot be applied"],a:2,exp:"An off-ratio mix means not all reactive groups are consumed in the cross-linking reaction, leaving unreacted components in the cured film. This results in a soft, tacky, under-cured coating that lacks chemical resistance, hardness, and adhesion."},
    {m:"Module 04",mt:"Resinous Coating Foundations",q:"In cold weather coating work, why should the space be heated 24–48 hours before application rather than just on the day of coating?",opts:["To allow the heaters to reach full operating temperature","To stabilize the concrete slab temperature throughout its depth, not just at the surface","To allow time for moisture to evaporate from the walls","To comply with OSHA thermal comfort regulations"],a:1,exp:"Concrete has significant thermal mass. Heating only on the day of application warms the air and the top surface, but the slab core may remain cold. Cold slab core means cold surface temperatures will return quickly. Heating 24–48 hours ahead stabilizes the slab temperature throughout its depth."},
    // MODULE 5 — Coating System Types (Q23–Q31)
    {m:"Module 05",mt:"Coating System Types",q:"Why should epoxy coatings NEVER be used as a final topcoat on UV-exposed or exterior surfaces?",opts:["Epoxy is water-soluble and will wash away in rain","Aromatic epoxy chemistry yellows, chalks, and degrades under UV radiation","Epoxy topcoats are too slippery for outdoor use","Epoxy cannot be applied at temperatures below 90°F"],a:1,exp:"Standard aromatic epoxy chemistries degrade under UV radiation, causing yellowing, chalking, and loss of gloss. On any UV-exposed surface, an aliphatic topcoat (polyaspartic or aliphatic urethane) must be applied to protect the epoxy basecoat and maintain appearance."},
    {m:"Module 05",mt:"Coating System Types",q:"Which coating system is the best choice for a commercial kitchen floor subject to boiling water spillage, steam cleaning, and thermal shock?",opts:["100% solids epoxy","Standard polyaspartic topcoat","Urethane cement (cementitious urethane)","Water-based epoxy primer"],a:2,exp:"Urethane cement (cementitious urethane) is specifically designed for thermal shock resistance. It handles boiling water, steam cleaning, and rapid temperature cycling that would cause standard epoxy systems to delaminate due to differential thermal expansion."},
    {m:"Module 05",mt:"Coating System Types",q:"What is the key advantage of MMA (Methyl Methacrylate) coating systems over epoxy and polyaspartic systems?",opts:["Lower material cost per square foot","Ability to cure in temperatures as low as −30°F","No mixing required — single-component system","Better UV stability than all other resinous systems"],a:1,exp:"MMA coatings cure via free-radical polymerization, which is not temperature-limited like the amine-curing reactions in epoxy. MMA can cure to full strength at −30°F and achieves walkable cure in 1–2 hours regardless of temperature — making it the only viable system for freezer and cold storage environments."},
    {m:"Module 05",mt:"Coating System Types",q:"Polyaspartic coatings are best described as:",opts:["Water-based acrylic systems with added UV inhibitors","Solvent-based aromatic urethanes","Aliphatic polyurea-aspartic ester hybrids","Single-component moisture-curing polyurethanes"],a:2,exp:"Polyaspartic coatings are aliphatic polyurea-aspartic ester hybrids. The aliphatic chemistry provides UV stability (unlike aromatic epoxies), and the polyurea-aspartic ester chemistry provides fast cure times, excellent adhesion, and good chemical resistance."},
    {m:"Module 05",mt:"Coating System Types",q:"On a hot summer day (90°F), an applicator is using a fast-cure polyaspartic with a stated pot life of 25 minutes at 77°F. What should they expect?",opts:["Pot life will be unchanged since it is a measured property","Pot life will roughly double due to the heat","Pot life will be significantly shorter — potentially 10–15 minutes or less","Pot life will extend because higher temperature improves flow"],a:2,exp:"Pot life shortens with increasing temperature. The chemical reaction rate roughly doubles with every 10°C (18°F) increase. At 90°F vs. the rated 77°F, pot life can be reduced by 40–60%. Applicators must cut batch sizes and work faster, or use a slow-cure version in hot conditions."},
    {m:"Module 05",mt:"Coating System Types",q:"A client wants an industrial floor with 80 mils of 100% solids epoxy body coat, quartz broadcast, and an aliphatic urethane topcoat. What is the primary function of the urethane topcoat?",opts:["To add thickness to the system","To provide the chemical bond between the quartz and the epoxy","To provide UV stability and an abrasion-resistant wear surface","To replace the need for a primer coat"],a:2,exp:"In a multi-layer system, the aliphatic urethane topcoat serves two critical functions: UV protection (preventing the aromatic epoxy body coat from yellowing if exposed to light) and providing a durable, chemical-resistant wear surface."},
    {m:"Module 05",mt:"Coating System Types",q:"Water-based epoxy primers are most commonly specified because they:",opts:["Provide the highest adhesion strength of any primer type","Have the lowest VOC content and simplest cleanup, suitable for moisture-tolerant primer applications","Cure faster than 100% solids epoxy at all temperatures","Are the only primer type compatible with polyaspartic topcoats"],a:1,exp:"Water-based epoxy primers are primarily specified for their low VOC content, easy water cleanup, reduced odor, and moisture tolerance. They are ideal for occupied spaces, low-odor applications, and primers over slightly damp concrete."},
    {m:"Module 05",mt:"Coating System Types",q:"For an exterior concrete patio exposed to full sunlight, which complete system is most appropriate?",opts:["100% solids epoxy basecoat + epoxy topcoat","Acid etch + water-based epoxy sealer","Epoxy basecoat + aliphatic polyaspartic topcoat","Urethane cement system with no topcoat"],a:2,exp:"Exterior UV-exposed surfaces require an aliphatic topcoat. Epoxy basecoat provides the adhesion and build, while an aliphatic polyaspartic topcoat provides UV stability, weather resistance, and color retention."},
    {m:"Module 05",mt:"Coating System Types",q:"Cycloaliphatic epoxies are preferred over standard bisphenol A epoxies in certain applications because they:",opts:["Cure at lower temperatures","Have better UV resistance due to their aliphatic ring structure","Are single-component systems","Cost significantly less per gallon"],a:1,exp:"Cycloaliphatic epoxies have an aliphatic ring structure rather than the aromatic ring in standard bisphenol A (BPA) epoxies. This aliphatic structure provides meaningfully better UV resistance and slower yellowing — making them suitable for light-exposed interior applications."},
    // MODULE 6 — Mixing Materials (Q32–Q35)
    {m:"Module 06",mt:"Mixing Materials",q:"Why should resinous coatings always be mixed in a dedicated transfer bucket rather than in the original manufacturer containers?",opts:["Transfer buckets are required by OSHA regulation","Mixing in original containers leaves unmixed material in corners and seams, introducing defects","Transfer buckets are always larger, providing more mixing volume","The original containers may melt from the exothermic reaction"],a:1,exp:"Original manufacturer containers have residue settled in corners, bottom seams, and along the sides. Mixing in the original container incorporates this unmixed residue into your batch, causing soft spots, fisheyes, and delamination."},
    {m:"Module 06",mt:"Mixing Materials",q:"What is the maximum recommended drill speed for mixing most epoxy, polyaspartic, and primer systems?",opts:["100–200 RPM","300–400 RPM","600–800 RPM","1,000–1,200 RPM"],a:1,exp:"300–400 RPM maximum is the correct range for mixing resinous coatings. Higher speeds create a vortex that whips air into the material, forming micro-bubbles that transfer to the floor and appear as outgassing pits or fisheyes in the cured coating."},
    {m:"Module 06",mt:"Mixing Materials",q:"The standard industry minimum mix time for a two-component resinous coating batch is:",opts:["30 seconds","1 minute","2–3 minutes","5–7 minutes"],a:2,exp:"2–3 minutes of continuous mixing is the industry standard minimum. Applicators should set a timer on every single batch — 90 seconds feels like 3 minutes under field conditions. Undermixing is a leading cause of soft spots that manufacturers deny warranty claims for."},
    {m:"Module 06",mt:"Mixing Materials",q:"A bucket of mixed epoxy feels warm to the touch during mixing. What does this indicate and what should the applicator do?",opts:["Normal — the friction from the mixer heats the material; proceed with application","The Part B is defective; discard and open a new container","The material is beginning an exothermic cure reaction and may be approaching the end of its pot life — spread and apply immediately","The mixing speed is too high; reduce to 100 RPM and continue mixing for 5 more minutes"],a:2,exp:"Warmth in the mixing bucket indicates the exothermic cross-linking reaction is progressing. The material is consuming pot life rapidly. The correct response is to immediately pour and spread the material. If the material shows resistance to stirring, it is gelling and must be discarded."},
    // MODULE 7 — Application Techniques (Q36–Q42)
    {m:"Module 07",mt:"Application Techniques",q:"When applying a 100% solids epoxy with a roller, back-rolling serves what primary purpose?",opts:["To add thickness to the wet film","To eliminate roller marks and ensure even mil thickness across the surface","To activate the chemical cure of the epoxy","To blend the flake broadcast into the epoxy"],a:1,exp:"Back-rolling at 90 degrees to the initial application pass eliminates roller marks, levels material that has been poured unevenly, and ensures a consistent wet film thickness across the section."},
    {m:"Module 07",mt:"Application Techniques",q:"What is the correct nap roller cover for applying 100% solids epoxy over a diamond-ground concrete surface?",opts:["1/4\" nap (smooth surface roller)","3/8\" nap","3/4\" nap","1\" nap (thick texture roller)"],a:1,exp:"A 3/8\" nap roller is the standard for smooth to moderately profiled substrates when applying 100% solids epoxy. A 1/4\" nap holds too little material for even distribution on profiled concrete. A 3/4\" or 1\" nap holds too much material and creates excess mil thickness."},
    {m:"Module 07",mt:"Application Techniques",q:"Cabosil (fumed silica) mixed into epoxy at approximately 5–8% by weight creates what useful product?",opts:["A fast-curing primer system","A non-sag paste suitable for vertical cove base and step nosing application","A self-leveling underlayment","An anti-static topcoat additive"],a:1,exp:"At 5–8% by weight, Cabosil (fumed silica) thickens epoxy to a non-sag consistency similar to peanut butter. This is ideal for vertical applications such as cove bases, step nosings, and crack filling."},
    {m:"Module 07",mt:"Application Techniques",q:"What is the proper mix ratio for an epoxy mortar used for void and crack filling?",opts:["1 part sand to 3 parts epoxy (by weight)","3 parts sand to 1 part epoxy (by weight)","Equal parts sand and epoxy","1 part sand to 10 parts epoxy"],a:1,exp:"A 3:1 ratio of silica sand to epoxy by weight produces a pourable, workable mortar that is strong, cost-effective, and provides excellent void and crack fill."},
    {m:"Module 07",mt:"Application Techniques",q:"During a full broadcast flake application, after the epoxy has cured, what process is required before topcoating?",opts:["Acid wash to remove surface salts","Scrape and grind back the broadcast to remove loose chips and create a flat surface","Apply a bonding primer over the flake to improve topcoat adhesion","No preparation is needed — apply topcoat directly over broadcast"],a:1,exp:"Full broadcast creates a rough, uneven surface with loose chips. Before topcoating, the surface must be scraped to remove loose chips, then ground flat with a diamond grinder."},
    {m:"Module 07",mt:"Application Techniques",q:"When throwing decorative vinyl flake, chips should be released from:",opts:["Waist height, thrown straight down","Knee height, thrown forward at a low angle","Above head height, thrown upward and forward in a wide arc","Directly from the bag by pouring slowly"],a:2,exp:"Flake should be thrown from above head height in a wide upward arc, like throwing confetti. This allows the chips to slow, spread out, and fall flat onto the wet surface."},
    {m:"Module 07",mt:"Application Techniques",q:"What is the main advantage of partial broadcast over full broadcast flake?",opts:["Requires no topcoat application","Uses significantly less flake material and provides more design control while showing the base color","Provides more slip resistance than full broadcast","Eliminates the need for surface preparation before application"],a:1,exp:"Partial broadcast uses significantly less flake material (lower material cost) and provides the designer with more control — the base epoxy color shows through as a background, creating a terrazzo-like aesthetic."},
    // MODULE 8 — Moisture & MVBs (Q43–Q47)
    {m:"Module 08",mt:"Moisture & MVB Systems",q:"ASTM F2170 is the standard test method for:",opts:["Calcium chloride moisture vapor emission rate","In-situ relative humidity testing in concrete slabs","Plastic sheet adhesion testing","Pull-off adhesion strength"],a:1,exp:"ASTM F2170 is the standard for in-situ relative humidity (RH) testing. It involves drilling holes to 40% of slab depth, inserting humidity sensors, and allowing 72 hours of equilibration before reading. It is considered the gold standard for concrete moisture assessment."},
    {m:"Module 08",mt:"Moisture & MVB Systems",q:"For in-situ relative humidity testing (ASTM F2170), sensors are installed at what depth in the concrete slab?",opts:["10% of slab depth","25% of slab depth","40% of slab depth","75% of slab depth"],a:2,exp:"Sensors are installed at 40% of slab depth. Research has shown this depth best represents the moisture condition at the slab surface after the coating is applied and the surface dries."},
    {m:"Module 08",mt:"Moisture & MVB Systems",q:"The Calcium Chloride test (ASTM F1869) measures moisture in what units?",opts:["Percent relative humidity","Pounds per 1,000 sq ft per 24 hours (MVER)","Grams per square meter per day","Milliamps of electrical conductance"],a:1,exp:"The Calcium Chloride test (ASTM F1869) measures the Moisture Vapor Emission Rate (MVER) expressed in pounds per 1,000 square feet per 24 hours. The typical acceptable limit for most coating systems is 3–5 lbs/1,000 sf/24 hr."},
    {m:"Module 08",mt:"Moisture & MVB Systems",q:"Why must surface preparation be thorough even when applying a Moisture Vapor Barrier (MVB)?",opts:["MVBs require a higher CSP than standard coatings — CSP 8 minimum","An MVB applied over a contaminated substrate allows moisture to accumulate beneath it, causing osmotic delamination","MVBs have a very short pot life and require a profiled surface to slow application","Regulatory compliance requires documented prep regardless of the system used"],a:1,exp:"If an MVB is bonded to a contaminated or poorly profiled substrate, moisture vapor moving through the slab cannot escape. Osmotic pressure builds between the MVB and the substrate until the hydrostatic force causes the MVB — and the entire coating system above it — to delaminate."},
    {m:"Module 08",mt:"Moisture & MVB Systems",q:"An MVB is applied in two coats at 90 degrees to each other. The primary reason for this is to:",opts:["Achieve the required 24-mil total build in fewer passes","Minimize pinholes — overlapping opposite directions ensures voids in the first coat are covered by the second","Comply with ASTM F2170 testing requirements","Allow the first coat to act as a primer for the second coat's chemical bond"],a:1,exp:"Applying the second coat perpendicular (90 degrees) to the first ensures that any pinholes or thin spots in the first coat are covered by the solid material in the second coat. Pinholes in an MVB are open vapor pathways that defeat the system's purpose."},
    // MODULE 9 — Self-Leveling Overlays (Q48–Q52)
    {m:"Module 09",mt:"Self-Leveling Overlays",q:"What is the primary consequence of skipping the primer coat before applying self-leveling concrete (SLC)?",opts:["The SLC will take longer to cure","Pinholes, poor bond, and blowouts — the SLC cannot bond properly to an unprimed substrate","The SLC surface will be slightly rougher than intended","No consequence — primer is optional for SLC on new concrete"],a:1,exp:"Primer is absolutely mandatory before SLC. Without primer, the dry, porous concrete substrate rapidly absorbs water from the SLC mix, causing pinholes, bubbling, and bond failure."},
    {m:"Module 09",mt:"Self-Leveling Overlays",q:"A spike roller is used during SLC application to:",opts:["Create a decorative texture on the finished surface","Release trapped air bubbles and knit successive pours together while material is still fluid","Compact the SLC to increase compressive strength","Apply the primer coat evenly before SLC is poured"],a:1,exp:"The spike roller (spiked roller cover) is rolled through fresh SLC immediately after pouring. The spikes penetrate the material, releasing trapped air bubbles and helping to blend the leading edge of one pour into the previous pour for a monolithic surface."},
    {m:"Module 09",mt:"Self-Leveling Overlays",q:"What is the consequence of adding excess water to SLC mix to improve workability?",opts:["No consequence — water only affects flow, not strength","A weaker, more porous topping that is prone to cracking, dusting, and delamination","The SLC will take less time to cure","Increased compressive strength due to improved hydration"],a:1,exp:"Adding excess water raises the w/c ratio beyond the design specifications, resulting in a weaker material with more capillary pores. This produces an SLC that dusts, cracks, and delaminate."},
    {m:"Module 09",mt:"Self-Leveling Overlays",q:"In what order should crew roles be assigned during a large SLC pour (over 1,000 sq ft)?",opts:["All crew members take turns mixing, pouring, and spiking as needed","One dedicated mixer, one dedicated pourer/raker, one dedicated spike-roller, plus a runner for materials","Two crew members mixing alternately; one applicator pouring and spiking alone","The supervisor mixes while one crew member handles all application tasks"],a:1,exp:"SLC application is time-critical. Large areas require dedicated role separation: a continuous mixer, a dedicated pourer/gauge raker, a spike roller working right behind the pour, and a materials runner to keep mixing going without gaps."},
    {m:"Module 09",mt:"Self-Leveling Overlays",q:"Why should fresh SLC be protected from drafts and direct sunlight during the cure period?",opts:["UV radiation degrades the cementitious binder","Drafts and direct sun cause uneven, rapid surface drying that leads to surface cracking and plastic shrinkage cracks","High temperature speeds cure, which is always beneficial","Air movement improves the release of trapped air bubbles after application"],a:1,exp:"Uneven or rapid surface drying from drafts, direct sun, or HVAC creates moisture gradients. The surface dries and shrinks faster than the interior, causing plastic shrinkage cracks. SLC must cure uniformly."},
    // MODULE 10 — Pigment & Color (Q53–Q56)
    {m:"Module 10",mt:"Pigment & Color",q:"Which type of pigment offers superior UV stability in resinous coatings?",opts:["Organic pigments (synthetic dyes)","Inorganic pigments (iron oxides, titanium dioxide, carbon black)","Fluorescent pigments","Metallic effect pigments"],a:1,exp:"Inorganic pigments (iron oxides, titanium dioxide, carbon black) are inherently UV stable because their molecular structure does not break down under ultraviolet radiation. Organic pigments can fade or shift color under UV exposure."},
    {m:"Module 10",mt:"Pigment & Color",q:"Pigment should be added to which component of a two-part epoxy system, and when?",opts:["Into Part B (hardener) before mixing with Part A","Into Part A (resin) before adding Part B, for thorough dispersion","Into the mixed A+B batch immediately after combining","Into the Part A and B simultaneously during mixing"],a:1,exp:"Pigment should be added to Part A (the resin component) and thoroughly dispersed before adding Part B. This gives maximum mixing time for complete pigment dispersion."},
    {m:"Module 10",mt:"Pigment & Color",q:"What is the industry term for the undesirable yellowing and chalking of epoxy topcoats exposed to sunlight?",opts:["Saponification","UV degradation / chalking","Amine blush","Osmotic blistering"],a:1,exp:"UV degradation or chalking describes the breakdown of aromatic epoxy chemistry under ultraviolet radiation. The molecular structure of aromatic epoxies absorbs UV energy and degrades, causing the coating to yellow, chalk, and eventually lose adhesion."},
    {m:"Module 10",mt:"Pigment & Color",q:"To achieve consistent color batch-to-batch across a large floor, the applicator should:",opts:["Eyeball the pigment addition to match the first batch color","Weigh pigment precisely for every batch using a scale","Mix all pigment for the entire job before starting the floor","Add more pigment if the first batch looks lighter than expected"],a:1,exp:"Precise weighing of pigment for every batch is the only way to achieve batch-to-batch consistency. Eyeballing results in color variation across sections of the floor."},
    // MODULE 11 — Chemical Resistance (Q57–Q60)
    {m:"Module 11",mt:"Chemical Resistance",q:"Which coating system provides the best resistance to thermal shock, hot liquids, and steam cleaning in a food processing environment?",opts:["100% solids epoxy","Polyaspartic topcoat","Urethane cement (cementitious urethane)","Water-based acrylic sealer"],a:2,exp:"Urethane cement (cementitious urethane) is specifically engineered for food processing, commercial kitchens, and environments with thermal shock, hot liquid exposure, and frequent steam cleaning."},
    {m:"Module 11",mt:"Chemical Resistance",q:"Film thickness is important for chemical resistance because:",opts:["Thicker films cure faster and resist chemicals sooner","Increased film thickness extends the chemical permeation path, giving more time before chemicals reach the substrate","Thick films trap chemicals on the surface where they can be cleaned away","Chemical resistance is determined entirely by chemistry, not thickness"],a:1,exp:"Film thickness extends the physical distance (permeation path) a chemical must travel to reach the substrate. Thicker films take longer to be permeated and give more time for dilution, cleaning, or neutralization."},
    {m:"Module 11",mt:"Chemical Resistance",q:"A client's manufacturing facility uses both 10% sulfuric acid and 50% sulfuric acid. Why is it important to check the chemical resistance chart for both concentrations separately?",opts:["There is no practical difference — the same chemistry resists all concentrations equally","Coating resistance ratings vary by concentration — a product may be rated excellent at 10% but not recommended at 50%","Only the higher concentration matters for specification purposes","Chemical resistance charts only list ratings for pure (100%) chemicals"],a:1,exp:"Coating chemical resistance is concentration-dependent. A coating that resists dilute acid may be attacked by concentrated acid. Always verify the actual process chemical concentration, not just the chemical name."},
    {m:"Module 11",mt:"Chemical Resistance",q:"For a facility with heavy forklift traffic, chemical exposure, and a requirement for easy sanitization, the most appropriate system is:",opts:["Thin-film water-based epoxy sealer","High-build 100% solids epoxy with quartz broadcast and aliphatic urethane topcoat","Decorative polyaspartic single-coat","Standard latex floor paint"],a:1,exp:"Heavy industrial environments with forklift traffic, chemical exposure, and sanitation requirements demand a high-build system. 100% solids epoxy provides the chemical resistance, quartz broadcast provides slip resistance and hardness, and an aliphatic urethane topcoat provides UV stability and a cleanable finish."},
    // MODULE 12 — Coatings Safety (Q61–Q65)
    {m:"Module 12",mt:"Coatings Safety",q:"Which SDS section contains the Occupational Exposure Limits (OELs) and recommended respiratory protection for a coating product?",opts:["Section 2 — Hazard Identification","Section 5 — Firefighting Measures","Section 8 — Exposure Controls / Personal Protection","Section 14 — Transport Information"],a:2,exp:"Section 8 (Exposure Controls / Personal Protection) of the 16-section GHS Safety Data Sheet contains OELs (TLV, PEL, REL), recommended engineering controls, and specific PPE recommendations including respirator type, cartridge selection, glove material, and eye protection."},
    {m:"Module 12",mt:"Coatings Safety",q:"Why is epoxy sensitization a lifelong concern for coating applicators?",opts:["Epoxy permanently damages the liver over time","Once sensitized, even trace exposures can trigger severe allergic reactions indefinitely — there is no desensitization treatment","Sensitization only lasts 12 months and then resolves","Only installers over age 40 are at risk of sensitization"],a:1,exp:"Epoxy sensitization is a type IV delayed hypersensitivity reaction. Once the immune system is sensitized, it recognizes even trace amounts of epoxy components as threats. There is no cure or desensitization — the only management is complete avoidance."},
    {m:"Module 12",mt:"Coatings Safety",q:"What type of respirator cartridge provides protection against both organic vapors from coatings AND respirable silica dust from surface preparation?",opts:["N95 disposable filtering facepiece","P100 particulate filter only","OV/P100 combination cartridge (Organic Vapor + P100 particulate)","Paper dust mask with charcoal layer"],a:2,exp:"An OV/P100 combination cartridge provides dual protection: the organic vapor (OV) cartridge absorbs coating vapors and solvents, while the P100 particulate filter captures at least 99.97% of airborne particles including respirable silica."},
    {m:"Module 12",mt:"Coatings Safety",q:"Which glove material provides adequate protection when handling epoxy resins and amine hardeners?",opts:["Latex gloves","Cotton work gloves","Nitrile gloves (disposable, chemical-resistant)","Thin vinyl exam gloves"],a:2,exp:"Nitrile gloves provide the best combination of chemical resistance to epoxy components and practical usability. Latex gloves themselves can cause latex sensitization. Nitrile gloves should be changed frequently as breakthrough can occur over extended contact."},
    {m:"Module 12",mt:"Coatings Safety",q:"MMA (Methyl Methacrylate) coatings require special safety precautions because:",opts:["They cure too slowly without full enclosure","The monomer has a strong, penetrating odor, requires ventilation, and presents a flammability hazard","They create silica dust during mixing","They require cryogenic storage that presents a handling hazard"],a:1,exp:"MMA monomers have a characteristically strong, sweet odor and a relatively low flash point, creating both health and flammability hazards. The work area must be evacuated of occupants, thoroughly ventilated, and all ignition sources removed before application begins."},
    // MODULE 13 — Troubleshooting & QC (Q66–Q74)
    {m:"Module 13",mt:"Troubleshooting & Quality Control",q:"Fisheyes or cratering in a cured epoxy coating are most commonly caused by:",opts:["Excess moisture in the concrete","Silicone, oil, or other contamination on the substrate or application tools","Mixing at too high an RPM","Applying coating below the manufacturer's minimum temperature"],a:1,exp:"Fisheyes and cratering are caused by surface tension differences between the coating and a contaminant on the substrate. Silicone (from WD-40, mold release, furniture polish, etc.) is the most common culprit."},
    {m:"Module 13",mt:"Troubleshooting & Quality Control",q:"Amine blush on a cured epoxy surface appears as what, and what causes it?",opts:["A grainy texture from unmixed pigment; caused by insufficient mixing","A waxy, oily, or greasy film; caused by moisture reacting with amine hardener components during cure","A rough, pockmarked surface; caused by outgassing from the substrate","Yellow discoloration; caused by UV exposure during cure"],a:1,exp:"Amine blush appears as a waxy, greasy, or milky film on the surface of cured or curing epoxy. It is caused by the amine hardener (Part B) reacting with atmospheric moisture and CO₂ during cure."},
    {m:"Module 13",mt:"Troubleshooting & Quality Control",q:"Bubbling or outgassing in an applied epoxy coating is most commonly associated with:",opts:["Mixing at too low an RPM","The substrate temperature rising during application, pushing air from concrete pores up through the wet coating","Using the wrong roller nap for the surface profile","Applying coating over a cured MVB"],a:1,exp:"As a concrete slab warms, the air in the surface pores expands and tries to escape upward through the wet coating. This creates bubbles. The solution is to apply coating when substrate temperature is stable or slightly dropping."},
    {m:"Module 13",mt:"Troubleshooting & Quality Control",q:"Delamination between an epoxy basecoat and polyaspartic topcoat is found 48 hours after application. The most likely cause is:",opts:["The polyaspartic was too thin","The recoat window for the epoxy was exceeded without mechanical abrasion between coats","The color difference between the two products","The ambient temperature dropped overnight"],a:1,exp:"When a topcoat is applied after the epoxy's chemical recoat window has closed, it can only bond mechanically. If the cured epoxy surface was not mechanically abraded, there is no mechanical anchor, resulting in intercoat delamination."},
    {m:"Module 13",mt:"Troubleshooting & Quality Control",q:"ASTM D4541 is performed during a QC inspection to measure:",opts:["Surface pH at multiple points","Pull-off adhesion strength of the applied coating","Moisture vapor emission rate post-coating","Wet film thickness during application"],a:1,exp:"ASTM D4541 is the Standard Test Method for Pull-Off Strength of Coatings Using a Portable Adhesion Tester. This provides quantitative data on coating adhesion for QC documentation."},
    {m:"Module 13",mt:"Troubleshooting & Quality Control",q:"When should wet film thickness (WFT) checks be performed during coating application?",opts:["Only at the beginning and end of each roller section","Every 5–10 minutes during application","Once per hour","Only when the applicator suspects a problem"],a:1,exp:"Wet film thickness should be checked every 5–10 minutes during application using a wet mil gauge. Consistent thickness checks catch both thin spots and thick spots in real time, allowing immediate correction before the coating gels."},
    {m:"Module 13",mt:"Troubleshooting & Quality Control",q:"A QC report at project turnover should include which of the following?",opts:["Only the final photograph of the completed floor","Timestamped photos, moisture test results, ambient conditions logs, product batch numbers, and written QC checklist","Verbal confirmation from the lead installer","Only the customer's signature on the completion form"],a:1,exp:"A complete QC documentation package should include: timestamped photos of each project phase, moisture test results, ambient condition logs, product batch and lot numbers, application records, and a signed QC checklist."},
    {m:"Module 13",mt:"Troubleshooting & Quality Control",q:"A soft, tacky coating surface discovered 24 hours after application is most likely caused by:",opts:["Normal — all coatings are soft at 24 hours","Off-ratio mixing (incorrect Part A to Part B ratio), cold application temperature, or expired hardener","Applying the coating too thick","Using the wrong roller nap"],a:1,exp:"A soft or tacky coating at 24 hours indicates incomplete curing. The three most common causes are: off-ratio mixing, application below minimum temperature, or expired/contaminated hardener."},
    {m:"Module 13",mt:"Troubleshooting & Quality Control",q:"What does a 'rising substrate temperature' during application mean for coating quality, and what is the correct response?",opts:["Rising substrate temperature is beneficial — it accelerates cure and improves adhesion","Rising substrate temperature causes outgassing from concrete pores — stop application, allow temperature to stabilize or begin dropping, then resume","Rising substrate temperature means the dew point threshold has been exceeded — immediately apply MVB","Rising temperature only affects cure time, not appearance or adhesion"],a:1,exp:"A rising substrate temperature causes the air in the concrete's surface pores to expand and escape upward through the wet coating film, creating bubbles (outgassing). Stop application immediately. Wait until the slab temperature is stable or falling."}
  ];

  const CERTIFICATIONS = [
    {
      id: 'cert-resinous',
      name: 'Certified Resinous Installer',
      shortName: 'CRI',
      desc: 'Demonstrates mastery of resinous flooring systems including concrete fundamentals, surface prep, coating chemistry, moisture management, safety, and QC.',
      requirements: 'Complete all 5 Resinous Mastery courses and pass the 80-question certification exam with 80% or higher.',
      pathId: 'resinous-mastery',
      examPassScore: 80,
      color: '#c8a84b'
    }
  ];

  const HANDBOOK_SECTIONS = [
    {
      id: 'welcome',
      title: 'Welcome to Defense Flooring',
      content: `
        <h4>A Message from Leadership</h4>
        <p>Welcome to the team. Defense Flooring was built on a simple belief: that our military and government clients deserve the same precision, accountability, and professionalism in their floors that they apply to everything else they do. That standard starts with every person who joins this company.</p>
        <p>You were hired because we believe you have what it takes to contribute to this mission. Your success here is our success. Read this handbook. Learn our processes. Ask questions when you're unsure. And never cut corners on a government floor.</p>
        <h4>Our Purpose</h4>
        <p>Defense Flooring's mission is to provide custom turn-key flooring solutions to the Department of Defense through unparalleled customer service, durable products, and using top-of-the-line materials to transform spaces where our military live, work, and play.</p>
      `
    },
    {
      id: 'employment',
      title: 'Employment Policies',
      content: `
        <h4>At-Will Employment</h4>
        <p>Unless otherwise specified in a written agreement, employment at Defense Flooring is at-will, meaning either party may end the employment relationship at any time.</p>
        <h4>Equal Opportunity</h4>
        <p>Defense Flooring is an equal opportunity employer. We do not discriminate based on race, color, religion, sex, national origin, age, disability, veteran status, or any other protected characteristic.</p>
        <h4>Work Hours</h4>
        <p>Standard hours vary by position and project assignment. Field crews may have early start times dictated by project requirements. Office staff maintain standard business hours unless a project requires otherwise.</p>
        <h4>Attendance & Punctuality</h4>
        <p>Reliability is non-negotiable. Government facilities have strict access windows — a late crew can lose the day entirely. Notify your supervisor as early as possible if you cannot report on time.</p>
      `
    },
    {
      id: 'safety',
      title: 'Safety Policies',
      content: `
        <h4>Safety Is Non-Negotiable</h4>
        <p>Defense Flooring maintains a zero-tolerance policy for unsafe work practices. Every employee has both the right and the obligation to stop work if they identify an unsafe condition.</p>
        <h4>PPE Requirements</h4>
        <p>All field personnel must wear appropriate PPE at all times on the job site. Minimum requirements for resinous coating work: safety glasses, nitrile gloves, half-face respirator with OV/P100 cartridges (or P100 during prep), knee pads, and closed-toe work boots.</p>
        <h4>Silica Awareness</h4>
        <p>Concrete grinding and prep operations generate respirable crystalline silica. OSHA 29 CFR 1926.1153 (the silica standard) applies to all our prep work. HEPA vacuum systems must be attached to grinding equipment at all times during operation.</p>
        <h4>Incident Reporting</h4>
        <p>Any injury, near-miss, or unsafe condition must be reported to the supervisor immediately. Do not delay incident reporting. Document the event in writing the same day it occurs.</p>
      `
    },
    {
      id: 'conduct',
      title: 'Standards of Conduct',
      content: `
        <h4>Professional Conduct</h4>
        <p>You are a representative of Defense Flooring on every job site, in every vehicle, and in every interaction. Conduct yourself professionally at all times — especially on military installations where your behavior reflects on the company's access privileges.</p>
        <h4>Military Installation Rules</h4>
        <p>Military installations have strict rules. Follow all base entry procedures. Never photograph restricted areas. Comply with all uniformed personnel instructions immediately. Any violation can result in loss of base access for the entire company.</p>
        <h4>Drug & Alcohol Policy</h4>
        <p>Defense Flooring maintains a drug-free workplace. Government contracts may require random drug testing. Any employee reporting to work under the influence will be sent home and may be terminated.</p>
        <h4>Electronic Devices</h4>
        <p>Cell phones should not be used on active job sites except during breaks. Some military installations prohibit cameras on site — follow all posted and verbal restrictions without exception.</p>
      `
    },
    {
      id: 'quality',
      title: 'Quality Standards',
      content: `
        <h4>The Zero Rework Standard</h4>
        <p>Rework is the most expensive cost in this business. It costs materials, labor, customer trust, and schedule. Every crew member is expected to understand the specification before they start work — not after a mistake is made.</p>
        <h4>Documentation Requirements</h4>
        <p>Every project requires documentation: timestamped photos at each stage of preparation and application, ambient condition records (temperature, relative humidity, dew point), product batch and lot numbers, and a completed QC checklist signed by the lead installer.</p>
        <h4>Manufacturer Specifications</h4>
        <p>We follow manufacturer technical data sheets (TDS) on every project. If a product TDS and a project specification conflict, escalate to your PM immediately. Do not proceed on assumptions.</p>
        <h4>Escalation Protocol</h4>
        <p>If you discover a condition that will prevent a quality installation — high moisture, inadequate substrate, wrong material delivered — stop work and call your project manager. Document the condition with photos and notes before anything is applied.</p>
      `
    },
    {
      id: 'compensation',
      title: 'Compensation & Benefits',
      content: `
        <h4>Payroll</h4>
        <p>Employees are paid on a bi-weekly schedule. Direct deposit is available and encouraged. Questions about pay should be directed to the office manager.</p>
        <h4>Prevailing Wage</h4>
        <p>Many of our government contracts are subject to Davis-Bacon Act prevailing wage requirements. Wage rates for Davis-Bacon projects are posted and employees must be paid the applicable prevailing wage for the work classification performed.</p>
        <h4>Overtime</h4>
        <p>Non-exempt employees are entitled to overtime pay at 1.5x for hours worked over 40 in a workweek. Overtime must be pre-approved by a supervisor except when required to complete time-sensitive project work.</p>
        <h4>Expense Reimbursement</h4>
        <p>Approved work-related expenses are reimbursed. Submit receipts with a completed expense report within 5 business days. Expenses submitted more than 30 days after the date incurred may not be reimbursed.</p>
      `
    }
  ];

  return {
    ROLES,
    LEVELS,
    ACHIEVEMENTS,
    LEARNING_PATHS,
    COURSES,
    QUESTIONS,
    CERTIFICATIONS,
    HANDBOOK_SECTIONS
  };

})();
