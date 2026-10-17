// =========================================================================
// Grade Hub & Interactive 3-Step Educational Workflow Controller
// FLOW:
// Step 1: هەڵبژارتنا بابەتی (Curriculum Subjects: Chemistry, Physics, Biology, Math, etc.)
// Step 2: دیڤدا مامۆستا (Teachers of that subject, sorted by student views)
// Step 3: دیڤدا مەلزەمە، ڤیدیۆ و پرسیارێن هەڵبژارتن (Multi-format notes, YouTube lessons, quizzes)
// =========================================================================

document.addEventListener('DOMContentLoaded', function () {
    const dataStore = window.EducationalData;
    const gradesConfig = window.GRADES_CONFIG || [];

    // 1. URL Parameters
    const urlParams = new URLSearchParams(window.location.search);
    let pola = urlParams.get('pola') || '12';
    let initialSubjectParam = urlParams.get('subject'); // e.g. 'chem', 'math' or null
    let initialTeacherParam = urlParams.get('teacher'); // e.g. 't_hussein' or null

    const currentGradeConfig = gradesConfig.find(g => g.id === String(pola)) || {
        id: pola,
        name: `پۆلا ${pola}`,
        shortName: `پۆلا ${pola}`,
        icon: 'fa-school',
        color: '#007bff'
    };

    // Update Header / Banner
    document.title = `${currentGradeConfig.name} | بابەت، مامۆستا، مەلزەمە و ڤیدیۆ`;
    const gradeTitle = document.getElementById('grade-title');
    const gradeIcon = document.getElementById('grade-icon');
    const gradeIconBubble = document.getElementById('grade-icon-bubble');
    const gradeBannerBox = document.getElementById('grade-banner-box');

    if (gradeTitle) gradeTitle.textContent = currentGradeConfig.name;
    if (gradeIcon) gradeIcon.className = `fas ${currentGradeConfig.icon || 'fa-school'}`;
    if (gradeIconBubble) {
        gradeIconBubble.style.color = currentGradeConfig.color || '#007bff';
        gradeIconBubble.style.background = `${currentGradeConfig.color || '#007bff'}18`;
    }
    if (gradeBannerBox) gradeBannerBox.style.borderTopColor = currentGradeConfig.color || '#007bff';

    // Theme Toggle
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        const savedTheme = localStorage.getItem('userTheme') || localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('userTheme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Role Indicator
    const userRole = dataStore.getUserRole();
    const roleLabel = document.getElementById('current-user-role-label');
    const teacherPanelLink = document.getElementById('teacher-panel-link');
    if (userRole === 'teacher' || dataStore.isCurrentUserSuperAdmin()) {
        if (roleLabel) roleLabel.textContent = 'مامۆستا';
        if (teacherPanelLink) teacherPanelLink.style.display = 'inline-flex';
    } else {
        if (roleLabel) roleLabel.textContent = 'قوتابی';
    }

    // Stepper Elements
    const stepNav1 = document.getElementById('step-nav-1');
    const stepNav2 = document.getElementById('step-nav-2');
    const stepNav3 = document.getElementById('step-nav-3');
    const step1Label = document.getElementById('step-1-label');
    const step2Label = document.getElementById('step-2-label');
    const step3Label = document.getElementById('step-3-label');

    // Section 1: Subjects Elements
    const step1Section = document.getElementById('step-1-section');
    const subjectsGrid = document.getElementById('grade-subjects-grid');
    const activeSubjectBadge = document.getElementById('active-subject-badge');
    const resetSubjectFilterBtn = document.getElementById('reset-subject-filter-btn');

    // Section 2: Teachers Elements
    const step2Section = document.getElementById('step-2-section');
    const teachersWaitingPrompt = document.getElementById('teachers-waiting-prompt');
    const teachersListContainer = document.getElementById('grade-teachers-list');
    const teachersSectionHeading = document.getElementById('teachers-section-heading');
    const btnBackToSubjects = document.getElementById('btn-back-to-subjects');
    const btnBrowseAllTeachers = document.getElementById('btn-browse-all-teachers');
    const quickSubjectTriggers = document.getElementById('quick-subject-triggers');

    // Section 3: Content Portal Elements
    const teacherContentPortal = document.getElementById('teacher-content-portal');
    const closeTeacherPortalBtn = document.getElementById('close-teacher-portal-btn');
    const activeTeacherAvatar = document.getElementById('active-teacher-avatar');
    const activeTeacherName = document.getElementById('active-teacher-name');
    const activeTeacherSubject = document.getElementById('active-teacher-subject');
    const activeTeacherBio = document.getElementById('active-teacher-bio');
    const activeTeacherViews = document.getElementById('active-teacher-views');

    // Tabs
    const contentTabs = document.querySelectorAll('.c-tab');
    const countMalzama = document.getElementById('count-malzama');
    const countVideos = document.getElementById('count-videos');
    const countQuizzes = document.getElementById('count-quizzes');
    const malzamaContainer = document.getElementById('malzama-container');
    const videosContainer = document.getElementById('videos-container');
    const quizzesContainer = document.getElementById('quizzes-container');

    // Language Filter Elements
    const activeLangText = document.getElementById('active-lang-text');
    const langPills = document.querySelectorAll('.lang-pill');

    // Modals
    const videoModal = document.getElementById('video-modal');
    const closePlayerBtn = document.getElementById('close-player-btn');
    const youtubeIframe = document.getElementById('youtube-iframe');
    const modalVideoTitle = document.getElementById('modal-video-title');
    const modalVideoChapter = document.getElementById('modal-video-chapter');

    const docModal = document.getElementById('doc-viewer-modal');
    const closeDocBtn = document.getElementById('close-doc-btn');
    const docViewport = document.getElementById('doc-viewer-viewport');
    const docModalTitle = document.getElementById('doc-modal-title');
    const docModalBadge = document.getElementById('doc-modal-format-badge');
    const docModalDownload = document.getElementById('doc-modal-download-btn');
    const docModalGdriveSave = document.getElementById('doc-modal-gdrive-save-btn');
    const docModalTeacher = document.getElementById('doc-modal-teacher-info');
    const docModalSize = document.getElementById('doc-modal-size-info');

    // State Variables
    let currentLanguage = dataStore.getActiveLanguage();
    // If URL passed ?subject=..., use it; otherwise null (waiting for user selection)
    let currentSelectedSubject = (initialSubjectParam && initialSubjectParam !== 'all') ? initialSubjectParam : (initialSubjectParam === 'all' ? 'all' : null);
    let currentSelectedTeacher = null;
    let currentViewingDocItem = null;
    let currentViewingDocTeacher = null;

    // ==========================================
    // 1. STEPPER UI UPDATE
    // ==========================================
    function updateStepperUI() {
        // Step 1 State
        if (currentSelectedSubject) {
            stepNav1.className = 'step-badge completed';
            const subObj = dataStore.getSubjectById(currentSelectedSubject);
            const subTitle = subObj ? subObj.name : (currentSelectedSubject === 'all' ? 'گشت بابەتەکان' : currentSelectedSubject);
            if (step1Label) step1Label.innerHTML = `<span style="color:#28a745; font-weight:bold;">✔ ${subTitle}</span>`;
        } else {
            stepNav1.className = 'step-badge active';
            if (step1Label) step1Label.textContent = 'کیمیا، فیزیا، زیندەوەر...';
        }

        // Step 2 State
        if (!currentSelectedSubject) {
            stepNav2.className = 'step-badge disabled';
            if (step2Label) step2Label.textContent = 'سەرەتا بابەتێک هەڵبژێرە';
        } else if (currentSelectedTeacher) {
            stepNav2.className = 'step-badge completed';
            if (step2Label) step2Label.innerHTML = `<span style="color:#28a745; font-weight:bold;">✔ ${currentSelectedTeacher.name}</span>`;
        } else {
            stepNav2.className = 'step-badge active';
            if (step2Label) step2Label.textContent = 'دیاریکردنی مامۆستا';
        }

        // Step 3 State
        if (!currentSelectedTeacher) {
            stepNav3.className = 'step-badge disabled';
            if (step3Label) step3Label.textContent = 'مەلزەمە، ڤیدیۆ و پرسیار';
        } else {
            stepNav3.className = 'step-badge active';
            if (step3Label) step3Label.innerHTML = `<span style="color:var(--blue-accent); font-weight:bold;">ناوەڕۆکی وانەکان</span>`;
        }
    }

    // Step Nav Click Handlers
    stepNav1.addEventListener('click', () => {
        step1Section.scrollIntoView({ behavior: 'smooth' });
    });
    stepNav2.addEventListener('click', () => {
        if (currentSelectedSubject) {
            step2Section.scrollIntoView({ behavior: 'smooth' });
        }
    });
    stepNav3.addEventListener('click', () => {
        if (currentSelectedTeacher && teacherContentPortal.style.display !== 'none') {
            teacherContentPortal.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // ==========================================
    // 2. RENDER STEP 1: SUBJECTS GRID
    // ==========================================
    function renderGradeSubjects() {
        if (!subjectsGrid) return;

        const gradeSubjects = dataStore.getSubjectsForGrade(pola);
        const allGradeTeachers = dataStore.getTeachersForGrade(pola, currentLanguage, 'all');

        let html = '';

        // 1. Specific Curriculum Subjects Cards (کیمیا، فیزیا، زیندەوەر، بیرکاری، عەرەبی...)
        html += gradeSubjects.map(sub => {
            const isActive = currentSelectedSubject === sub.id || currentSelectedSubject === sub.key;
            const matchingTeachers = dataStore.getTeachersForGrade(pola, currentLanguage, sub.id);
            const teacherCount = matchingTeachers.length;

            return `
                <div class="subject-card-box ${isActive ? 'active' : ''}" data-subject-id="${sub.id}" style="${isActive ? `border-color: ${sub.color};` : ''}">
                    <div class="subject-active-dot" style="background: ${sub.color || 'var(--blue-accent)'};">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="subject-icon-circle" style="background: ${sub.gradient || sub.color || '#007bff'};">
                        <i class="fas ${sub.icon || 'fa-book'}"></i>
                    </div>
                    <h4 class="subject-card-name">${sub.name}</h4>
                    <span class="subject-card-en">${sub.nameEn || ''}</span>
                    <span class="subject-card-count">${teacherCount} مامۆستا</span>
                    <button class="btn-action-primary" style="margin-top:10px; width:100%; justify-content:center; font-size:0.78rem; padding:5px 8px; background:${isActive ? sub.color : 'var(--blue-accent)'};">
                        <i class="fas fa-chalkboard-teacher"></i> بینینی مامۆستایان
                    </button>
                </div>
            `;
        }).join('');

        // 2. "All Subjects" Card at the end for flexible browsing
        const isAllActive = currentSelectedSubject === 'all';
        html += `
            <div class="subject-card-box ${isAllActive ? 'active' : ''}" data-subject-id="all">
                <div class="subject-active-dot"><i class="fas fa-check"></i></div>
                <div class="subject-icon-circle" style="background: linear-gradient(135deg, #495057, #212529);">
                    <i class="fas fa-th-large"></i>
                </div>
                <h4 class="subject-card-name">گشت بابەتەکان</h4>
                <span class="subject-card-en">All Subjects</span>
                <span class="subject-card-count">${allGradeTeachers.length} مامۆستا</span>
                <button class="btn-action-secondary" style="margin-top:10px; width:100%; justify-content:center; font-size:0.78rem; padding:5px 8px;">
                    بینینی هەموو
                </button>
            </div>
        `;

        subjectsGrid.innerHTML = html;

        // Click Handlers on Subject Cards
        subjectsGrid.querySelectorAll('.subject-card-box').forEach(card => {
            card.addEventListener('click', () => {
                const subId = card.getAttribute('data-subject-id');
                selectSubject(subId, true);
            });
        });

        // Also populate quick pills in Step 2 prompt
        if (quickSubjectTriggers) {
            quickSubjectTriggers.innerHTML = gradeSubjects.slice(0, 6).map(sub => `
                <button class="btn-action-secondary" data-quick-sub="${sub.id}" style="font-size:0.8rem; padding:4px 12px;">
                    <i class="fas ${sub.icon || 'fa-book'}" style="color:${sub.color};"></i> ${sub.name}
                </button>
            `).join('');

            quickSubjectTriggers.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const subId = btn.getAttribute('data-quick-sub');
                    selectSubject(subId, true);
                });
            });
        }

        updateSubjectBadgeUI();
    }

    // Handle Subject Selection
    function selectSubject(subId, shouldScroll = false) {
        currentSelectedSubject = subId;

        // Update cards visual state
        if (subjectsGrid) {
            subjectsGrid.querySelectorAll('.subject-card-box').forEach(c => {
                c.classList.toggle('active', c.getAttribute('data-subject-id') === subId);
            });
        }

        // Update URL query parameter without page reload
        try {
            const newUrl = new URL(window.location);
            if (subId && subId !== 'all') {
                newUrl.searchParams.set('subject', subId);
            } else if (subId === 'all') {
                newUrl.searchParams.set('subject', 'all');
            } else {
                newUrl.searchParams.delete('subject');
            }
            window.history.replaceState({}, '', newUrl);
        } catch (e) {}

        updateSubjectBadgeUI();
        updateStepperUI();
        renderGradeTeachers();

        // Close content portal if active teacher does not match new subject
        if (currentSelectedTeacher && currentSelectedSubject && currentSelectedSubject !== 'all') {
            if (!dataStore.matchesSubject(currentSelectedTeacher.subject, currentSelectedSubject)) {
                teacherContentPortal.style.display = 'none';
                currentSelectedTeacher = null;
                updateStepperUI();
            }
        }

        if (shouldScroll) {
            step2Section.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function updateSubjectBadgeUI() {
        if (!activeSubjectBadge) return;

        if (!currentSelectedSubject) {
            activeSubjectBadge.textContent = 'سەرەتا بابەتێک هەڵبژێرە';
            activeSubjectBadge.style.background = 'rgba(0,123,255,0.1)';
            activeSubjectBadge.style.color = 'var(--blue-accent)';
            activeSubjectBadge.style.borderColor = 'rgba(0,123,255,0.25)';
            if (resetSubjectFilterBtn) resetSubjectFilterBtn.style.display = 'none';
            if (btnBackToSubjects) btnBackToSubjects.style.display = 'none';
            if (teachersSectionHeading) {
                teachersSectionHeading.innerHTML = `<i class="fas fa-chalkboard-teacher" style="color:var(--blue-accent);"></i> مامۆستایێن بابەتی`;
            }
        } else if (currentSelectedSubject === 'all') {
            activeSubjectBadge.textContent = 'گشت بابەتەکان';
            activeSubjectBadge.style.background = 'rgba(0,123,255,0.12)';
            activeSubjectBadge.style.color = 'var(--blue-accent)';
            if (resetSubjectFilterBtn) resetSubjectFilterBtn.style.display = 'none';
            if (btnBackToSubjects) btnBackToSubjects.style.display = 'inline-flex';
            if (teachersSectionHeading) {
                teachersSectionHeading.innerHTML = `<i class="fas fa-chalkboard-teacher" style="color:var(--blue-accent);"></i> گشت مامۆستایانی بەردەست لەم پۆلەدا`;
            }
        } else {
            const subObj = dataStore.getSubjectById(currentSelectedSubject);
            const subTitle = subObj ? subObj.name : currentSelectedSubject;
            activeSubjectBadge.textContent = `بابەت: ${subTitle}`;
            if (subObj) {
                activeSubjectBadge.style.background = `${subObj.color}22`;
                activeSubjectBadge.style.color = subObj.color;
                activeSubjectBadge.style.borderColor = subObj.color;
            }
            if (resetSubjectFilterBtn) resetSubjectFilterBtn.style.display = 'inline-flex';
            if (btnBackToSubjects) btnBackToSubjects.style.display = 'inline-flex';
            if (teachersSectionHeading) {
                teachersSectionHeading.innerHTML = `<i class="fas fa-chalkboard-teacher" style="color:var(--blue-accent);"></i> مامۆستایانی بابەتی (${subTitle})`;
            }
        }
    }

    // Reset / Change Subject buttons
    if (resetSubjectFilterBtn) {
        resetSubjectFilterBtn.addEventListener('click', () => {
            selectSubject(null, false);
            step1Section.scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (btnBackToSubjects) {
        btnBackToSubjects.addEventListener('click', () => {
            selectSubject(null, false);
            step1Section.scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (btnBrowseAllTeachers) {
        btnBrowseAllTeachers.addEventListener('click', () => {
            selectSubject('all', true);
        });
    }

    // ==========================================
    // 3. RENDER STEP 2: TEACHERS LIST
    // ==========================================
    function renderGradeTeachers() {
        // If NO subject is selected yet, show the waiting prompt and hide teachers list
        if (!currentSelectedSubject) {
            teachersWaitingPrompt.style.display = 'block';
            teachersListContainer.style.display = 'none';
            return;
        }

        teachersWaitingPrompt.style.display = 'none';
        teachersListContainer.style.display = 'grid';

        const teachers = dataStore.getTeachersForGrade(pola, currentLanguage, currentSelectedSubject);
        const subObj = currentSelectedSubject !== 'all' ? dataStore.getSubjectById(currentSelectedSubject) : null;
        const subTitle = subObj ? subObj.name : '';
        const langName = dataStore.getLanguageLabel(currentLanguage);

        if (teachers.length === 0) {
            // Check if there are teachers for this subject in other languages
            const allLangTeachersForSub = currentSelectedSubject !== 'all' 
                ? dataStore.getAllTeachers().filter(t => (t.grades || []).includes(String(pola)) && dataStore.matchesSubject(t.subject, currentSelectedSubject))
                : [];

            teachersListContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align:center; padding: 35px 20px; background:var(--surface-color); border-radius:14px; border:1px solid var(--border-color); color: var(--secondary-text);">
                    <div style="width:65px; height:65px; border-radius:50%; background:rgba(0,180,216,0.1); color:var(--blue-accent); display:flex; align-items:center; justify-content:center; font-size:1.8rem; margin:0 auto 15px;">
                        <i class="fas ${subObj ? (subObj.icon || 'fa-book') : 'fa-chalkboard-teacher'}"></i>
                    </div>
                    <h3 style="margin:5px 0 8px; font-size:1.18rem; color:var(--primary-text);">
                        ${currentSelectedSubject !== 'all' 
                            ? `بابەتی (${subTitle}) - نوکە وانە و مەلزەمە دهێنە ئامادەکرن` 
                            : `هیچ مامۆستایەک بە زمانی (${langName}) بۆ ئەم پۆلە نییە`}
                    </h3>
                    <p style="margin:0 0 18px; font-size:0.9rem; max-width:550px; margin-left:auto; margin-right:auto; line-height:1.5;">
                        ${allLangTeachersForSub.length > 0 
                            ? `مامۆستایانی تر هەن بۆ ئەم بابەتە بە شێوەزاری تر. دەتوانیت زمان بگۆڕیت یان یەکسەر بە ژیریی دەستکرد وانە و پاوەرپۆینت دروست بکەیت.`
                            : `دەتوانیت وەک مامۆستا داخل بیت و بە هاوکاری Gemini AI ڕاستەوخۆ پاوەرپۆینت و پرسیاری هەڵبژاردن بۆ ئەم بابەتە دروست بکەیت.`}
                    </p>
                    <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
                        <a href="teacher-dashboard.html" class="btn-action-primary" style="padding:9px 18px; text-decoration:none; background:linear-gradient(135deg, #00b4d8, #7209b7);">
                            <i class="fas fa-magic"></i> دروستکرنی وانە و پرسیار بە Gemini AI
                        </a>
                        <button class="btn-action-secondary" id="btn-show-all-subs" style="padding:9px 16px;">
                            <i class="fas fa-th-large"></i> هەموو مامۆستایانی پۆل
                        </button>
                        <button class="btn-action-secondary" id="try-other-lang-btn" style="padding:9px 16px;">
                            <i class="fas fa-globe"></i> شێوەزاری تر (${currentLanguage === 'ku_ba' ? 'سۆرانی' : 'باهدینی'})
                        </button>
                    </div>
                </div>
            `;
            const showAllBtn = document.getElementById('btn-show-all-subs');
            if (showAllBtn) {
                showAllBtn.addEventListener('click', () => selectSubject('all', false));
            }
            const tryBtn = document.getElementById('try-other-lang-btn');
            if (tryBtn) {
                tryBtn.addEventListener('click', () => {
                    const nextLang = currentLanguage === 'ku_ba' ? 'ku_so' : 'ku_ba';
                    dataStore.setActiveLanguage(nextLang);
                    updateLanguageUI(nextLang);
                });
            }
            return;
        }

        teachersListContainer.innerHTML = teachers.map((teacher, index) => {
            const isRank1 = index === 0;
            const rankBadgeHtml = isRank1 
                ? `<span class="rank-badge"><i class="fas fa-fire"></i> پلە ١ - زۆرترین بینەر</span>`
                : `<span style="font-size:0.75rem; color:var(--secondary-text);"><i class="fas fa-award"></i> پلە ${index + 1}</span>`;

            // Count available approved items for this teacher
            const vCount = dataStore.getAllVideos(true, null, false, currentLanguage).filter(v => v.teacherId === teacher.id && (String(v.grade) === String(pola) || !v.grade)).length;
            const qCount = dataStore.getAllQuizzes(true, null, false, currentLanguage).filter(q => q.teacherId === teacher.id && (String(q.grade) === String(pola) || !q.grade)).length;
            const mCount = dataStore.getAllMalzamas(true, null, false, currentLanguage).filter(m => m.teacherId === teacher.id && (String(m.grade) === String(pola) || !m.grade)).length;

            const isSelected = currentSelectedTeacher && currentSelectedTeacher.id === teacher.id;

            return `
                <div class="teacher-card-interactive ${isSelected ? 'active-selected' : ''}" data-teacher-id="${teacher.id}">
                    <div>
                        <div style="display:flex; align-items:center; gap: 14px; margin-bottom: 12px;">
                            <img class="t-avatar" src="${teacher.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}" alt="${teacher.name}">
                            <div style="flex:1;">
                                <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
                                    <h3 style="margin:0; font-size: 1.1rem;">${teacher.name}</h3>
                                    ${rankBadgeHtml}
                                </div>
                                <p style="margin: 3px 0 0; color: var(--blue-accent); font-size: 0.88rem; font-weight:600;">
                                    ${teacher.subject || 'کیمیا'}
                                </p>
                                <span style="font-size: 0.78rem; color: var(--secondary-text);">
                                    <i class="fas fa-eye" style="color:var(--blue-accent);"></i> ${(teacher.viewsCount || 0).toLocaleString()} بینەر
                                </span>
                            </div>
                        </div>
                        <p style="margin:0 0 12px; font-size:0.82rem; color:var(--secondary-text); line-height:1.4;">
                            ${teacher.bio || 'مامۆستایێ تایبەتمەند یێ بابەتی'}
                        </p>
                    </div>

                    <div>
                        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px;">
                            <span class="teacher-meta-pill"><i class="fas fa-file-alt" style="color:#28a745;"></i> ${mCount} مەلزەمە</span>
                            <span class="teacher-meta-pill"><i class="fas fa-video" style="color:#e63946;"></i> ${vCount} ڤیدیۆ</span>
                            <span class="teacher-meta-pill"><i class="fas fa-question-circle" style="color:#8a2be2;"></i> ${qCount} پرسیار</span>
                        </div>
                        <button class="btn-action-primary" style="width:100%; justify-content:center; padding:9px;">
                            <span>تەماشاکرنا مەلزەمە، ڤیدیۆ و پرسیاران</span>
                            <i class="fas fa-chevron-left" style="font-size:0.8rem;"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach click handlers to teacher cards
        teachersListContainer.querySelectorAll('.teacher-card-interactive').forEach(card => {
            card.addEventListener('click', () => {
                const teacherId = card.getAttribute('data-teacher-id');
                const teacher = dataStore.getTeacherById(teacherId);
                if (teacher) {
                    selectTeacher(teacher, true);
                }
            });
        });
    }

    // Handle Teacher Selection
    function selectTeacher(teacher, shouldScroll = false) {
        currentSelectedTeacher = teacher;

        // Highlight selected teacher card
        if (teachersListContainer) {
            teachersListContainer.querySelectorAll('.teacher-card-interactive').forEach(c => {
                c.classList.toggle('active-selected', c.getAttribute('data-teacher-id') === teacher.id);
            });
        }

        // Increment Views for Teacher
        dataStore.incrementViews(teacher.id);

        updateStepperUI();
        loadTeacherContent(teacher);

        if (shouldScroll) {
            teacherContentPortal.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // ==========================================
    // 4. STEP 3: CONTENT PORTAL (MALZAMA, VIDEOS, QUIZZES)
    // ==========================================
    function loadTeacherContent(teacher) {
        teacherContentPortal.style.display = 'block';

        activeTeacherAvatar.src = teacher.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
        activeTeacherName.textContent = teacher.name;
        activeTeacherSubject.textContent = `${teacher.subject} • ${dataStore.getLanguageLabel(currentLanguage)}`;
        if (activeTeacherBio) activeTeacherBio.textContent = teacher.bio || 'مامۆستایێ شارەزا';
        activeTeacherViews.textContent = (teacher.viewsCount || 0).toLocaleString();

        // 1. Load Malzamas (PowerPoint, HTML, Image, PDF)
        const allMalzamas = dataStore.getAllMalzamas(true, null, false, currentLanguage);
        const teacherMalzamas = allMalzamas.filter(m => m.teacherId === teacher.id && (String(m.grade) === String(pola) || !m.grade));
        countMalzama.textContent = teacherMalzamas.length;

        if (teacherMalzamas.length === 0) {
            malzamaContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align:center; padding:35px 20px; color:var(--secondary-text);">
                    <i class="fas fa-folder-open" style="font-size:2.4rem; opacity:0.4; margin-bottom:8px;"></i>
                    <p style="margin:0;">هیچ مەلزەمەیەک بۆ ئەم مامۆستایە لەم پۆلەدا نەدۆزرایەوە.</p>
                </div>
            `;
        } else {
            malzamaContainer.innerHTML = teacherMalzamas.map(m => {
                const badgeClass = m.fileType || 'pdf';
                const typeIcon = {
                    pptx: 'fa-file-powerpoint',
                    html: 'fa-code',
                    image: 'fa-file-image',
                    pdf: 'fa-file-pdf'
                }[badgeClass] || 'fa-file';

                return `
                    <div class="content-card-box">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span class="format-tag ${badgeClass}">
                                    <i class="fas ${typeIcon}"></i> ${(m.fileType || 'pdf').toUpperCase()}
                                </span>
                                <span style="font-size:0.75rem; color:var(--secondary-text);">${m.fileSize || '2.5 MB'}</span>
                            </div>
                            <h4 style="margin:0 0 5px; font-size:1.02rem; color:var(--primary-text);">${m.title}</h4>
                            <p style="margin:0 0 10px; font-size:0.8rem; color:var(--secondary-text); line-height:1.4;">
                                ${m.description || m.chapter || ''}
                            </p>
                        </div>
                        <div style="display:flex; gap:8px; margin-top:10px;">
                            <button class="btn-action-primary btn-open-doc" data-doc-id="${m.id}" style="flex:1; justify-content:center; padding:7px;">
                                <i class="fas fa-eye"></i> پیشاندان لە پەڕەدا
                            </button>
                            <a href="${m.fileUrl || '#'}" download target="_blank" class="btn-action-secondary" style="padding:7px 12px;" title="داگرتن">
                                <i class="fas fa-download"></i>
                            </a>
                        </div>
                    </div>
                `;
            }).join('');

            malzamaContainer.querySelectorAll('.btn-open-doc').forEach(btn => {
                btn.addEventListener('click', () => {
                    const docId = btn.getAttribute('data-doc-id');
                    const item = teacherMalzamas.find(m => m.id === docId);
                    if (item) openDocumentModal(item, teacher);
                });
            });
        }

        // 2. Load YouTube Videos
        const allVideos = dataStore.getAllVideos(true, null, false, currentLanguage);
        const teacherVideos = allVideos.filter(v => v.teacherId === teacher.id && (String(v.grade) === String(pola) || !v.grade));
        countVideos.textContent = teacherVideos.length;

        if (teacherVideos.length === 0) {
            videosContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align:center; padding:35px 20px; color:var(--secondary-text);">
                    <i class="fas fa-video-slash" style="font-size:2.4rem; opacity:0.4; margin-bottom:8px;"></i>
                    <p style="margin:0;">هیچ وانەیەکی تۆمارکراو بۆ ئەم مامۆستایە نییە.</p>
                </div>
            `;
        } else {
            videosContainer.innerHTML = teacherVideos.map(v => {
                const yId = dataStore.getYoutubeId(v.youtubeUrl);
                const thumb = yId ? `https://img.youtube.com/vi/${yId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80';

                return `
                    <div class="content-card-box">
                        <div style="position:relative; width:100%; padding-bottom:56.25%; border-radius:8px; overflow:hidden; background:#000; margin-bottom:10px;">
                            <img src="${thumb}" alt="${v.title}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; opacity:0.85;">
                            <button class="btn-play-video" data-video-id="${v.id}" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:48px; height:48px; border-radius:50%; background:rgba(230,57,70,0.9); border:none; color:#fff; font-size:1.3rem; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 15px rgba(0,0,0,0.5);">
                                <i class="fas fa-play" style="margin-left:-2px;"></i>
                            </button>
                        </div>
                        <h4 style="margin:0 0 4px; font-size:0.98rem; color:var(--primary-text);">${v.title}</h4>
                        <p style="margin:0 0 10px; font-size:0.78rem; color:var(--secondary-text);">${v.chapter || ''}</p>
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.76rem; color:var(--secondary-text);">
                            <span><i class="fas fa-eye" style="color:var(--blue-accent);"></i> ${(v.views || 0).toLocaleString()} بینەر</span>
                            <button class="btn-action-primary btn-play-video" data-video-id="${v.id}" style="padding:4px 12px; font-size:0.78rem; background:#e63946;">
                                <i class="fas fa-play"></i> دەستپێکردنی وانە
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            videosContainer.querySelectorAll('.btn-play-video').forEach(btn => {
                btn.addEventListener('click', () => {
                    const vId = btn.getAttribute('data-video-id');
                    const video = teacherVideos.find(v => v.id === vId);
                    if (video) openVideoModal(video);
                });
            });
        }

        // 3. Load Quizzes (پرسیارێن هەڵبژارتن)
        const allQuizzes = dataStore.getAllQuizzes(true, null, false, currentLanguage);
        const teacherQuizzes = allQuizzes.filter(q => q.teacherId === teacher.id && (String(q.grade) === String(pola) || !q.grade));
        countQuizzes.textContent = teacherQuizzes.length;

        if (teacherQuizzes.length === 0) {
            quizzesContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align:center; padding:35px 20px; color:var(--secondary-text);">
                    <i class="fas fa-question-circle" style="font-size:2.4rem; opacity:0.4; margin-bottom:8px;"></i>
                    <p style="margin:0;">هیچ تاقیکردنەوەیەکی هەڵبژاردن بۆ ئەم مامۆستایە نییە.</p>
                </div>
            `;
        } else {
            quizzesContainer.innerHTML = teacherQuizzes.map(q => `
                <div class="content-card-box" style="border-right: 4px solid #8a2be2;">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <span style="background:rgba(138,43,226,0.12); color:#8a2be2; font-size:0.75rem; font-weight:bold; padding:3px 8px; border-radius:6px;">
                                <i class="fas fa-check-circle"></i> پرسیاری هەڵبژاردن
                            </span>
                            <span style="font-size:0.75rem; color:var(--secondary-text);">${q.chapter || 'بەندی ١'}</span>
                        </div>
                        <h4 style="margin:0 0 10px; font-size:1.02rem; color:var(--primary-text); line-height:1.4;">
                            ${q.question}
                        </h4>
                        
                        <!-- Options List -->
                        <div class="quiz-options-box" style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;">
                            ${(q.options || []).map((opt, optIdx) => `
                                <button class="btn-quiz-option" data-quiz-id="${q.id}" data-opt-idx="${optIdx}" style="text-align:right; padding:8px 12px; border-radius:8px; border:1px solid var(--border-color); background:var(--surface-color); color:var(--primary-text); font-family:inherit; font-size:0.85rem; cursor:pointer; transition:all 0.15s; display:flex; align-items:center; justify-content:space-between;">
                                    <span>${opt}</span>
                                    <i class="far fa-circle" style="font-size:0.8rem; opacity:0.6;"></i>
                                </button>
                            `).join('')}
                        </div>

                        <!-- Feedback Box (Hidden initially) -->
                        <div class="quiz-feedback-box" id="feedback-${q.id}" style="display:none; padding:10px; border-radius:8px; font-size:0.82rem; margin-bottom:10px;">
                        </div>
                    </div>

                    <div style="font-size:0.75rem; color:var(--secondary-text); text-align:left;">
                        <span>تەواوکراوە: ${(q.views || 0)} جار</span>
                    </div>
                </div>
            `).join('');

            // Quiz Option Click Handlers
            quizzesContainer.querySelectorAll('.btn-quiz-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    const qId = btn.getAttribute('data-quiz-id');
                    const optIdx = parseInt(btn.getAttribute('data-opt-idx'), 10);
                    const quiz = teacherQuizzes.find(item => item.id === qId);
                    if (!quiz) return;

                    const parentCard = btn.closest('.content-card-box');
                    const feedbackEl = document.getElementById(`feedback-${qId}`);
                    const allOptBtns = parentCard.querySelectorAll('.btn-quiz-option');

                    const isCorrect = optIdx === quiz.correctIndex;

                    allOptBtns.forEach((b, idx) => {
                        b.disabled = true;
                        if (idx === quiz.correctIndex) {
                            b.style.background = 'rgba(40,167,69,0.18)';
                            b.style.borderColor = '#28a745';
                            b.style.color = '#28a745';
                            b.querySelector('i').className = 'fas fa-check-circle';
                        } else if (idx === optIdx && !isCorrect) {
                            b.style.background = 'rgba(230,57,70,0.18)';
                            b.style.borderColor = '#e63946';
                            b.style.color = '#e63946';
                            b.querySelector('i').className = 'fas fa-times-circle';
                        }
                    });

                    if (feedbackEl) {
                        feedbackEl.style.display = 'block';
                        if (isCorrect) {
                            feedbackEl.style.background = 'rgba(40,167,69,0.12)';
                            feedbackEl.style.color = '#28a745';
                            feedbackEl.innerHTML = `<strong><i class="fas fa-check"></i> وەڵامێ تە درستە!</strong> ${quiz.explanation || ''}`;
                        } else {
                            feedbackEl.style.background = 'rgba(230,57,70,0.12)';
                            feedbackEl.style.color = '#e63946';
                            feedbackEl.innerHTML = `<strong><i class="fas fa-times"></i> وەڵام خەڵەتە!</strong> وەڵامێ درست: "${quiz.options[quiz.correctIndex]}". ${quiz.explanation || ''}`;
                        }
                    }

                    dataStore.incrementViews(teacher.id, quiz.id, 'quiz');
                });
            });
        }
    }

    if (closeTeacherPortalBtn) {
        closeTeacherPortalBtn.addEventListener('click', () => {
            teacherContentPortal.style.display = 'none';
            currentSelectedTeacher = null;
            if (teachersListContainer) {
                teachersListContainer.querySelectorAll('.teacher-card-interactive').forEach(c => {
                    c.classList.remove('active-selected');
                });
            }
            updateStepperUI();
            step2Section.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Tabs switching
    contentTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            contentTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');

            document.getElementById('panel-malzama').style.display = target === 'malzama' ? 'block' : 'none';
            document.getElementById('panel-videos').style.display = target === 'videos' ? 'block' : 'none';
            document.getElementById('panel-quizzes').style.display = target === 'quizzes' ? 'block' : 'none';
        });
    });

    // ==========================================
    // 5. DOCUMENT VIEWER MODAL (PPTX, HTML, Image, PDF)
    // ==========================================
    function openDocumentModal(item, teacher) {
        currentViewingDocItem = item;
        currentViewingDocTeacher = teacher;

        docModalTitle.textContent = item.title;
        docModalTeacher.innerHTML = `<i class="fas fa-chalkboard-teacher"></i> ${teacher.name}`;
        docModalSize.innerHTML = `<i class="fas fa-weight-hanging"></i> ${item.fileSize || '2.5 MB'}`;
        docModalDownload.href = item.fileUrl || '#';
        docModalBadge.className = `format-tag ${item.fileType || 'pdf'}`;
        docModalBadge.textContent = (item.fileType || 'pdf').toUpperCase();

        const type = (item.fileType || 'pdf').toLowerCase();
        let contentHtml = '';

        if (type === 'pptx') {
            contentHtml = `
                <div style="text-align:center; padding:30px; color:#ffffff; max-width:550px;">
                    <i class="fas fa-file-powerpoint" style="font-size: 4rem; color: #d83b01; margin-bottom: 16px;"></i>
                    <h3 style="margin: 0 0 10px; font-size: 1.3rem;">سلایدێن مایکرۆسۆفت پاوەرپۆینت (PPTX)</h3>
                    <p style="margin: 0 0 20px; font-size: 0.9rem; color: #cccccc; line-height: 1.5;">
                        ئەڤ پەڕاوە ب شێوازێ سلاید هاتینە ئامادەکرن. دشێی ب شێوازێ تەواو دابگری یان ل Microsoft 365 ڤەکەی.
                    </p>
                    <div style="display:flex; justify-content:center; gap: 10px; flex-wrap:wrap;">
                        <a href="${item.fileUrl}" target="_blank" download class="btn-action-primary" style="padding: 10px 22px; font-size: 0.95rem; background:#d83b01;">
                            <i class="fas fa-download"></i> داگرتنا پاوەرپۆینت (${item.fileSize || '5.0 MB'})
                        </a>
                        <a href="https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(item.fileUrl)}" target="_blank" class="btn-action-secondary" style="padding: 10px 18px; color:#fff; border-color:#666;">
                            <i class="fas fa-external-link-alt"></i> ڤەکرن ل Office Viewer
                        </a>
                    </div>
                </div>
            `;
        } else if (type === 'html') {
            docViewport.innerHTML = '';
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '640px';
            iframe.style.border = 'none';
            iframe.style.borderRadius = '12px';
            iframe.style.background = '#0a0f1d';
            iframe.srcdoc = item.htmlContent || `<div style="padding:40px; text-align:center; font-family:sans-serif; color:#fff;"><h2>${item.title}</h2><p>${item.description || ''}</p></div>`;
            docViewport.appendChild(iframe);
            docModal.classList.add('open');
            dataStore.incrementViews(teacher.id, item.id, 'malzama');
            return;
        } else if (type === 'image') {
            contentHtml = `
                <div style="padding:20px; text-align:center;">
                    <img src="${item.fileUrl || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80'}" alt="${item.title}" style="max-width:100%; max-height:75vh; border-radius:8px; box-shadow:0 8px 30px rgba(0,0,0,0.5);">
                </div>
            `;
        } else {
            // PDF
            contentHtml = `
                <iframe src="${item.fileUrl || 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf'}" style="width:100%; height:550px; border:none; background:#ffffff;"></iframe>
            `;
        }

        docViewport.innerHTML = contentHtml;
        docModal.classList.add('open');
        dataStore.incrementViews(teacher.id, item.id, 'malzama');
    }

    if (closeDocBtn) {
        closeDocBtn.addEventListener('click', () => {
            docModal.classList.remove('open');
            docViewport.innerHTML = '';
        });
    }

    if (docModalGdriveSave) {
        docModalGdriveSave.addEventListener('click', async () => {
            if (!currentViewingDocItem) return;
            if (!window.GoogleDriveService) {
                alert('گووگڵ درایڤ ئامادە نییە.');
                return;
            }

            if (!window.GoogleDriveService.getAccessToken()) {
                const wantAuth = confirm('بۆ پاشەکەوتکردن لە Google Drive پێویستە بچیتە ژوورەوە بە هەژماری Google. ئایا دەتەوێت پەیوەست بیت؟');
                if (!wantAuth) return;
                try {
                    await window.GoogleDriveService.signInWithGoogle();
                } catch (e) {
                    alert('پەیوەستبوون سەرکەوتوو نەبوو: ' + e.message);
                    return;
                }
            }

            const item = currentViewingDocItem;
            const teacher = currentViewingDocTeacher || { name: 'مامۆستا' };
            docModalGdriveSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> دەپاشەکەوتکرێت...';

            try {
                let contentToUpload;
                let mimeType = 'text/html';
                let fileName = `${item.title}.html`;

                if (item.fileType === 'html' && item.htmlContent) {
                    contentToUpload = item.htmlContent;
                    mimeType = 'text/html';
                    fileName = `${item.title}.html`;
                } else if (item.fileUrl) {
                    contentToUpload = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${item.title}</title><meta http-equiv="refresh" content="0; url=${item.fileUrl}"></head><body><h3>${item.title}</h3><p>مامۆستا: ${teacher.name}</p><a href="${item.fileUrl}">کلیک لێرە بکە بۆ کردنەوەی فایلەکە</a></body></html>`;
                    mimeType = 'text/html';
                    fileName = `${item.title} - لینک.html`;
                } else {
                    contentToUpload = `<h1>${item.title}</h1><p>مامۆستا: ${teacher.name}</p><p>${item.description || ''}</p>`;
                    mimeType = 'text/html';
                    fileName = `${item.title}.html`;
                }

                await window.GoogleDriveService.uploadFile({
                    name: fileName,
                    content: contentToUpload,
                    mimeType: mimeType,
                    description: `کەرەستەی خوێندن لە پلاتفۆرمی پۆلا 10-11-12 - مامۆستا ${teacher.name}`
                });

                alert(`مەلزەمەی (${item.title}) بە سەرکەوتوویی لە Google Drive ی تۆ پاشەکەوت کرا!`);
            } catch (err) {
                alert('هەڵە لە پاشەکەوتکردن لە Drive: ' + err.message);
            } finally {
                docModalGdriveSave.innerHTML = '<i class="fab fa-google-drive"></i> پاشەکەوت لە Drive';
            }
        });
    }

    // ==========================================
    // 6. VIDEO PLAYER MODAL
    // ==========================================
    function openVideoModal(video) {
        const yId = dataStore.getYoutubeId(video.youtubeUrl);
        if (!yId) return;

        modalVideoTitle.textContent = video.title;
        modalVideoChapter.textContent = video.chapter || '';
        youtubeIframe.src = `https://www.youtube.com/embed/${yId}?autoplay=1&enablejsapi=1`;
        videoModal.classList.add('open');

        dataStore.incrementViews(video.teacherId, video.id, 'video');
    }

    if (closePlayerBtn) {
        closePlayerBtn.addEventListener('click', () => {
            videoModal.classList.remove('open');
            youtubeIframe.src = '';
        });
    }

    // Close Modals on Overlay Click
    [docModal, videoModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('open');
                    if (youtubeIframe) youtubeIframe.src = '';
                }
            });
        }
    });

    // ==========================================
    // 7. LANGUAGE FILTER CONTROLS
    // ==========================================
    function updateLanguageUI(lang) {
        currentLanguage = lang;
        if (activeLangText) {
            activeLangText.textContent = `(${dataStore.getLanguageLabel(lang)})`;
        }
        langPills.forEach(pill => {
            pill.classList.toggle('active', pill.getAttribute('data-lang') === lang);
        });

        // Re-render Subjects and Teachers with current language
        renderGradeSubjects();
        renderGradeTeachers();

        // If a teacher was active in old language, refresh or close if different
        if (currentSelectedTeacher) {
            if (currentSelectedTeacher.lang && currentSelectedTeacher.lang !== lang) {
                teacherContentPortal.style.display = 'none';
                currentSelectedTeacher = null;
                updateStepperUI();
            } else {
                loadTeacherContent(currentSelectedTeacher);
            }
        }
    }

    langPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const chosenLang = pill.getAttribute('data-lang');
            dataStore.setActiveLanguage(chosenLang);
            updateLanguageUI(chosenLang);
        });
    });

    window.addEventListener('languageChanged', (e) => {
        if (e.detail && e.detail.lang) {
            updateLanguageUI(e.detail.lang);
        }
    });

    // ==========================================
    // 8. INITIAL BOOTSTRAP
    // ==========================================
    renderGradeSubjects();
    updateStepperUI();

    // If initialSubjectParam was passed, select it immediately
    if (initialSubjectParam) {
        selectSubject(initialSubjectParam, false);

        // If teacher was also passed in URL, auto-select them
        if (initialTeacherParam) {
            const foundTeacher = dataStore.getTeacherById(initialTeacherParam);
            if (foundTeacher) {
                selectTeacher(foundTeacher, false);
            }
        }
    } else {
        renderGradeTeachers(); // Shows waiting prompt initially
    }
});
