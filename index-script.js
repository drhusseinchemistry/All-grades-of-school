// =========================================================================
// Homepage Controller (UPDATED)
// Manages:
// 1. All 13 Grades (KG to 12) & Student Chosen Grades Filter
// 2. Student Grade Onboarding Modal (Automatic on first entry)
// 3. Settings Modal (بەشێ ڕێکخستن) for changing followed grades & language
// 4. Role Selection (Student vs Teacher vs Super Admin)
// 5. Strict Language Matching for Content and Teachers
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const dataStore = window.EducationalData;
    const gradesConfig = window.GRADES_CONFIG;

    // Elements
    const gradesContainer = document.getElementById('grades-grid-container');
    const filterButtons = document.querySelectorAll('.g-filter-btn');
    const totalVisibleGradesCount = document.getElementById('total-visible-grades-count');

    // Followed Grades Banner
    const followedBanner = document.getElementById('followed-grades-banner');
    const followedGradesNames = document.getElementById('followed-grades-names');
    const editFollowedBtn = document.getElementById('edit-followed-grades-btn');
    const showAllGradesToggle = document.getElementById('show-all-grades-toggle');

    // Role Indicator Elements
    const homeRoleBadge = document.getElementById('home-role-badge');
    const homeRoleText = document.getElementById('home-role-text');
    const homeTeacherLink = document.getElementById('home-teacher-link');
    const homeAdminLink = document.getElementById('home-admin-link');
    const homeLangIndicator = document.getElementById('home-lang-indicator');
    const openRoleSelectorBtn = document.getElementById('open-role-selector-btn');

    // Modals
    const roleModal = document.getElementById('role-selection-modal');
    const closeRoleModalBtn = document.getElementById('close-role-modal-btn');
    const chooseStudentBtn = document.getElementById('choose-student-btn');
    const chooseTeacherBtn = document.getElementById('choose-teacher-btn');
    const chooseAdminBtn = document.getElementById('choose-admin-btn');

    // Student Onboarding Modal
    const studentGradesModal = document.getElementById('student-grades-modal');
    const onboardGradesGrid = document.getElementById('onboard-grades-grid');
    const saveStudentGradesBtn = document.getElementById('save-student-grades-btn');
    const presetGradesBtns = document.querySelectorAll('.preset-grades-btn');

    // Settings Modal (بەشێ ڕێکخستن)
    const settingsModal = document.getElementById('settings-modal');
    const settingsToggleBtn = document.getElementById('settings-toggle-btn');
    const openSettingsBtn = document.getElementById('open-settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const settingsGradesGrid = document.getElementById('settings-grades-grid');
    const saveAllSettingsBtn = document.getElementById('save-all-settings-btn');
    const settingsCheckAllBtn = document.getElementById('settings-check-all-btn');
    const settingsCheckHighBtn = document.getElementById('settings-check-high-btn');
    const setLightThemeBtn = document.getElementById('set-light-theme-btn');
    const setDarkThemeBtn = document.getElementById('set-dark-theme-btn');

    // Teacher Register Modal
    const teacherRegModal = document.getElementById('teacher-register-modal');
    const closeTeacherRegBtn = document.getElementById('close-teacher-reg-btn');
    const teacherRegForm = document.getElementById('teacher-register-form');

    // Admin Fast Login
    const loginModal = document.getElementById('login-modal');
    const adminLoginTrigger = document.getElementById('admin-login-trigger');
    const fastAdminAuthBtn = document.getElementById('fast-admin-auth-btn');

    let currentLevelFilter = 'all';
    let isShowingAllTemporarily = false;

    // ==========================================
    // 1. POPULATE ONBOARDING & SETTINGS CHECKBOXES
    // ==========================================
    function createGradeCheckboxes(containerEl, preSelectedIds = []) {
        if (!containerEl) return;
        containerEl.innerHTML = gradesConfig.map(g => {
            const isChecked = preSelectedIds.includes(g.id);
            return `
                <label class="grade-check-item">
                    <input type="checkbox" value="${g.id}" ${isChecked ? 'checked' : ''} class="grade-check-box">
                    <span>${g.name}</span>
                </label>
            `;
        }).join('');
    }

    // ==========================================
    // 2. RENDER HOMEPAGE GRADES GRID
    // (Followed Grades Filter + Level Filter)
    // ==========================================
    function renderGrades() {
        const studentFollowed = dataStore.getStudentGrades();
        const currentLang = dataStore.getActiveLanguage();

        // Update banner
        if (studentFollowed && studentFollowed.length > 0 && !isShowingAllTemporarily) {
            followedBanner.style.display = 'flex';
            const namesList = studentFollowed.map(id => {
                const g = gradesConfig.find(item => item.id === String(id));
                return g ? g.shortName : id;
            }).join('، ');
            followedGradesNames.textContent = namesList;
            showAllGradesToggle.textContent = 'نیشاندانی هەموو پۆلەکان (١٣ پۆل)';
        } else {
            if (studentFollowed && studentFollowed.length > 0 && isShowingAllTemporarily) {
                followedBanner.style.display = 'flex';
                followedGradesNames.textContent = 'هەموو پۆلەکان پیشان دەدرێن';
                showAllGradesToggle.textContent = 'گەڕانەوە بۆ پۆلەکانی من';
            } else {
                followedBanner.style.display = 'none';
            }
        }

        // Filter by student preference unless showing all
        let activeGrades = gradesConfig;
        if (studentFollowed && studentFollowed.length > 0 && !isShowingAllTemporarily) {
            activeGrades = gradesConfig.filter(g => studentFollowed.includes(g.id));
        }

        // Filter by educational level (kindergarten, primary, middle, high)
        let filtered = activeGrades;
        if (currentLevelFilter !== 'all') {
            filtered = activeGrades.filter(g => g.level === currentLevelFilter);
        }

        totalVisibleGradesCount.textContent = `${filtered.length} لە ${gradesConfig.length} پۆل`;

        if (filtered.length === 0) {
            gradesContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: var(--surface-color); border-radius: 14px; border: 1px solid var(--border-color); color: var(--secondary-text);">
                    <i class="fas fa-filter" style="font-size: 2.5rem; margin-bottom: 10px; opacity: 0.5;"></i>
                    <h3>هیچ پۆلێک لەم بەشەدا نییە بەپێی هەڵبژاردنی ئێوە</h3>
                    <button class="btn-save" id="reset-grade-view-btn" style="margin-top:10px; padding:8px 18px; font-size:0.85rem;">
                        نیشاندانی گشت پۆلەکان
                    </button>
                </div>
            `;
            const resetBtn = document.getElementById('reset-grade-view-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    isShowingAllTemporarily = true;
                    currentLevelFilter = 'all';
                    filterButtons.forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
                    renderGrades();
                });
            }
            return;
        }

        gradesContainer.innerHTML = filtered.map(g => {
            // Count teachers available for this grade in the CURRENT language
            const teachersInGrade = dataStore.getTeachersForGrade(g.id, currentLang);
            const teacherCount = teachersInGrade.length;
            const subjects = dataStore.getSubjectsForGrade ? dataStore.getSubjectsForGrade(g.id) : [];
            const subjectsPills = subjects.slice(0, 6).map(s => `
                <a href="grade.html?pola=${g.id}&subject=${s.id}" class="grade-sub-pill" onclick="event.stopPropagation();" style="display:inline-block; font-size:0.72rem; padding:2px 8px; border-radius:10px; background:${s.color || '#007bff'}18; color:${s.color || 'var(--blue-accent)'}; border:1px solid ${s.color || '#007bff'}30; text-decoration:none; margin:2px 2px 2px 0; font-weight:600; transition:all 0.15s;">
                    ${s.name}
                </a>
            `).join('');

            return `
                <div onclick="window.location.href='grade.html?pola=${g.id}'" class="grade-card-item" style="border-right-color: ${g.color || '#007bff'}; cursor:pointer;">
                    <div class="grade-card-icon" style="background: ${g.color}18; color: ${g.color || '#007bff'};">
                        <i class="fas ${g.icon || 'fa-school'}"></i>
                    </div>
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 4px; font-size: 1.05rem;">${g.name}</h3>
                        <p style="margin: 0 0 4px; color: var(--secondary-text); font-size: 0.8rem;">
                            <i class="fas fa-users" style="color:var(--blue-accent);"></i> ${teacherCount} مامۆستا (${dataStore.getLanguageLabel(currentLang)})
                        </p>
                        ${subjectsPills ? `
                        <div style="margin-top: 4px; display:flex; flex-wrap:wrap; gap:3px; align-items:center;">
                            <span style="font-size:0.72rem; color:var(--secondary-text); margin-left:3px;"><i class="fas fa-layer-group"></i> بابەتەکان:</span>
                            ${subjectsPills}
                        </div>
                        ` : ''}
                    </div>
                    <i class="fas fa-chevron-left" style="color: var(--secondary-text); font-size: 0.85rem; margin-right:8px;"></i>
                </div>
            `;
        }).join('');
    }

    // Level Filter Pills
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLevelFilter = btn.getAttribute('data-filter');
            renderGrades();
        });
    });

    // Toggle Show All Grades vs Followed
    if (showAllGradesToggle) {
        showAllGradesToggle.addEventListener('click', () => {
            isShowingAllTemporarily = !isShowingAllTemporarily;
            renderGrades();
        });
    }

    // ==========================================
    // 3. ROLE MANAGEMENT & INITIAL LAUNCH
    // ==========================================
    function updateRoleUI() {
        const role = dataStore.getUserRole();
        const isSuperAdmin = dataStore.isCurrentUserSuperAdmin();
        const currentLang = dataStore.getActiveLanguage();

        if (homeLangIndicator) {
            homeLangIndicator.textContent = dataStore.getLanguageLabel(currentLang);
        }

        if (isSuperAdmin) {
            homeRoleBadge.className = 'role-badge-pill admin';
            homeRoleText.innerHTML = '<i class="fas fa-shield-alt"></i> ئەدمینێ گشتی';
            homeAdminLink.style.display = 'inline-flex';
            homeTeacherLink.style.display = 'inline-flex';
        } else if (role === 'teacher') {
            homeRoleBadge.className = 'role-badge-pill teacher';
            homeRoleText.innerHTML = '<i class="fas fa-chalkboard-teacher"></i> مامۆستا';
            homeTeacherLink.style.display = 'inline-flex';
            homeAdminLink.style.display = 'none';
        } else {
            homeRoleBadge.className = 'role-badge-pill';
            homeRoleText.innerHTML = '<i class="fas fa-user-graduate"></i> قوتابی';
            homeTeacherLink.style.display = 'none';
            homeAdminLink.style.display = 'none';
        }

        renderGrades();
    }

    // Open Role Selector Modal
    openRoleSelectorBtn.addEventListener('click', () => {
        roleModal.style.display = 'flex';
    });

    closeRoleModalBtn.addEventListener('click', () => {
        roleModal.style.display = 'none';
    });

    // Option 1: Choose Student -> Trigger Onboarding if no grades chosen
    chooseStudentBtn.addEventListener('click', () => {
        dataStore.setUserRole('student');
        roleModal.style.display = 'none';

        // Check if student has chosen grades
        if (!dataStore.hasStudentChosenGrades()) {
            openStudentOnboardingModal();
        } else {
            updateRoleUI();
        }
    });

    // Option 2: Choose Teacher -> Register or Dashboard
    chooseTeacherBtn.addEventListener('click', () => {
        roleModal.style.display = 'none';
        const currentTeacher = dataStore.getCurrentTeacher();
        if (currentTeacher) {
            dataStore.setUserRole('teacher');
            window.location.href = 'teacher-dashboard.html';
        } else {
            teacherRegModal.style.display = 'flex';
        }
    });

    // Option 3: Super Admin Fast Track
    chooseAdminBtn.addEventListener('click', () => {
        roleModal.style.display = 'none';
        activateSuperAdminMode();
    });

    function activateSuperAdminMode() {
        localStorage.setItem('is_admin_mode_active', 'true');
        dataStore.setUserRole('super_admin');
        const adminTeacher = dataStore.getTeacherById('t_hussein') || {
            id: 't_hussein',
            name: 'م. حسێن ئەکرەم زێباری',
            email: 'Hussein.zebary.chemistry96@gmail.com',
            subject: 'کیمیا (Chemistry)',
            viewsCount: 4250,
            grades: ['10', '11', '12', '9'],
            lang: 'ku_ba',
            status: 'approved'
        };
        dataStore.setCurrentTeacher(adminTeacher);
        updateRoleUI();
        alert('بەخێربێیت م. حسێن ئەکرەم زێباری! دەسەڵاتی ئەدمینی گشتی چالاک کرا.');
        window.location.href = 'admin-panel.html';
    }

    // ==========================================
    // 4. STUDENT ONBOARDING MODAL
    // ==========================================
    function openStudentOnboardingModal() {
        // Default check High School grades (10, 11, 12)
        createGradeCheckboxes(onboardGradesGrid, ['10', '11', '12']);
        studentGradesModal.style.display = 'flex';
    }

    presetGradesBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.getAttribute('data-preset');
            let ids = [];
            if (preset === 'high') ids = ['10', '11', '12'];
            else if (preset === 'middle') ids = ['7', '8', '9'];
            else if (preset === 'primary') ids = ['1', '2', '3', '4', '5', '6'];
            else if (preset === 'all') ids = gradesConfig.map(g => g.id);

            createGradeCheckboxes(onboardGradesGrid, ids);
        });
    });

    saveStudentGradesBtn.addEventListener('click', () => {
        const checkedBoxes = onboardGradesGrid.querySelectorAll('input[type="checkbox"]:checked');
        const selected = Array.from(checkedBoxes).map(cb => cb.value);

        if (selected.length === 0) {
            alert('تکایە بەلایەنی کەمەوە پۆلێک هەڵبژێرە.');
            return;
        }

        dataStore.setStudentGrades(selected);
        studentGradesModal.style.display = 'none';
        isShowingAllTemporarily = false;
        updateRoleUI();
    });

    // ==========================================
    // 5. SETTINGS MODAL (بەشێ ڕێکخستن)
    // ==========================================
    function openSettingsModal() {
        const currentFollowed = dataStore.getStudentGrades() || ['10', '11', '12'];
        createGradeCheckboxes(settingsGradesGrid, currentFollowed);

        // Language Radios
        const currentLang = dataStore.getActiveLanguage();
        document.querySelectorAll('#settings-lang-grid .lang-radio-box').forEach(box => {
            const radio = box.querySelector('input[type="radio"]');
            if (box.getAttribute('data-lang') === currentLang) {
                box.classList.add('active');
                if (radio) radio.checked = true;
            } else {
                box.classList.remove('active');
                if (radio) radio.checked = false;
            }
        });

        settingsModal.style.display = 'flex';
    }

    if (settingsToggleBtn) settingsToggleBtn.addEventListener('click', openSettingsModal);
    if (openSettingsBtn) openSettingsBtn.addEventListener('click', openSettingsModal);
    if (editFollowedBtn) editFollowedBtn.addEventListener('click', openSettingsModal);

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    // Language radio clicks inside settings
    document.querySelectorAll('#settings-lang-grid .lang-radio-box').forEach(box => {
        box.addEventListener('click', () => {
            document.querySelectorAll('#settings-lang-grid .lang-radio-box').forEach(b => b.classList.remove('active'));
            box.classList.add('active');
            const radio = box.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });

    settingsCheckAllBtn.addEventListener('click', () => {
        createGradeCheckboxes(settingsGradesGrid, gradesConfig.map(g => g.id));
    });

    settingsCheckHighBtn.addEventListener('click', () => {
        createGradeCheckboxes(settingsGradesGrid, ['10', '11', '12']);
    });

    // Theme buttons inside settings
    setLightThemeBtn.addEventListener('click', () => {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('userTheme', 'light');
    });

    setDarkThemeBtn.addEventListener('click', () => {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('userTheme', 'dark');
    });

    // Save All Settings
    saveAllSettingsBtn.addEventListener('click', () => {
        // 1. Followed grades
        const checkedBoxes = settingsGradesGrid.querySelectorAll('input[type="checkbox"]:checked');
        const selected = Array.from(checkedBoxes).map(cb => cb.value);

        if (selected.length > 0) {
            dataStore.setStudentGrades(selected);
        }

        // 2. Language
        const pickedLangRadio = document.querySelector('#settings-lang-grid input[type="radio"]:checked');
        if (pickedLangRadio && pickedLangRadio.value) {
            dataStore.setActiveLanguage(pickedLangRadio.value);
        }

        settingsModal.style.display = 'none';
        isShowingAllTemporarily = false;
        updateRoleUI();
        alert('ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوت کران.');
    });

    // ==========================================
    // 6. TEACHER ONBOARDING FORM
    // ==========================================
    closeTeacherRegBtn.addEventListener('click', () => {
        teacherRegModal.style.display = 'none';
    });

    teacherRegForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-teacher-name').value.trim();
        const subject = document.getElementById('reg-teacher-subject').value.trim();
        const contact = document.getElementById('reg-teacher-contact').value.trim();
        const lang = document.getElementById('reg-teacher-lang').value;
        const select = document.getElementById('reg-teacher-grades');
        const selectedGrades = Array.from(select.selectedOptions).map(opt => opt.value);

        const newTeacher = dataStore.saveTeacher({
            name: name,
            subject: subject,
            email: contact.includes('@') ? contact : '',
            phone: !contact.includes('@') ? contact : '',
            grades: selectedGrades.length ? selectedGrades : ['10', '11', '12'],
            lang: lang,
            viewsCount: 15
        });

        dataStore.setUserRole('teacher');
        teacherRegModal.style.display = 'none';
        alert(`بەخێربێیت مامۆستا ${name}! پڕۆفایلی ئێوە تۆمارکرا.`);
        window.location.href = 'teacher-dashboard.html';
    });

    // ==========================================
    // 7. ADMIN FAST AUTH MODAL
    // ==========================================
    if (fastAdminAuthBtn) {
        fastAdminAuthBtn.addEventListener('click', () => {
            if (loginModal) loginModal.style.display = 'none';
            activateSuperAdminMode();
        });
    }

    // ==========================================
    // 8. GOOGLE REGISTRATION & AUTH CONTROLLER
    // ==========================================
    const googleAuthModal = document.getElementById('google-auth-welcome-modal');
    const modalGoogleSigninBtn = document.getElementById('modal-google-signin-btn');
    const modalExploreGuestBtn = document.getElementById('modal-explore-guest-btn');
    const manualGoogleLoginBtn = document.getElementById('manual-google-login-btn');
    const manualGoogleName = document.getElementById('manual-google-name');
    const manualGoogleEmail = document.getElementById('manual-google-email');
    const googleAuthDiagBox = document.getElementById('google-auth-diag-box');
    const authDiagDesc = document.getElementById('auth-diag-desc');
    const quickGoogleLinkBox = document.getElementById('quick-google-link-box');
    const topUserAuthBadge = document.getElementById('top-user-auth-badge');
    const topUserAvatar = document.getElementById('top-user-avatar');
    const topUserIcon = document.getElementById('top-user-icon');
    const topUserName = document.getElementById('top-user-name');
    const btnTopGoogleLogin = document.getElementById('btn-top-google-login');
    const btnTopSignout = document.getElementById('btn-top-signout');

    // Toast Notification helper
    function showAppToast(message, type = 'info') {
        const container = document.getElementById('app-toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `app-toast ${type}`;
        const iconClass = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
        const color = type === 'success' ? '#28a745' : (type === 'error' ? '#dc3545' : '#4285F4');
        toast.innerHTML = `<i class="fas ${iconClass}" style="font-size:1.25rem; color:${color}; flex-shrink:0;"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(15px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Load initial user state (Firebase or Local Session)
    function getStoredUser() {
        try {
            const raw = localStorage.getItem('app_logged_in_user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function saveUserSession(user) {
        if (!user) {
            localStorage.removeItem('app_logged_in_user');
        } else {
            const userData = {
                displayName: user.displayName || 'بەکارهێنەری Google',
                email: user.email || '',
                photoURL: user.photoURL || '',
                uid: user.uid || 'google-user-' + Date.now()
            };
            localStorage.setItem('app_logged_in_user', JSON.stringify(userData));
        }
    }

    async function handleGoogleLogin() {
        if (modalGoogleSigninBtn) modalGoogleSigninBtn.disabled = true;
        if (btnTopGoogleLogin) btnTopGoogleLogin.disabled = true;
        if (googleAuthDiagBox) googleAuthDiagBox.style.display = 'none';

        try {
            let user = null;
            if (window.GoogleDriveService) {
                const res = await window.GoogleDriveService.signInWithGoogle();
                user = res.user;
            } else if (typeof firebase !== 'undefined' && firebase.auth) {
                const provider = new firebase.auth.GoogleAuthProvider();
                const res = await firebase.auth().signInWithPopup(provider);
                user = res.user;
            }

            if (user) {
                saveUserSession(user);
                if (window.isSuperAdmin && window.isSuperAdmin(user)) {
                    localStorage.setItem('is_admin_mode_active', 'true');
                    dataStore.setUserRole('super_admin');
                }
                if (googleAuthModal) googleAuthModal.style.display = 'none';
                sessionStorage.removeItem('guest_explored');
                updateAuthDisplay(user);
                updateRoleUI();
                showAppToast(`بەخێربێیت ${user.displayName || user.email}! خۆتۆمارکردن بە هەژماری Google بە سەرکەوتوویی ئەنجامدرا.`, 'success');
            }
        } catch (err) {
            console.warn("Google Auth error:", err);
            handleAuthErrorDiagnosis(err);
        } finally {
            if (modalGoogleSigninBtn) modalGoogleSigninBtn.disabled = false;
            if (btnTopGoogleLogin) btnTopGoogleLogin.disabled = false;
        }
    }

    // Handles Diagnosis & Explanation of Why Google Popup failed + Instant solution
    function handleAuthErrorDiagnosis(err) {
        if (!googleAuthDiagBox) return;

        let causeMessage = '';
        const errorCode = err ? (err.code || err.message || '') : '';

        if (errorCode.includes('unauthorized-domain')) {
            causeMessage = 'ئەگەری کێشە: ناونیشانی ئەم وێبگەڕە (دۆمەین) لە ناو لیستی Authorized Domains ی فایەربەیسدا چالاک نەکراوە.';
        } else if (errorCode.includes('popup-blocked')) {
            causeMessage = 'ئەگەری کێشە: وێبگەڕەکەت ڕێگری لە کردنەوەی پەنجەرەی Pop-up ی گووگڵ کردووە.';
        } else if (errorCode.includes('operation-not-allowed')) {
            causeMessage = 'ئەگەری کێشە: خزمەتگوزاری Google Sign-In لە Firebase Authentication چالاک نەکراوە.';
        } else if (errorCode.includes('popup-closed-by-user')) {
            causeMessage = 'پەنجەرەی گووگڵ پێش تەواوبوونی چوونەژوورەوە داخرا.';
        } else {
            causeMessage = 'ئەگەری کێشە: پەیوەندی بە سێرڤەری گووگڵ ڕاگیرا (' + (err.message || 'Error connecting') + ').';
        }

        if (authDiagDesc) authDiagDesc.textContent = causeMessage;
        googleAuthDiagBox.style.display = 'block';

        // Auto expand quick manual linking form so the user is never stuck
        if (quickGoogleLinkBox) {
            const detailsEl = quickGoogleLinkBox.querySelector('details');
            if (detailsEl) detailsEl.open = true;
        }
    }

    // Fallback Manual Google Linking (100% Reliable without popup)
    if (manualGoogleLoginBtn) {
        manualGoogleLoginBtn.addEventListener('click', () => {
            const name = (manualGoogleName && manualGoogleName.value.trim()) || 'بەکارهێنەری Google';
            const email = (manualGoogleEmail && manualGoogleEmail.value.trim()) || 'user@gmail.com';

            const userObj = {
                displayName: name,
                email: email,
                photoURL: ''
            };

            saveUserSession(userObj);

            if (email.toLowerCase().includes('hussein.zebary.chemistry96')) {
                localStorage.setItem('is_admin_mode_active', 'true');
                dataStore.setUserRole('super_admin');
            }

            if (googleAuthModal) googleAuthModal.style.display = 'none';
            sessionStorage.removeItem('guest_explored');
            updateAuthDisplay(userObj);
            updateRoleUI();
            showAppToast(`بەخێربێیت ${name}! بەستنەوە بە Google بە سەرکەوتوویی ئەنجامدرا و داخل بوویت.`, 'success');
        });
    }

    // Sign Out Handler (تسجیل خروج)
    async function handleSignOut() {
        try {
            if (window.GoogleDriveService) {
                await window.GoogleDriveService.signOut();
            }
            if (typeof firebase !== 'undefined' && firebase.auth) {
                await firebase.auth().signOut();
            }
        } catch (err) {
            console.error("Sign out error:", err);
        }

        saveUserSession(null);
        localStorage.removeItem('is_admin_mode_active');
        dataStore.setUserRole('student');
        updateAuthDisplay(null);
        updateRoleUI();
        showAppToast('تسجیل خروج کرا (بە سەرکەوتوویی دەرچوویت). دەتوانیت هەرکاتێک بێت دووبارە خۆت تۆمار بکەیتەوە.', 'info');
    }

    function updateAuthDisplay(user) {
        if (user) {
            if (topUserAuthBadge) topUserAuthBadge.style.display = 'inline-flex';
            if (topUserName) topUserName.textContent = user.displayName || (user.email ? user.email.split('@')[0] : 'بەکارهێنەر');
            if (user.photoURL && topUserAvatar) {
                topUserAvatar.src = user.photoURL;
                topUserAvatar.style.display = 'block';
                if (topUserIcon) topUserIcon.style.display = 'none';
            } else {
                if (topUserAvatar) topUserAvatar.style.display = 'none';
                if (topUserIcon) topUserIcon.style.display = 'block';
            }
            if (btnTopGoogleLogin) btnTopGoogleLogin.style.display = 'none';
            if (btnTopSignout) btnTopSignout.style.display = 'inline-flex';
        } else {
            if (topUserAuthBadge) topUserAuthBadge.style.display = 'none';
            if (btnTopGoogleLogin) btnTopGoogleLogin.style.display = 'inline-flex';
            if (btnTopSignout) btnTopSignout.style.display = 'none';
        }
    }

    if (modalGoogleSigninBtn) {
        modalGoogleSigninBtn.addEventListener('click', handleGoogleLogin);
    }
    if (btnTopGoogleLogin) {
        btnTopGoogleLogin.addEventListener('click', () => {
            if (googleAuthModal) googleAuthModal.style.display = 'flex';
            else handleGoogleLogin();
        });
    }
    if (btnTopSignout) {
        btnTopSignout.addEventListener('click', handleSignOut);
    }
    if (modalExploreGuestBtn) {
        modalExploreGuestBtn.addEventListener('click', () => {
            if (googleAuthModal) googleAuthModal.style.display = 'none';
            sessionStorage.setItem('guest_explored', 'true');
            // If first time and role is student without chosen grades, prompt grades
            const userRole = dataStore.getUserRole();
            if (userRole === 'student' && !dataStore.hasStudentChosenGrades()) {
                openStudentOnboardingModal();
            }
        });
    }

    // Subscribe to Firebase Auth
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                saveUserSession(user);
                updateAuthDisplay(user);
                if (window.isSuperAdmin && window.isSuperAdmin(user)) {
                    localStorage.setItem('is_admin_mode_active', 'true');
                }
                updateRoleUI();
                if (googleAuthModal) googleAuthModal.style.display = 'none';
            } else {
                const stored = getStoredUser();
                if (stored) {
                    updateAuthDisplay(stored);
                    if (googleAuthModal) googleAuthModal.style.display = 'none';
                } else {
                    updateAuthDisplay(null);
                    const guestExplored = sessionStorage.getItem('guest_explored');
                    if (!guestExplored && googleAuthModal) {
                        googleAuthModal.style.display = 'flex';
                    }
                }
            }
        });
    } else {
        // Fallback if Firebase not available immediately
        const stored = getStoredUser();
        if (stored) {
            updateAuthDisplay(stored);
        } else {
            const guestExplored = sessionStorage.getItem('guest_explored');
            if (!guestExplored && googleAuthModal) {
                googleAuthModal.style.display = 'flex';
            }
        }
    }

    // Language Change Listener from global
    window.addEventListener('languageChanged', (e) => {
        updateRoleUI();
    });

    // Check stored user on load
    const currentStoredUser = getStoredUser();
    if (currentStoredUser) {
        updateAuthDisplay(currentStoredUser);
    } else {
        const guestExplored = sessionStorage.getItem('guest_explored');
        if (!guestExplored && googleAuthModal) {
            googleAuthModal.style.display = 'flex';
        }
    }

    // Initial check for grades onboarding if already logged in / role student
    const userRole = dataStore.getUserRole();
    if (userRole === 'student' && !dataStore.hasStudentChosenGrades() && (currentStoredUser || sessionStorage.getItem('guest_explored'))) {
        openStudentOnboardingModal();
    }

    updateRoleUI();
});
