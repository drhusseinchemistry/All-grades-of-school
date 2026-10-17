// =========================================================================
// Teacher Dashboard Client Logic (UPDATED)
// Manages: 
// 1. Multi-format Malzama uploads (PowerPoint, HTML, Image, PDF)
// 2. Language selection for submissions & teacher profile
// 3. YouTube video & Quiz creation with pending approval badges
// 4. In-app document preview
// =========================================================================

document.addEventListener('DOMContentLoaded', function () {
    const dataStore = window.EducationalData;
    const gradesConfig = window.GRADES_CONFIG;

    // 1. Check or Initialize Current Teacher
    let currentTeacher = dataStore.getCurrentTeacher();
    const isSuperAdmin = dataStore.isCurrentUserSuperAdmin();

    if (!currentTeacher) {
        if (isSuperAdmin) {
            currentTeacher = dataStore.getTeacherById('t_hussein') || {
                id: 't_hussein',
                name: 'م. حسێن ئەکرەم زێباری',
                subject: 'کیمیا (Chemistry)',
                email: 'Hussein.zebary.chemistry96@gmail.com',
                viewsCount: 4250,
                grades: ['10', '11', '12', '9'],
                lang: 'ku_ba',
                status: 'approved'
            };
            dataStore.setCurrentTeacher(currentTeacher);
        } else {
            // Pick default teacher or create quick profile
            currentTeacher = dataStore.getAllTeachers()[0] || {
                id: 't_temp_' + Date.now(),
                name: 'مامۆستای نوێ',
                subject: 'کیمیا',
                viewsCount: 15,
                grades: ['12', '11', '10'],
                lang: dataStore.getActiveLanguage(),
                status: 'approved'
            };
            dataStore.setCurrentTeacher(currentTeacher);
        }
    }

    // Elements
    const tDisplayName = document.getElementById('t-display-name');
    const tDisplaySubject = document.getElementById('t-display-subject');
    const tDisplayGrades = document.getElementById('t-display-grades');
    const tAvatarImg = document.getElementById('t-avatar-img');
    const superAdminTag = document.getElementById('super-admin-tag');
    const adminHubLink = document.getElementById('admin-hub-link');
    const tLangTag = document.getElementById('t-lang-tag');

    // Stats Elements
    const statViews = document.getElementById('stat-views');
    const statVideos = document.getElementById('stat-videos');
    const statQuizzes = document.getElementById('stat-quizzes');
    const statMalzamas = document.getElementById('stat-malzamas');
    const totalMyItems = document.getElementById('total-my-items');

    // Populate Grade Selectors
    const videoGradeSelect = document.getElementById('video-grade');
    const quizGradeSelect = document.getElementById('quiz-grade');
    const malzamaGradeSelect = document.getElementById('malzama-grade');

    function populateGradeDropdown(selectEl) {
        if (!selectEl) return;
        selectEl.innerHTML = gradesConfig.map(g => `
            <option value="${g.id}">${g.name} (${g.shortName})</option>
        `).join('');
        // Default to Grade 12
        selectEl.value = '12';
    }

    const aiGradeSelect = document.getElementById('ai-grade');
    populateGradeDropdown(aiGradeSelect);
    populateGradeDropdown(videoGradeSelect);
    populateGradeDropdown(quizGradeSelect);
    populateGradeDropdown(malzamaGradeSelect);

    // Set initial language in selects from current teacher
    const teacherLang = currentTeacher.lang || dataStore.getActiveLanguage();
    const aiLangSelect = document.getElementById('ai-lang');
    const malzamaLangSelect = document.getElementById('malzama-lang');
    const videoLangSelect = document.getElementById('video-lang');
    const quizLangSelect = document.getElementById('quiz-lang');
    if (aiLangSelect) aiLangSelect.value = teacherLang;
    if (malzamaLangSelect) malzamaLangSelect.value = teacherLang;
    if (videoLangSelect) videoLangSelect.value = teacherLang;
    if (quizLangSelect) quizLangSelect.value = teacherLang;

    // Theme Toggle
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        const savedTheme = localStorage.getItem('userTheme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('userTheme', newTheme);
        });
    }

    // Refresh Teacher Profile Header
    function refreshTeacherProfileUI() {
        tDisplayName.textContent = currentTeacher.name;
        tDisplaySubject.textContent = currentTeacher.subject || 'کیمیا';
        if (currentTeacher.avatar) tAvatarImg.src = currentTeacher.avatar;
        if (tLangTag) tLangTag.textContent = dataStore.getLanguageLabel(currentTeacher.lang || 'ku_ba');

        const gradeNames = (currentTeacher.grades || ['12', '11', '10']).map(gid => {
            const g = gradesConfig.find(item => item.id === String(gid));
            return g ? g.shortName : gid;
        }).join('، ');
        tDisplayGrades.textContent = `پۆلەکانی وانەگۆتن: ${gradeNames}`;

        if (isSuperAdmin) {
            if (superAdminTag) superAdminTag.style.display = 'inline-block';
            if (adminHubLink) adminHubLink.style.display = 'inline-flex';
        }

        // Stats calculation
        const allVids = dataStore.getAllVideos(false, currentTeacher.id, isSuperAdmin);
        const myVids = allVids.filter(v => v.teacherId === currentTeacher.id);

        const allQzs = dataStore.getAllQuizzes(false, currentTeacher.id, isSuperAdmin);
        const myQzs = allQzs.filter(q => q.teacherId === currentTeacher.id);

        const allMlzs = dataStore.getAllMalzamas(false, currentTeacher.id, isSuperAdmin);
        const myMlzs = allMlzs.filter(m => m.teacherId === currentTeacher.id);

        statViews.textContent = (currentTeacher.viewsCount || 0).toLocaleString();
        statVideos.textContent = myVids.length;
        statQuizzes.textContent = myQzs.length;
        statMalzamas.textContent = myMlzs.length;
        totalMyItems.textContent = myVids.length + myQzs.length + myMlzs.length;

        renderMySubmissions();
    }

    // Dashboard Tabs
    const dTabs = document.querySelectorAll('.d-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    dTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            dTabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            const targetPane = document.getElementById(targetId);
            if (targetPane) targetPane.classList.add('active');
        });
    });

    // ==========================================
    // MULTI-FORMAT MALZAMA UPLOAD SYSTEM
    // (PowerPoint, HTML, Image, PDF)
    // ==========================================
    const formatButtons = document.querySelectorAll('.format-card-btn');
    const selectedFormatInput = document.getElementById('selected-malzama-format');
    const fileDropzone = document.getElementById('file-dropzone');
    const malzamaFileInput = document.getElementById('malzama-file-input');
    const fileChosenInfo = document.getElementById('file-chosen-info');
    const chosenFileName = document.getElementById('chosen-file-name');
    const chosenFileSize = document.getElementById('chosen-file-size');
    const dropzoneText = document.getElementById('dropzone-text');
    const htmlCodeGroup = document.getElementById('html-code-group');

    let uploadedFileData = null;
    let uploadedFileName = '';
    let uploadedFileSize = '';

    formatButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            formatButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const format = btn.getAttribute('data-format');
            selectedFormatInput.value = format;

            // Update UI based on format
            if (format === 'html') {
                htmlCodeGroup.style.display = 'block';
                dropzoneText.textContent = 'فایلی پەڕەی HTML هەڵبژێرە (.html, .htm)';
                malzamaFileInput.accept = '.html,.htm';
            } else if (format === 'pptx') {
                htmlCodeGroup.style.display = 'none';
                dropzoneText.textContent = 'فایلی پاوەرپوینت هەڵبژێرە (.pptx, .ppt)';
                malzamaFileInput.accept = '.pptx,.ppt';
            } else if (format === 'image') {
                htmlCodeGroup.style.display = 'none';
                dropzoneText.textContent = 'فایلی وێنە هەڵبژێرە (.jpg, .png, .webp)';
                malzamaFileInput.accept = '.png,.jpg,.jpeg,.webp';
            } else {
                htmlCodeGroup.style.display = 'none';
                dropzoneText.textContent = 'فایلی پەڕاوی PDF هەڵبژێرە (.pdf)';
                malzamaFileInput.accept = '.pdf';
            }
        });
    });

    // Dropzone click triggers hidden file input
    fileDropzone.addEventListener('click', () => {
        malzamaFileInput.click();
    });

    malzamaFileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        uploadedFileName = file.name;
        // Format size
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        uploadedFileSize = sizeMb > 0 ? `${sizeMb} MB` : `${(file.size / 1024).toFixed(0)} KB`;

        // Auto-detect format from extension
        const lowerName = file.name.toLowerCase();
        let detectedFormat = selectedFormatInput.value;
        if (lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt')) {
            detectedFormat = 'pptx';
        } else if (lowerName.endsWith('.html') || lowerName.endsWith('.htm')) {
            detectedFormat = 'html';
        } else if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.webp')) {
            detectedFormat = 'image';
        } else if (lowerName.endsWith('.pdf')) {
            detectedFormat = 'pdf';
        }

        // Activate corresponding format button
        formatButtons.forEach(b => {
            if (b.getAttribute('data-format') === detectedFormat) {
                b.classList.add('active');
                selectedFormatInput.value = detectedFormat;
            } else {
                b.classList.remove('active');
            }
        });

        // Read file into Base64 / DataUrl for offline instant preview
        const reader = new FileReader();
        reader.onload = function (event) {
            uploadedFileData = event.target.result;
            fileChosenInfo.style.display = 'block';
            chosenFileName.textContent = uploadedFileName;
            chosenFileSize.textContent = uploadedFileSize;
            dropzoneText.textContent = `فایل هەڵبژێردرا: ${uploadedFileName}`;
        };
        reader.readAsDataURL(file);
    });

    // Submit Malzama Form
    const addMalzamaForm = document.getElementById('add-malzama-form');
    addMalzamaForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const grade = malzamaGradeSelect.value;
        const chapter = document.getElementById('malzama-chapter').value.trim();
        const title = document.getElementById('malzama-title').value.trim();
        const url = document.getElementById('malzama-url').value.trim();
        const desc = document.getElementById('malzama-desc').value.trim();
        const lang = malzamaLangSelect.value;
        const format = selectedFormatInput.value;
        const htmlSnippet = document.getElementById('malzama-html-code').value.trim();
        const malzamaSubEl = document.getElementById('malzama-subject');
        const subject = malzamaSubEl ? malzamaSubEl.value : (currentTeacher.subject || 'کیمیا');

        if (!uploadedFileData && !url && !htmlSnippet) {
            alert('تکایە فایلی مەلزەمە هەڵبژێرە، یان بەستەری فایل دابنێ، یان کۆدی HTML بنووسە.');
            return;
        }

        dataStore.submitMalzama({
            teacherId: currentTeacher.id,
            teacherName: currentTeacher.name,
            grade: grade,
            chapter: chapter,
            title: title,
            subject: subject,
            fileType: format,
            fileUrl: url || '#',
            fileData: uploadedFileData,
            htmlContent: htmlSnippet || null,
            fileName: uploadedFileName || `${title}.${format}`,
            fileSize: uploadedFileSize || '1.5 MB',
            description: desc,
            lang: lang
        });

        alert('دەستخۆش! مەلزەمەکە بە سەرکەوتوویی نێردرا و پاش پەسەندکردنی م. حسێن لە بەشی گشتی پیشان دەدرێت.');
        addMalzamaForm.reset();
        uploadedFileData = null;
        uploadedFileName = '';
        uploadedFileSize = '';
        fileChosenInfo.style.display = 'none';
        dropzoneText.textContent = 'کلیک بکە بۆ هەڵبژاردنی فایل (PDF, PPTX, HTML, وێنە)';
        refreshTeacherProfileUI();
    });

    // ==========================================
    // 2. ADD YOUTUBE VIDEO
    // ==========================================
    const addVideoForm = document.getElementById('add-video-form');
    addVideoForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const grade = videoGradeSelect.value;
        const chapter = document.getElementById('video-chapter').value.trim();
        const title = document.getElementById('video-title').value.trim();
        const url = document.getElementById('video-url').value.trim();
        const lang = videoLangSelect.value;
        const videoSubEl = document.getElementById('video-subject');
        const subject = videoSubEl ? videoSubEl.value : (currentTeacher.subject || 'کیمیا');

        if (!dataStore.getYoutubeId(url)) {
            alert('تکایە بەستەرێکی ڕاستەقینەی یوتیوب بنووسە (بۆ نموونە: https://www.youtube.com/watch?v=...)');
            return;
        }

        dataStore.submitVideo({
            teacherId: currentTeacher.id,
            teacherName: currentTeacher.name,
            grade: grade,
            chapter: chapter,
            title: title,
            youtubeUrl: url,
            subject: subject,
            lang: lang
        });

        alert('وانەی ڤیدیۆ بە سەرکەوتوویی تۆمارکرا و نێردرا بۆ پەسەندکردنی ئەدمین.');
        addVideoForm.reset();
        refreshTeacherProfileUI();
    });

    // ==========================================
    // 3. ADD QUIZ QUESTION (MCQ)
    // ==========================================
    const addQuizForm = document.getElementById('add-quiz-form');
    addQuizForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const grade = quizGradeSelect.value;
        const chapter = document.getElementById('quiz-chapter').value.trim();
        const question = document.getElementById('quiz-question').value.trim();
        const opt0 = document.getElementById('quiz-opt-0').value.trim();
        const opt1 = document.getElementById('quiz-opt-1').value.trim();
        const opt2 = document.getElementById('quiz-opt-2').value.trim();
        const opt3 = document.getElementById('quiz-opt-3').value.trim();
        const correctIndex = document.getElementById('quiz-correct-index').value;
        const explanation = document.getElementById('quiz-explanation').value.trim();
        const lang = quizLangSelect.value;
        const quizSubEl = document.getElementById('quiz-subject');
        const subject = quizSubEl ? quizSubEl.value : (currentTeacher.subject || 'کیمیا');

        dataStore.submitQuiz({
            teacherId: currentTeacher.id,
            teacherName: currentTeacher.name,
            grade: grade,
            chapter: chapter,
            question: question,
            options: [opt0, opt1, opt2, opt3],
            correctIndex: correctIndex,
            explanation: explanation,
            subject: subject,
            lang: lang
        });

        alert('پرسیاری هەڵبژاردن بە سەرکەوتوویی نێردرا بۆ لیستی پەسەندکردن.');
        addQuizForm.reset();
        refreshTeacherProfileUI();
    });

    // ==========================================
    // 4. MY SUBMISSIONS & STATUS
    // ==========================================
    const mySubmissionsContainer = document.getElementById('my-submissions-list');
    const filterStatusButtons = document.querySelectorAll('.filter-status-btn');
    let currentFilter = 'all';

    filterStatusButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterStatusButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderMySubmissions();
        });
    });

    function renderMySubmissions() {
        const isAdmin = isSuperAdmin;
        const vids = dataStore.getAllVideos(false, currentTeacher.id, isAdmin).filter(v => v.teacherId === currentTeacher.id).map(v => ({ ...v, type: 'video' }));
        const qzs = dataStore.getAllQuizzes(false, currentTeacher.id, isAdmin).filter(q => q.teacherId === currentTeacher.id).map(q => ({ ...q, type: 'quiz' }));
        const mlzs = dataStore.getAllMalzamas(false, currentTeacher.id, isAdmin).filter(m => m.teacherId === currentTeacher.id).map(m => ({ ...m, type: 'malzama' }));

        let items = [...vids, ...qzs, ...mlzs].sort((a, b) => b.createdAt - a.createdAt);

        if (currentFilter !== 'all') {
            items = items.filter(i => i.status === currentFilter);
        }

        if (items.length === 0) {
            mySubmissionsContainer.innerHTML = `
                <div style="text-align:center; padding: 40px; color: var(--secondary-text);">
                    <i class="fas fa-folder-open" style="font-size: 2.5rem; margin-bottom: 10px; opacity:0.5;"></i>
                    <p>هیچ بابەتێک لەم پۆلێنبەندییەدا نەدۆزرایەوە.</p>
                </div>
            `;
            return;
        }

        mySubmissionsContainer.innerHTML = items.map(item => {
            const gradeObj = gradesConfig.find(g => g.id === String(item.grade)) || { name: 'پۆلا ' + item.grade };
            const statusClass = item.status === 'approved' ? 'status-approved' : (item.status === 'rejected' ? 'status-rejected' : 'status-pending');
            const statusText = item.status === 'approved' ? 'پەسەندکراو' : (item.status === 'rejected' ? 'ڕەتکراوە' : 'ل چاڤەڕێی پەسەندکرنێ');
            const statusIcon = item.status === 'approved' ? 'fa-check' : (item.status === 'rejected' ? 'fa-times' : 'fa-clock');

            let typeIcon = 'fa-video';
            let typeName = 'ڤیدیۆیا یوتیوبێ';
            let itemDetails = '';

            if (item.type === 'video') {
                typeIcon = 'fa-youtube';
                typeName = 'ڤیدیۆ';
                itemDetails = `<strong>${item.title}</strong> — ${item.chapter || ''}`;
            } else if (item.type === 'quiz') {
                typeIcon = 'fa-question-circle';
                typeName = 'پرسیار';
                itemDetails = `<strong>${item.question}</strong>`;
            } else {
                typeName = item.fileType ? item.fileType.toUpperCase() : 'مەلزەمە';
                typeIcon = item.fileType === 'pptx' ? 'fa-file-powerpoint' : (item.fileType === 'html' ? 'fa-file-code' : (item.fileType === 'image' ? 'fa-file-image' : 'fa-file-pdf'));
                itemDetails = `<strong>${item.title}</strong> — ${item.chapter || ''} (${item.fileSize || 'فایل'})`;
            }

            const langLabel = dataStore.getLanguageLabel(item.lang || 'ku_ba');

            return `
                <div class="submission-card" id="my-card-${item.id}">
                    <div style="flex:1; min-width:250px;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                            <span style="font-size:0.8rem; background:rgba(0,123,255,0.1); color:var(--blue-accent); padding:2px 8px; border-radius:6px;">
                                <i class="fas ${typeIcon}"></i> ${typeName}
                            </span>
                            <span style="font-size:0.8rem; color:var(--secondary-text);">
                                <i class="fas fa-graduation-cap"></i> ${gradeObj.name}
                            </span>
                            <span style="font-size:0.75rem; background:rgba(138,43,226,0.1); color:#8a2be2; padding:2px 8px; border-radius:6px;">
                                ${langLabel}
                            </span>
                        </div>
                        <div style="font-size:0.95rem; margin-bottom:5px;">${itemDetails}</div>
                        <span class="status-badge ${statusClass}">
                            <i class="fas ${statusIcon}"></i> ${statusText}
                        </span>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center;">
                        ${item.type === 'malzama' ? `
                            <button class="btn-cancel preview-doc-btn" data-id="${item.id}" style="padding:6px 12px; font-size:0.85rem;">
                                <i class="fas fa-eye"></i> بینین
                            </button>
                        ` : ''}
                        <button class="btn-cancel delete-my-item-btn" data-id="${item.id}" data-type="${item.type}" style="padding:6px 12px; font-size:0.85rem; color:#dc3545; border-color:rgba(220,53,69,0.3);">
                            <i class="fas fa-trash-alt"></i> سڕینەوە
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach Delete
        document.querySelectorAll('.delete-my-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const type = btn.getAttribute('data-type');
                if (confirm('ئایا دڵنیایت لە سڕینەوەی ئەم بابەتە؟')) {
                    const success = dataStore.deleteItem(id, type, currentTeacher.id, isSuperAdmin);
                    if (success) {
                        refreshTeacherProfileUI();
                    } else {
                        alert('سڕینەوە ئەنجام نەدرا.');
                    }
                }
            });
        });

        // Attach Document Preview inside Dashboard
        document.querySelectorAll('.preview-doc-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const allMlz = dataStore.getAllMalzamas(false, null, true);
                const item = allMlz.find(m => m.id === id);
                if (item) {
                    openDashboardDocViewer(item);
                }
            });
        });
    }

    // Dashboard Document Viewer Modal
    const docModal = document.getElementById('doc-viewer-modal');
    const closeDocBtn = document.getElementById('close-doc-btn');
    const docViewport = document.getElementById('doc-viewer-viewport');
    const docModalTitle = document.getElementById('doc-modal-title');
    const docModalBadge = document.getElementById('doc-modal-format-badge');

    function openDashboardDocViewer(item) {
        docModalTitle.textContent = item.title;
        const formatType = item.fileType || 'pdf';
        docModalBadge.className = `format-badge ${formatType}`;
        docModalBadge.innerHTML = formatType.toUpperCase();

        docViewport.innerHTML = '';
        if (formatType === 'pdf') {
            const pdfSrc = item.fileData || item.fileUrl || 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf';
            docViewport.innerHTML = `<iframe src="${pdfSrc}#toolbar=1" width="100%" height="100%" style="border:none; background:#ffffff; border-radius:10px;"></iframe>`;
        } else if (formatType === 'image') {
            const imgSrc = item.fileData || item.fileUrl || 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80';
            docViewport.innerHTML = `<img src="${imgSrc}" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:8px;">`;
        } else if (formatType === 'html') {
            if (item.htmlContent) {
                const iframe = document.createElement('iframe');
                iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                iframe.style.background = '#ffffff';
                iframe.srcdoc = item.htmlContent;
                docViewport.appendChild(iframe);
            } else {
                docViewport.innerHTML = `<iframe sandbox="allow-scripts allow-same-origin" src="${item.fileData || item.fileUrl}" width="100%" height="100%" style="border:none; background:#ffffff;"></iframe>`;
            }
        } else if (formatType === 'pptx') {
            if (item.fileUrl && item.fileUrl.startsWith('http')) {
                const officeEmbed = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(item.fileUrl)}`;
                docViewport.innerHTML = `<iframe src="${officeEmbed}" width="100%" height="100%" style="border:none; background:#ffffff;"></iframe>`;
            } else {
                docViewport.innerHTML = `
                    <div style="text-align:center; padding:30px; color:#fff;">
                        <i class="fas fa-file-powerpoint" style="font-size:3rem; color:#d83b01; margin-bottom:12px;"></i>
                        <h3>فایلی پاوەرپوینت (${item.fileName || 'presentation.pptx'})</h3>
                        <p>${item.fileSize || 'PowerPoint Presentation'}</p>
                        <a href="${item.fileData || item.fileUrl}" download="${item.fileName || 'presentation.pptx'}" class="btn-save" style="background:#d83b01; text-decoration:none; padding:8px 20px;">
                            <i class="fas fa-download"></i> تاقیکردنەوەی داگرتن
                        </a>
                    </div>
                `;
            }
        }
        docModal.classList.add('open');
    }

    if (closeDocBtn) {
        closeDocBtn.addEventListener('click', () => {
            docModal.classList.remove('open');
            docViewport.innerHTML = '';
        });
    }

    // ==========================================
    // 5. TEACHER PROFILE MODAL
    // ==========================================
    const editProfileBtn = document.getElementById('edit-teacher-profile-btn');
    const profileModal = document.getElementById('teacher-profile-modal');
    const closeProfileModal = document.getElementById('close-profile-modal');
    const profileForm = document.getElementById('teacher-profile-form');

    const profName = document.getElementById('prof-name');
    const profSubject = document.getElementById('prof-subject');
    const profPhone = document.getElementById('prof-phone');
    const profBio = document.getElementById('prof-bio');
    const profLang = document.getElementById('prof-lang');

    editProfileBtn.addEventListener('click', () => {
        profName.value = currentTeacher.name || '';
        profSubject.value = currentTeacher.subject || '';
        profPhone.value = currentTeacher.phone || '';
        profBio.value = currentTeacher.bio || '';
        if (profLang) profLang.value = currentTeacher.lang || 'ku_ba';
        profileModal.style.display = 'flex';
    });

    closeProfileModal.addEventListener('click', () => {
        profileModal.style.display = 'none';
    });

    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const updated = dataStore.saveTeacher({
            id: currentTeacher.id,
            name: profName.value.trim(),
            subject: profSubject.value.trim(),
            phone: profPhone.value.trim(),
            bio: profBio.value.trim(),
            lang: profLang ? profLang.value : (currentTeacher.lang || 'ku_ba'),
            avatar: currentTeacher.avatar
        });
        currentTeacher = updated;
        profileModal.style.display = 'none';
        refreshTeacherProfileUI();
        alert('پڕۆفایلی مامۆستا بە سەرکەوتوویی نوێکرایەوە.');
    });

    // ==========================================
    // 6. GEMINI AI STUDIO (POWERPOINT & QUIZZES)
    // ==========================================
    const aiForm = document.getElementById('ai-generator-form');
    const aiDropzone = document.getElementById('ai-dropzone');
    const aiFileInput = document.getElementById('ai-file-input');
    const aiFileChosenInfo = document.getElementById('ai-file-chosen-info');
    const aiFileName = document.getElementById('ai-file-name');
    const aiFileSize = document.getElementById('ai-file-size');
    const btnRemoveAiFile = document.getElementById('btn-remove-ai-file');
    const aiLoadingBox = document.getElementById('ai-loading-box');
    const aiLoadingStatusText = document.getElementById('ai-loading-status-text');
    const aiResultBox = document.getElementById('ai-result-box');
    const aiPresentationIframe = document.getElementById('ai-presentation-iframe');
    const aiQuizzesCardsContainer = document.getElementById('ai-quizzes-cards-container');
    const aiQuizzesCountBadge = document.getElementById('ai-quizzes-count-badge');
    const aiResultTitle = document.getElementById('ai-result-title');
    const aiResultMeta = document.getElementById('ai-result-meta');

    // Quick question count pills
    const quickQCountBtns = document.querySelectorAll('.btn-quick-qcount');
    const aiQuestionsCountInput = document.getElementById('ai-questions-count');
    quickQCountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            quickQCountBtns.forEach(b => {
                b.classList.remove('active');
                b.style.background = '';
                b.style.color = '';
            });
            btn.classList.add('active');
            btn.style.background = 'var(--blue-accent)';
            btn.style.color = '#ffffff';
            if (aiQuestionsCountInput) {
                aiQuestionsCountInput.value = btn.getAttribute('data-count');
            }
        });
    });

    // File selection & dropzone
    let aiSelectedFileBase64 = null;
    let aiSelectedFileType = null;

    if (aiDropzone && aiFileInput) {
        aiDropzone.addEventListener('click', () => aiFileInput.click());

        aiDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            aiDropzone.style.borderColor = 'var(--blue-accent)';
            aiDropzone.style.background = 'rgba(0,180,216,0.1)';
        });

        aiDropzone.addEventListener('dragleave', () => {
            aiDropzone.style.borderColor = '#00b4d8';
            aiDropzone.style.background = 'rgba(0,180,216,0.03)';
        });

        aiDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            aiDropzone.style.borderColor = '#00b4d8';
            aiDropzone.style.background = 'rgba(0,180,216,0.03)';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleAiFileUpload(e.dataTransfer.files[0]);
            }
        });

        aiFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleAiFileUpload(e.target.files[0]);
            }
        });
    }

    function handleAiFileUpload(file) {
        aiFileName.textContent = file.name;
        aiFileSize.textContent = (file.size / 1024 > 1024) 
            ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' 
            : Math.round(file.size / 1024) + ' KB';
        aiSelectedFileType = file.type || 'application/octet-stream';

        const reader = new FileReader();
        reader.onload = (e) => {
            aiSelectedFileBase64 = e.target.result;
            if (aiFileChosenInfo) aiFileChosenInfo.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    if (btnRemoveAiFile) {
        btnRemoveAiFile.addEventListener('click', () => {
            aiSelectedFileBase64 = null;
            aiSelectedFileType = null;
            if (aiFileInput) aiFileInput.value = '';
            if (aiFileChosenInfo) aiFileChosenInfo.style.display = 'none';
        });
    }

    // Latest Generated AI Output
    let currentAiOutput = null;

    // AI Form Submission Handler
    if (aiForm) {
        aiForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const grade = document.getElementById('ai-grade').value;
            const subject = document.getElementById('ai-subject').value;
            const lang = document.getElementById('ai-lang').value;
            const chapter = document.getElementById('ai-chapter').value.trim();
            const title = document.getElementById('ai-title').value.trim();
            const notes = document.getElementById('ai-notes-text') ? document.getElementById('ai-notes-text').value.trim() : '';
            const questionsCount = Number(document.getElementById('ai-questions-count').value) || 5;
            const teacherIdeas = document.getElementById('ai-teacher-ideas') ? document.getElementById('ai-teacher-ideas').value.trim() : '';

            // Show loading box and scroll
            aiLoadingBox.style.display = 'block';
            aiResultBox.style.display = 'none';
            aiLoadingBox.scrollIntoView({ behavior: 'smooth' });

            const statusMessages = [
                'شیکارکردنی فایل و دەقی وانەکە لەلایەن Gemini...',
                'داڕشتنی پەڕەی HTML بە شێوازی پاوەرپۆینتی ئەنیمەیشنکراو...',
                `ئامادەکردنی ${questionsCount} پرسیاری مۆدێرنی هەڵبژاردن و ڕوونکردنەوەی وەڵامەکان...`,
                'تەواوکردنی ڕێکخستنی کۆتایی بەپێی قالبی ئەدمین...'
            ];
            let statusIdx = 0;
            const statusInterval = setInterval(() => {
                statusIdx = (statusIdx + 1) % statusMessages.length;
                if (aiLoadingStatusText) aiLoadingStatusText.textContent = statusMessages[statusIdx];
            }, 2500);

            try {
                const payload = {
                    subject,
                    grade,
                    chapter,
                    title,
                    lang,
                    questionsCount,
                    teacherIdeas,
                    sourceText: notes,
                    fileData: aiSelectedFileBase64,
                    fileType: aiSelectedFileType,
                    teacherName: currentTeacher.name || 'م. حسێن ئەکرەم زێباری'
                };

                const res = await fetch('/api/gemini/generate-teacher-content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                clearInterval(statusInterval);

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || `Server returned error ${res.status}`);
                }

                const result = await res.json();
                if (!result.success) {
                    throw new Error(result.error || 'Gemini generation failed');
                }

                currentAiOutput = {
                    ...result,
                    grade,
                    subject,
                    lang,
                    chapter: result.chapter || chapter,
                    title: result.presentationTitle || title
                };

                // Display results
                aiLoadingBox.style.display = 'none';
                aiResultBox.style.display = 'block';
                aiResultBox.scrollIntoView({ behavior: 'smooth' });

                if (aiResultTitle) aiResultTitle.textContent = currentAiOutput.title;
                if (aiResultMeta) {
                    const gradeName = (gradesConfig.find(g => g.id === String(grade)) || {}).name || `پۆلا ${grade}`;
                    aiResultMeta.textContent = `${gradeName} • ${subject} • ${chapter} • زمانی ${dataStore.getLanguageLabel(lang)}`;
                }
                if (aiQuizzesCountBadge) {
                    aiQuizzesCountBadge.textContent = (result.quizzes || []).length;
                }

                // Render presentation in iframe
                if (aiPresentationIframe && result.htmlContent) {
                    aiPresentationIframe.srcdoc = result.htmlContent;
                }

                // Render modern interactive quiz cards
                renderGeneratedQuizzes(result.quizzes || []);

            } catch (err) {
                clearInterval(statusInterval);
                aiLoadingBox.style.display = 'none';
                console.error('Gemini generation error:', err);
                alert('هەڵەیەک ڕوویدا لە دروستکردنی بابەت لەلایەن Gemini: ' + (err.message || 'تکایە دووبارە تاقیبکەرەوە'));
            }
        });
    }

    // Render Quizzes in Result Box
    function renderGeneratedQuizzes(quizzes) {
        if (!aiQuizzesCardsContainer) return;
        if (!quizzes || quizzes.length === 0) {
            aiQuizzesCardsContainer.innerHTML = '<p style="text-align:center; color:var(--secondary-text); padding:20px;">هیچ پرسیارێک دروستنەکرا.</p>';
            return;
        }

        const optionLetters = ['A', 'B', 'C', 'D'];

        aiQuizzesCardsContainer.innerHTML = quizzes.map((q, idx) => {
            const optionsHtml = (q.options || []).map((opt, optIdx) => {
                const isCorrect = optIdx === q.correctIndex;
                return `
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border-radius:8px; margin-bottom:6px; border:1px solid ${isCorrect ? '#28a745' : 'var(--border-color)'}; background:${isCorrect ? 'rgba(40,167,69,0.1)' : 'var(--surface-color)'}; font-size:0.88rem;">
                        <span><strong style="color:${isCorrect ? '#28a745' : 'var(--blue-accent)'}; margin-left:6px;">${optionLetters[optIdx]}.</strong> ${opt}</span>
                        ${isCorrect ? '<span style="color:#28a745; font-size:0.78rem; font-weight:bold;"><i class="fas fa-check"></i> وەڵامی ڕاست</span>' : ''}
                    </div>
                `;
            }).join('');

            return `
                <div style="background:var(--surface-color); border:1px solid var(--border-color); border-right:4px solid #8a2be2; border-radius:12px; padding:16px; box-shadow:0 4px 15px var(--shadow-color); text-align:right;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="background:rgba(138,43,226,0.15); color:#8a2be2; font-size:0.75rem; font-weight:bold; padding:2px 8px; border-radius:6px;">
                            <i class="fas fa-question-circle"></i> پرسیاری ${idx + 1}
                        </span>
                        <span style="font-size:0.75rem; color:var(--secondary-text);">${q.difficulty || 'ناوەند'}</span>
                    </div>

                    <h4 style="margin:0 0 12px; font-size:0.98rem; line-height:1.5; color:var(--primary-text);">
                        ${q.question}
                    </h4>

                    <div style="margin-bottom:12px;">
                        ${optionsHtml}
                    </div>

                    ${q.explanation ? `
                        <div style="background:rgba(255,193,7,0.08); border:1px solid rgba(255,193,7,0.25); border-radius:8px; padding:8px 12px; font-size:0.8rem; color:#fef08a;">
                            <strong style="display:block; margin-bottom:2px;"><i class="fas fa-lightbulb" style="color:#ffc107;"></i> ڕوونکردنەوەی وەڵام:</strong>
                            ${q.explanation}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    // Sub-tab toggling (Preview PPT vs Preview Quizzes)
    const aiViewTabs = document.querySelectorAll('.ai-view-tab');
    const aiViewPpt = document.getElementById('ai-view-ppt');
    const aiViewQuizzes = document.getElementById('ai-view-quizzes');

    aiViewTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            aiViewTabs.forEach(t => {
                t.classList.remove('active');
                t.classList.remove('btn-action-primary');
                t.classList.add('btn-action-secondary');
            });
            tab.classList.add('active');
            tab.classList.remove('btn-action-secondary');
            tab.classList.add('btn-action-primary');

            const view = tab.getAttribute('data-view');
            if (view === 'view-ppt') {
                if (aiViewPpt) aiViewPpt.style.display = 'block';
                if (aiViewQuizzes) aiViewQuizzes.style.display = 'none';
            } else {
                if (aiViewPpt) aiViewPpt.style.display = 'none';
                if (aiViewQuizzes) aiViewQuizzes.style.display = 'block';
            }
        });
    });

    // Save Buttons (Both, PPT Only, Quizzes Only)
    const btnSaveAiBoth = document.getElementById('btn-save-ai-both');
    const btnSaveAiPresentationOnly = document.getElementById('btn-save-ai-presentation-only');
    const btnSaveAiQuizzesOnly = document.getElementById('btn-save-ai-quizzes-only');
    const btnDownloadPptHtml = document.getElementById('btn-download-ppt-html');
    const btnFullscreenPpt = document.getElementById('btn-fullscreen-ppt');

    if (btnSaveAiBoth) {
        btnSaveAiBoth.addEventListener('click', () => {
            if (!currentAiOutput) return;
            const status = isSuperAdmin ? 'approved' : 'pending';

            // 1. Save HTML Presentation as Malzama
            dataStore.saveMalzama({
                teacherId: currentTeacher.id,
                title: currentAiOutput.title,
                chapter: currentAiOutput.chapter,
                grade: currentAiOutput.grade,
                subject: currentAiOutput.subject,
                lang: currentAiOutput.lang,
                fileType: 'html',
                htmlContent: currentAiOutput.htmlContent,
                description: currentAiOutput.presentationSubtitle || currentAiOutput.title,
                fileSize: 'Interactive HTML',
                status: status
            });

            // 2. Save all quizzes
            let qCount = 0;
            (currentAiOutput.quizzes || []).forEach(q => {
                dataStore.saveQuiz({
                    teacherId: currentTeacher.id,
                    question: q.question,
                    options: q.options,
                    correctIndex: q.correctIndex,
                    explanation: q.explanation,
                    chapter: q.chapter || currentAiOutput.chapter,
                    grade: currentAiOutput.grade,
                    subject: currentAiOutput.subject,
                    lang: currentAiOutput.lang,
                    status: status
                });
                qCount++;
            });

            refreshTeacherProfileUI();
            alert(`پاوەرپۆینتی ئینتەرئەکتیڤ و ${qCount} پرسیاری مۆدێرن بە سەرکەوتوویی بۆ بابەتی (${currentAiOutput.subject}) زێدەکران!`);
            
            // Switch to "My Items" tab
            const myItemsTab = document.querySelector('[data-tab="tab-my-items"]');
            if (myItemsTab) myItemsTab.click();
        });
    }

    if (btnSaveAiPresentationOnly) {
        btnSaveAiPresentationOnly.addEventListener('click', () => {
            if (!currentAiOutput) return;
            const status = isSuperAdmin ? 'approved' : 'pending';

            dataStore.saveMalzama({
                teacherId: currentTeacher.id,
                title: currentAiOutput.title,
                chapter: currentAiOutput.chapter,
                grade: currentAiOutput.grade,
                subject: currentAiOutput.subject,
                lang: currentAiOutput.lang,
                fileType: 'html',
                htmlContent: currentAiOutput.htmlContent,
                description: currentAiOutput.presentationSubtitle || currentAiOutput.title,
                fileSize: 'Interactive HTML',
                status: status
            });

            refreshTeacherProfileUI();
            alert(`پاوەرپۆینتی وانەکە بە سەرکەوتوویی پاشەکەوتکرا!`);
        });
    }

    if (btnSaveAiQuizzesOnly) {
        btnSaveAiQuizzesOnly.addEventListener('click', () => {
            if (!currentAiOutput || !currentAiOutput.quizzes) return;
            const status = isSuperAdmin ? 'approved' : 'pending';

            let qCount = 0;
            currentAiOutput.quizzes.forEach(q => {
                dataStore.saveQuiz({
                    teacherId: currentTeacher.id,
                    question: q.question,
                    options: q.options,
                    correctIndex: q.correctIndex,
                    explanation: q.explanation,
                    chapter: q.chapter || currentAiOutput.chapter,
                    grade: currentAiOutput.grade,
                    subject: currentAiOutput.subject,
                    lang: currentAiOutput.lang,
                    status: status
                });
                qCount++;
            });

            refreshTeacherProfileUI();
            alert(`${qCount} پرسیاری هەڵبژاردن بە سەرکەوتوویی پاشەکەوتکران!`);
        });
    }

    if (btnDownloadPptHtml) {
        btnDownloadPptHtml.addEventListener('click', () => {
            if (!currentAiOutput || !currentAiOutput.htmlContent) return;
            const blob = new Blob([currentAiOutput.htmlContent], { type: 'text/html;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${currentAiOutput.title || 'presentation'}.html`;
            link.click();
        });
    }

    if (btnFullscreenPpt && aiPresentationIframe) {
        btnFullscreenPpt.addEventListener('click', () => {
            if (aiPresentationIframe.requestFullscreen) {
                aiPresentationIframe.requestFullscreen();
            } else if (aiPresentationIframe.webkitRequestFullscreen) {
                aiPresentationIframe.webkitRequestFullscreen();
            }
        });
    }

    // ==========================================
    // 7. GOOGLE DRIVE INTEGRATION
    // ==========================================
    const gdriveLoginPrompt = document.getElementById('gdrive-login-prompt');
    const gdriveFilesManager = document.getElementById('gdrive-files-manager');
    const gdriveLoginBtn = document.getElementById('gdrive-login-btn');
    const gdriveSignoutBtn = document.getElementById('gdrive-signout-btn');
    const gdriveUserBadge = document.getElementById('gdrive-user-badge');
    const gdriveUserEmail = document.getElementById('gdrive-user-email');
    const gdriveStatusAlert = document.getElementById('gdrive-status-alert');
    const gdriveSearchInput = document.getElementById('gdrive-search-input');
    const gdriveFilterBtns = document.querySelectorAll('.gdrive-filter-btn');
    const gdriveRefreshBtn = document.getElementById('gdrive-refresh-btn');
    const gdriveQuickUploadInput = document.getElementById('gdrive-quick-upload-input');
    const gdriveFilesLoading = document.getElementById('gdrive-files-loading');
    const gdriveFilesEmpty = document.getElementById('gdrive-files-empty');
    const gdriveFilesList = document.getElementById('gdrive-files-list');

    const btnImportFromGdrive = document.getElementById('btn-import-from-gdrive');
    const btnSaveAiGdrive = document.getElementById('btn-save-ai-gdrive');
    const btnSavePptGdriveDirect = document.getElementById('btn-save-ppt-gdrive-direct');

    let currentDriveFilter = 'all';
    let driveSearchDebounceTimer = null;

    function showDriveStatus(message, type = 'success') {
        if (!gdriveStatusAlert) return;
        gdriveStatusAlert.style.display = 'block';
        if (type === 'success') {
            gdriveStatusAlert.style.background = 'rgba(40, 167, 69, 0.15)';
            gdriveStatusAlert.style.border = '1px solid rgba(40, 167, 69, 0.4)';
            gdriveStatusAlert.style.color = '#28a745';
        } else {
            gdriveStatusAlert.style.background = 'rgba(220, 53, 69, 0.15)';
            gdriveStatusAlert.style.border = '1px solid rgba(220, 53, 69, 0.4)';
            gdriveStatusAlert.style.color = '#dc3545';
        }
        gdriveStatusAlert.innerHTML = message;
        setTimeout(() => {
            if (gdriveStatusAlert) gdriveStatusAlert.style.display = 'none';
        }, 6000);
    }

    function formatFileSize(bytes) {
        if (!bytes) return 'نادیار';
        const num = Number(bytes);
        if (isNaN(num)) return 'نادیار';
        if (num < 1024) return num + ' B';
        if (num < 1024 * 1024) return (num / 1024).toFixed(1) + ' KB';
        return (num / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function formatDriveDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('ku', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    }

    async function loadDriveFiles() {
        if (!window.GoogleDriveService || !window.GoogleDriveService.getAccessToken()) {
            return;
        }

        if (gdriveFilesLoading) gdriveFilesLoading.style.display = 'block';
        if (gdriveFilesEmpty) gdriveFilesEmpty.style.display = 'none';
        if (gdriveFilesList) gdriveFilesList.innerHTML = '';

        try {
            const query = gdriveSearchInput ? gdriveSearchInput.value.trim() : '';
            const res = await window.GoogleDriveService.listFiles({
                filterType: currentDriveFilter,
                search: query,
                pageSize: 35
            });

            const files = res.files || [];

            if (gdriveFilesLoading) gdriveFilesLoading.style.display = 'none';

            if (files.length === 0) {
                if (gdriveFilesEmpty) gdriveFilesEmpty.style.display = 'block';
                return;
            }

            if (gdriveFilesList) {
                gdriveFilesList.innerHTML = files.map(file => {
                    const mime = (file.mimeType || '').toLowerCase();
                    let iconClass = 'fas fa-file';
                    let badgeClass = 'other';
                    let typeLabel = 'فایل';

                    if (mime.includes('pdf')) {
                        iconClass = 'fas fa-file-pdf';
                        badgeClass = 'pdf';
                        typeLabel = 'PDF';
                    } else if (mime.includes('presentation') || mime.includes('powerpoint')) {
                        iconClass = 'fas fa-file-powerpoint';
                        badgeClass = 'slide';
                        typeLabel = 'پاوەرپۆینت / سلاید';
                    } else if (mime.includes('document') || mime.includes('word') || mime === 'text/plain') {
                        iconClass = 'fas fa-file-word';
                        badgeClass = 'doc';
                        typeLabel = 'دۆکیومێنت';
                    } else if (mime.includes('image/')) {
                        iconClass = 'fas fa-file-image';
                        badgeClass = 'image';
                        typeLabel = 'وێنە';
                    }

                    return `
                        <div class="gdrive-card-item" data-file-id="${file.id}">
                            <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
                                <div class="gdrive-icon-badge ${badgeClass}">
                                    <i class="${iconClass}"></i>
                                </div>
                                <div style="min-width:0; text-align:right;">
                                    <h4 style="margin:0 0 4px; font-size:0.95rem; color:var(--primary-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${file.name}">
                                        ${file.name}
                                    </h4>
                                    <div style="display:flex; align-items:center; gap:10px; font-size:0.78rem; color:var(--secondary-text); flex-wrap:wrap;">
                                        <span><i class="fas fa-tag"></i> ${typeLabel}</span>
                                        <span><i class="fas fa-database"></i> ${formatFileSize(file.size)}</span>
                                        <span><i class="far fa-clock"></i> ${formatDriveDate(file.modifiedTime)}</span>
                                    </div>
                                </div>
                            </div>

                            <div style="display:flex; gap:6px; flex-shrink:0; flex-wrap:wrap;">
                                <button class="btn-action-primary btn-use-in-ai" data-file-id="${file.id}" data-file-name="${encodeURIComponent(file.name)}" data-mime="${file.mimeType}" style="padding:6px 12px; font-size:0.8rem; background:linear-gradient(135deg, #00b4d8, #7209b7);">
                                    <i class="fas fa-magic"></i> بەکارهێنان لە Gemini AI
                                </button>
                                <button class="btn-action-secondary btn-add-as-malzama" data-file-id="${file.id}" data-file-name="${encodeURIComponent(file.name)}" data-web-link="${file.webViewLink || ''}" data-mime="${file.mimeType}" style="padding:6px 10px; font-size:0.8rem;">
                                    <i class="fas fa-plus-circle"></i> وەک مەلزەمە
                                </button>
                                ${file.webViewLink ? `
                                    <a href="${file.webViewLink}" target="_blank" rel="noopener noreferrer" class="btn-action-secondary" style="padding:6px 10px; font-size:0.8rem; text-decoration:none;">
                                        <i class="fas fa-external-link-alt"></i> کردنەوە لە Drive
                                    </a>
                                ` : ''}
                                <button class="btn-action-secondary btn-delete-drive-file" data-file-id="${file.id}" data-file-name="${encodeURIComponent(file.name)}" style="padding:6px 10px; font-size:0.8rem; color:#ef4444; border-color:rgba(239,68,68,0.3);">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');

                // Attach handlers to file buttons
                gdriveFilesList.querySelectorAll('.btn-use-in-ai').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const fileId = btn.getAttribute('data-file-id');
                        const fileName = decodeURIComponent(btn.getAttribute('data-file-name') || '');
                        const mime = btn.getAttribute('data-mime') || '';

                        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> دابەزاندن...';
                        try {
                            const blob = await window.GoogleDriveService.getFileContent(fileId, mime);
                            
                            // Convert blob to base64
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                aiUploadedFileData = e.target.result;
                                aiUploadedFileType = blob.type || mime;
                                aiUploadedFileName = fileName;

                                if (aiFileChosenInfo && aiFileNameSpan && aiFileSizeSpan) {
                                    aiFileNameSpan.textContent = `[Google Drive] ${fileName}`;
                                    aiFileSizeSpan.textContent = formatFileSize(blob.size);
                                    aiFileChosenInfo.style.display = 'block';
                                }

                                // Switch tab to AI Studio
                                const aiTabBtn = document.querySelector('.d-tab[data-tab="tab-ai-generator"]');
                                if (aiTabBtn) aiTabBtn.click();

                                const ideasInput = document.getElementById('ai-teacher-ideas');
                                if (ideasInput && !ideasInput.value) {
                                    ideasInput.value = `وانەیەک دروست بکە لەسەر: ${fileName.replace(/\.[^/.]+$/, "")}`;
                                }

                                alert(`فایلی (${fileName}) لە Google Drive بە سەرکەوتوویی بارکرا بۆ ژیریی دەستکرد! ئێستا دەتوانیت کلیک لە دروستکردن بکەیت.`);
                            };
                            reader.readAsDataURL(blob);
                        } catch (err) {
                            alert('هەڵە لە هێنانی فایل لە Drive: ' + err.message);
                        } finally {
                            btn.innerHTML = '<i class="fas fa-magic"></i> بەکارهێنان لە Gemini AI';
                        }
                    });
                });

                gdriveFilesList.querySelectorAll('.btn-add-as-malzama').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const fileName = decodeURIComponent(btn.getAttribute('data-file-name') || '');
                        const webLink = btn.getAttribute('data-web-link') || '';
                        const mime = btn.getAttribute('data-mime') || '';

                        // Switch to add malzama tab
                        const malzamaTabBtn = document.querySelector('.d-tab[data-tab="tab-add-malzama"]');
                        if (malzamaTabBtn) malzamaTabBtn.click();

                        const titleInput = document.getElementById('malzama-title');
                        if (titleInput) titleInput.value = fileName.replace(/\.[^/.]+$/, "");

                        // Set format
                        let format = 'pdf';
                        if (mime.includes('presentation') || mime.includes('powerpoint')) format = 'pptx';
                        else if (mime.includes('html')) format = 'html';
                        else if (mime.includes('image')) format = 'image';

                        const formatBtn = document.querySelector(`.format-card-btn[data-format="${format}"]`);
                        if (formatBtn) formatBtn.click();

                        alert(`فایلی (${fileName}) ئامادەکرا بۆ پاشەکەوتکردن وەک مەلزەمە!`);
                    });
                });

                // Delete with MANDATORY explicit confirmation dialog
                gdriveFilesList.querySelectorAll('.btn-delete-drive-file').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const fileId = btn.getAttribute('data-file-id');
                        const fileName = decodeURIComponent(btn.getAttribute('data-file-name') || '');

                        window.GoogleDriveService.showDestructiveConfirmDialog({
                            title: 'پشتڕاستکردنەوەی سڕینەوە لە Google Drive',
                            message: 'ئایا دڵنیایت دەتەوێت ئەم فایلە بۆ هەمیشە لە Google Drive بسڕیتەوە؟ ئەم کردارە ناگەڕێتەوە.',
                            itemName: fileName,
                            onConfirm: async () => {
                                try {
                                    await window.GoogleDriveService.deleteFile(fileId);
                                    showDriveStatus(`فایلی (${fileName}) بە سەرکەوتوویی لە Google Drive سڕایەوە.`);
                                    await loadDriveFiles();
                                } catch (err) {
                                    alert('هەڵە لە سڕینەوەی فایل: ' + err.message);
                                }
                            }
                        });
                    });
                });
            }
        } catch (err) {
            console.error('Error loading Google Drive files:', err);
            if (gdriveFilesLoading) gdriveFilesLoading.style.display = 'none';
            if (err.message === 'NOT_AUTHENTICATED') {
                updateDriveAuthUI(null);
            } else {
                showDriveStatus('هەڵە لە بارکردنی فایلەکانی Drive: ' + err.message, 'error');
            }
        }
    }

    function updateDriveAuthUI(authInfo) {
        const user = authInfo ? authInfo.user : null;
        const token = authInfo ? authInfo.token : null;

        if (token && user) {
            if (gdriveLoginPrompt) gdriveLoginPrompt.style.display = 'none';
            if (gdriveFilesManager) gdriveFilesManager.style.display = 'block';
            if (gdriveUserBadge) gdriveUserBadge.style.display = 'flex';
            if (gdriveUserEmail) gdriveUserEmail.textContent = user.email || user.displayName || 'گووگڵ درایڤ';
            loadDriveFiles();
        } else {
            if (gdriveLoginPrompt) gdriveLoginPrompt.style.display = 'block';
            if (gdriveFilesManager) gdriveFilesManager.style.display = 'none';
            if (gdriveUserBadge) gdriveUserBadge.style.display = 'none';
        }
    }

    // Google Sign-In button click
    if (gdriveLoginBtn) {
        gdriveLoginBtn.addEventListener('click', async () => {
            if (!window.GoogleDriveService) {
                alert('سیستەمی Google Drive ئامادە نییە، تکایە کەمێکی تر دووبارەی بکەرەوە.');
                return;
            }
            try {
                gdriveLoginBtn.disabled = true;
                const result = await window.GoogleDriveService.signInWithGoogle();
                updateDriveAuthUI({ user: result.user, token: result.accessToken });
                showDriveStatus('بە سەرکەوتوویی بە هەژماری Google پەیوەست بوویت!');
            } catch (err) {
                console.error(err);
                alert('چوونەژوورەوە بە سەرکەوتوویی تەواو نەبوو: ' + (err.message || ''));
            } finally {
                gdriveLoginBtn.disabled = false;
            }
        });
    }

    // Sign out button click
    if (gdriveSignoutBtn) {
        gdriveSignoutBtn.addEventListener('click', async () => {
            if (window.GoogleDriveService) {
                await window.GoogleDriveService.signOut();
                updateDriveAuthUI(null);
                showDriveStatus('لە Google Drive دەرچوویت.');
            }
        });
    }

    // Filter Buttons
    gdriveFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            gdriveFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDriveFilter = btn.getAttribute('data-filter') || 'all';
            loadDriveFiles();
        });
    });

    // Search Input debounce
    if (gdriveSearchInput) {
        gdriveSearchInput.addEventListener('input', () => {
            clearTimeout(driveSearchDebounceTimer);
            driveSearchDebounceTimer = setTimeout(() => {
                loadDriveFiles();
            }, 400);
        });
    }

    // Refresh Button
    if (gdriveRefreshBtn) {
        gdriveRefreshBtn.addEventListener('click', () => {
            loadDriveFiles();
        });
    }

    // Quick upload from device directly to Google Drive
    if (gdriveQuickUploadInput) {
        gdriveQuickUploadInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            showDriveStatus(`فایلی (${file.name}) بەرزدەکرێتەوە بۆ Google Drive...`);
            try {
                await window.GoogleDriveService.uploadFile({
                    name: file.name,
                    content: file,
                    mimeType: file.type || 'application/octet-stream',
                    description: 'کەرەستەی خوێندن لە پلاتفۆرمی پۆلا 10-11-12'
                });
                showDriveStatus(`فایلی (${file.name}) بە سەرکەوتوویی لە Google Drive پاشەکەوت کرا!`);
                await loadDriveFiles();
            } catch (err) {
                alert('هەڵە لە بارکردنی فایل بۆ Drive: ' + err.message);
            } finally {
                gdriveQuickUploadInput.value = '';
            }
        });
    }

    // Import from Google Drive trigger inside AI Studio form
    if (btnImportFromGdrive) {
        btnImportFromGdrive.addEventListener('click', () => {
            const gdriveTabBtn = document.querySelector('.d-tab[data-tab="tab-gdrive"]');
            if (gdriveTabBtn) {
                gdriveTabBtn.click();
            }
        });
    }

    // Save presentation HTML to Google Drive
    async function saveCurrentPresentationToGoogleDrive() {
        if (!currentAiOutput || !currentAiOutput.htmlContent) {
            alert('هیچ پاوەرپۆینتێک ئامادە نییە بۆ پاشەکەوتکردن!');
            return;
        }

        if (!window.GoogleDriveService || !window.GoogleDriveService.getAccessToken()) {
            const wantLogin = confirm('بۆ پاشەکەوتکردن لە Google Drive پێویستە بچیتە ژوورەوە بە هەژماری Google. ئایا دەتەوێت بچیتە ژوورەوە؟');
            if (wantLogin) {
                try {
                    await window.GoogleDriveService.signInWithGoogle();
                } catch (err) {
                    alert('چوونەژوورەوە سەرکەوتوو نەبوو: ' + err.message);
                    return;
                }
            } else {
                return;
            }
        }

        const fileName = `${currentAiOutput.title || 'وانەی_پاوەرپۆینت'}.html`;
        try {
            const uploadBtn = btnSaveAiGdrive || btnSavePptGdriveDirect;
            if (uploadBtn) uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> دەنێردرێت بۆ Drive...';

            const result = await window.GoogleDriveService.uploadFile({
                name: fileName,
                content: currentAiOutput.htmlContent,
                mimeType: 'text/html',
                description: `پاوەرپۆینتی ئەنیمەیشنکراوی وانە - بابەت: ${currentAiOutput.subject || ''} - پۆل: ${currentAiOutput.grade || ''}`
            });

            alert(`پاوەرپۆینت بە سەرکەوتوویی لە Google Drive پاشەکەوت کرا!\nناوی فایل: ${fileName}`);
        } catch (err) {
            alert('هەڵە لە پاشەکەوتکردن لە Google Drive: ' + err.message);
        } finally {
            if (btnSaveAiGdrive) {
                btnSaveAiGdrive.innerHTML = '<i class="fab fa-google-drive"></i> پاشەکەوت لە Google Drive';
            }
            if (btnSavePptGdriveDirect) {
                btnSavePptGdriveDirect.innerHTML = '<i class="fab fa-google-drive"></i> ناردن بۆ Drive';
            }
        }
    }

    if (btnSaveAiGdrive) {
        btnSaveAiGdrive.addEventListener('click', saveCurrentPresentationToGoogleDrive);
    }
    if (btnSavePptGdriveDirect) {
        btnSavePptGdriveDirect.addEventListener('click', saveCurrentPresentationToGoogleDrive);
    }

    // Subscribe to Google Drive Auth state
    if (window.GoogleDriveService) {
        window.GoogleDriveService.onAuthStateChanged((state) => {
            updateDriveAuthUI(state);
        });
    }

    // Initial Load
    refreshTeacherProfileUI();
});

