// =========================================================================
// Admin Panel Master Controller (UPDATED)
// Powers: 
// 1. Teacher Submission Approvals with Multi-format Preview (PPTX, HTML, Image, PDF)
// 2. Language-aware Teacher & Content Registry
// 3. One-click Approve/Reject/Delete workflow
// 4. User subscriptions and support chat
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const dataStore = window.EducationalData;
    const gradesConfig = window.GRADES_CONFIG;

    // Verify Super Admin Access
    if (!dataStore.isCurrentUserSuperAdmin()) {
        const pass = prompt("تکایە تێپەڕەوشەی ئەدمینی گشتی بنڤیسە (یان بە ئیمەیلی م. حسێن ئەکرەم زێباری داخل ببە):");
        if (pass === "admin123" || pass === "hussein123" || pass === "123456") {
            localStorage.setItem('is_admin_mode_active', 'true');
        } else {
            alert("تۆ دەسەڵاتی ئەدمینت نییە.");
            window.location.href = "index.html";
            return;
        }
    }

    // Navigation Tabs
    const adminTabs = document.querySelectorAll('.admin-tab');
    const contentViews = document.querySelectorAll('.content-view');

    adminTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            adminTabs.forEach(t => t.classList.remove('active'));
            contentViews.forEach(v => v.style.display = 'none');

            tab.classList.add('active');
            const targetViewId = tab.getAttribute('data-view');
            const targetView = document.getElementById(targetViewId);
            if (targetView) targetView.style.display = 'block';
        });
    });

    // Logout
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('is_admin_mode_active');
            window.location.href = 'index.html';
        });
    }

    // ==========================================
    // 1. APPROVALS WORKFLOW (SUBMISSIONS REVIEW)
    // ==========================================
    const approvalsListContainer = document.getElementById('approvals-list-container');
    const pendingBadgeCount = document.getElementById('pending-badge-count');
    const filterApprovalButtons = document.querySelectorAll('.filter-approval-btn');
    let currentApprovalFilter = 'pending';

    filterApprovalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterApprovalButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentApprovalFilter = btn.getAttribute('data-filter');
            renderApprovals();
        });
    });

    function renderApprovals() {
        let items = [];
        if (currentApprovalFilter === 'pending') {
            items = dataStore.getPendingSubmissions();
        } else {
            const vids = dataStore.getAllVideos(false, null, true).map(v => ({ ...v, type: 'video' }));
            const qzs = dataStore.getAllQuizzes(false, null, true).map(q => ({ ...q, type: 'quiz' }));
            const mlzs = dataStore.getAllMalzamas(false, null, true).map(m => ({ ...m, type: 'malzama' }));
            items = [...vids, ...qzs, ...mlzs].sort((a, b) => b.createdAt - a.createdAt);
        }

        const pendingOnlyCount = dataStore.getPendingSubmissions().length;
        pendingBadgeCount.textContent = pendingOnlyCount;

        if (items.length === 0) {
            approvalsListContainer.innerHTML = `
                <div style="text-align:center; padding: 50px; background:var(--surface-color); border-radius:14px; border:1px solid var(--border-color); color:var(--secondary-text);">
                    <i class="fas fa-check-double" style="font-size: 3rem; color: #28a745; margin-bottom: 15px;"></i>
                    <h3>دەستخۆش م. حسێن! هیچ داخوازییەکی چاوەڕوان نییە.</h3>
                    <p>گشت وانە، پرسیار، مەلزەمە، و سلایدەکان پێداچوونەوەیان بۆ کراوە.</p>
                </div>
            `;
            return;
        }

        approvalsListContainer.innerHTML = items.map(item => {
            const gradeObj = gradesConfig.find(g => g.id === String(item.grade)) || { name: 'پۆلا ' + item.grade };
            const langLabel = dataStore.getLanguageLabel(item.lang || 'ku_ba');
            let typeBadge = '';
            let contentDetailHtml = '';

            if (item.type === 'video') {
                typeBadge = '<span style="color:#ff0000; font-weight:bold;"><i class="fab fa-youtube"></i> وانەی ڤیدیۆیی یوتیوب</span>';
                contentDetailHtml = `
                    <h3 style="margin:5px 0 8px; font-size:1.15rem;">${item.title}</h3>
                    <div style="font-size:0.9rem; color:var(--secondary-text); margin-bottom:8px;">
                        <strong>بەند:</strong> ${item.chapter || ''}
                    </div>
                    ${item.youtubeUrl ? `
                        <div style="margin: 10px 0;">
                            <a href="${item.youtubeUrl}" target="_blank" style="color:var(--blue-accent); font-size:0.85rem; text-decoration:none;">
                                <i class="fas fa-external-link-alt"></i> لینکی یوتیوب: ${item.youtubeUrl}
                            </a>
                        </div>
                    ` : ''}
                `;
            } else if (item.type === 'quiz') {
                typeBadge = '<span style="color:#007bff; font-weight:bold;"><i class="fas fa-question-circle"></i> پرسیاری هەڵبژاردن</span>';
                const optionsHtml = (item.options || []).map((opt, i) => `
                    <div style="padding: 6px 12px; border-radius: 6px; margin: 4px 0; font-size:0.9rem; background: ${i === item.correctIndex ? 'rgba(40,167,69,0.15); border: 1px solid #28a745; font-weight:bold;' : 'rgba(0,0,0,0.03);'}">
                        ${i === item.correctIndex ? '<i class="fas fa-check" style="color:#28a745;"></i> ' : ''}
                        ${opt} ${i === item.correctIndex ? '<span style="color:#28a745; font-size:0.8rem;">(وەڵامی دروست)</span>' : ''}
                    </div>
                `).join('');

                contentDetailHtml = `
                    <div style="font-size:0.85rem; color:#8a2be2; font-weight:bold; margin-bottom:5px;">
                        <i class="fas fa-book"></i> ${item.chapter || ''}
                    </div>
                    <h3 style="margin: 0 0 10px; font-size: 1.15rem; line-height: 1.6;">${item.question}</h3>
                    <div style="margin-bottom: 10px;">${optionsHtml}</div>
                    ${item.explanation ? `<div style="font-size:0.85rem; color:var(--secondary-text); background:rgba(0,123,255,0.05); padding:8px 12px; border-radius:6px;"><strong>تێبینی شیکار:</strong> ${item.explanation}</div>` : ''}
                `;
            } else {
                // Multi-format malzama (PowerPoint, HTML, Image, PDF)
                const fType = item.fileType || 'pdf';
                let formatColor = '#28a745';
                let formatIcon = 'fa-file-pdf';
                let formatText = 'پەڕاوی PDF';

                if (fType === 'pptx') {
                    formatColor = '#d83b01';
                    formatIcon = 'fa-file-powerpoint';
                    formatText = 'پاوەرپوینت PowerPoint';
                } else if (fType === 'html') {
                    formatColor = '#0077b6';
                    formatIcon = 'fa-file-code';
                    formatText = 'پەڕەی ئینتەرئەکتیڤ HTML';
                } else if (fType === 'image') {
                    formatColor = '#7b2cbf';
                    formatIcon = 'fa-file-image';
                    formatText = 'وێنە Image';
                }

                typeBadge = `<span style="color:${formatColor}; font-weight:bold;"><i class="fas ${formatIcon}"></i> ${formatText}</span>`;
                contentDetailHtml = `
                    <div style="font-size:0.85rem; color:${formatColor}; font-weight:bold; margin-bottom:5px;">
                        <i class="fas fa-bookmark"></i> ${item.chapter || ''}
                    </div>
                    <h3 style="margin: 5px 0 8px; font-size: 1.15rem;">${item.title}</h3>
                    <p style="margin: 0 0 10px; color: var(--secondary-text); font-size: 0.9rem;">${item.description || ''}</p>
                    <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:8px;">
                        <button class="btn-cancel admin-preview-doc-btn" data-id="${item.id}" style="padding:6px 14px; font-size:0.85rem; color:var(--blue-accent); border-color:var(--blue-accent);">
                            <i class="fas fa-eye"></i> پێشبینینی ڕاستەوخۆ (Preview)
                        </button>
                        <span style="font-size:0.8rem; color:var(--secondary-text);"><i class="fas fa-hdd"></i> ${item.fileSize || '1.5 MB'}</span>
                        ${item.fileUrl && item.fileUrl !== '#' ? `
                            <a href="${item.fileUrl}" target="_blank" style="color:var(--blue-accent); font-size:0.85rem; text-decoration:none;"><i class="fas fa-download"></i> بەستەری داگرتن</a>
                        ` : ''}
                    </div>
                `;
            }

            const isApproved = item.status === 'approved';
            const cardBorderClass = isApproved ? 'approved-border' : '';

            return `
                <div class="approval-card ${cardBorderClass}" id="card-${item.id}">
                    <div class="approval-header">
                        <div class="teacher-meta">
                            <i class="fas fa-user-circle" style="font-size:1.6rem; color:var(--blue-accent);"></i>
                            <div>
                                <strong style="font-size:1rem;">${item.teacherName || 'مامۆستا'}</strong>
                                <span style="background:rgba(0,123,255,0.1); color:var(--blue-accent); font-size:0.75rem; padding: 2px 8px; border-radius:6px; margin-right:8px;">
                                    ${gradeObj.name}
                                </span>
                                <span style="background:rgba(138,43,226,0.1); color:#8a2be2; font-size:0.75rem; padding: 2px 8px; border-radius:6px; margin-right:4px;">
                                    ${langLabel}
                                </span>
                                ${item.subject ? `
                                <span style="background:rgba(0,180,216,0.12); color:#0077b6; font-size:0.75rem; padding: 2px 8px; border-radius:6px; margin-right:4px; font-weight:bold;">
                                    <i class="fas fa-book"></i> ${item.subject}
                                </span>
                                ` : ''}
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap: 8px;">
                            ${typeBadge}
                            <span style="font-size:0.75rem; color:var(--secondary-text);">
                                ${new Date(item.createdAt || Date.now()).toLocaleDateString('ku-IQ')}
                            </span>
                        </div>
                    </div>

                    <div style="margin-bottom: 18px;">
                        ${contentDetailHtml}
                    </div>

                    <div class="action-btn-group">
                        ${!isApproved ? `
                            <button class="btn-approve-action" data-id="${item.id}" data-type="${item.type}">
                                <i class="fas fa-check-circle"></i> پەسەند بکە (Approve & Publish)
                            </button>
                        ` : `
                            <span style="color:#28a745; font-size:0.85rem; font-weight:bold; display:inline-flex; align-items:center; gap:4px;">
                                <i class="fas fa-check-double"></i> پەسەندکراوە و بەردەستە لە پۆلدا
                            </span>
                        `}
                        <button class="btn-reject-action" data-id="${item.id}" data-type="${item.type}">
                            <i class="fas fa-ban"></i> ڕەت بکە (Reject)
                        </button>
                        <button class="btn-delete-action" data-id="${item.id}" data-type="${item.type}">
                            <i class="fas fa-trash-alt"></i> بسڕەوە (Delete)
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Action Handlers
        document.querySelectorAll('.btn-approve-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const type = btn.getAttribute('data-type');
                dataStore.approveItem(id, type);
                renderApprovals();
            });
        });

        document.querySelectorAll('.btn-reject-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const type = btn.getAttribute('data-type');
                dataStore.rejectItem(id, type);
                renderApprovals();
            });
        });

        document.querySelectorAll('.btn-delete-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const type = btn.getAttribute('data-type');
                if (confirm('ئایا دڵنیایت لە سڕینەوەی ئەم بابەتە لە سیستەم؟')) {
                    dataStore.deleteItem(id, type, null, true);
                    renderApprovals();
                }
            });
        });

        // Admin Document Preview
        document.querySelectorAll('.admin-preview-doc-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const mlzList = dataStore.getAllMalzamas(false, null, true);
                const item = mlzList.find(m => m.id === id);
                if (item) {
                    openAdminDocViewer(item);
                }
            });
        });
    }

    // Document Viewer Modal Controller
    const docModal = document.getElementById('doc-viewer-modal');
    const closeDocBtn = document.getElementById('close-doc-btn');
    const docViewport = document.getElementById('doc-viewer-viewport');
    const docModalTitle = document.getElementById('doc-modal-title');
    const docModalBadge = document.getElementById('doc-modal-format-badge');
    const docModalDownload = document.getElementById('doc-modal-download-btn');

    function openAdminDocViewer(item) {
        docModalTitle.textContent = item.title;
        const formatType = item.fileType || 'pdf';
        docModalBadge.textContent = formatType.toUpperCase();
        docModalDownload.href = item.fileData || item.fileUrl || '#';
        docModalDownload.download = item.fileName || `${item.title}.${formatType}`;

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
                        <i class="fas fa-file-powerpoint" style="font-size:3.5rem; color:#d83b01; margin-bottom:12px;"></i>
                        <h3>فایلی پاوەرپوینت (${item.fileName || 'presentation.pptx'})</h3>
                        <p>${item.fileSize || 'PowerPoint Presentation'}</p>
                        <a href="${item.fileData || item.fileUrl}" download="${item.fileName || 'presentation.pptx'}" class="btn-save" style="background:#d83b01; text-decoration:none; padding:8px 22px;">
                            <i class="fas fa-download"></i> تاقیکردنەوەی داگرتن
                        </a>
                    </div>
                `;
            }
        }
        docModal.style.display = 'flex';
    }

    if (closeDocBtn) {
        closeDocBtn.addEventListener('click', () => {
            docModal.style.display = 'none';
            docViewport.innerHTML = '';
        });
    }

    // ==========================================
    // 2. TEACHERS MANAGEMENT VIEW
    // ==========================================
    const teachersMgmtList = document.getElementById('teachers-mgmt-list');
    const addNewTeacherBtn = document.getElementById('add-new-teacher-btn');

    function renderTeachersManagement() {
        const teachers = dataStore.getAllTeachers();

        teachersMgmtList.innerHTML = teachers.map((teacher, index) => {
            const isTop1 = index === 0;
            const langLabel = dataStore.getLanguageLabel(teacher.lang || 'ku_ba');

            return `
                <div class="teacher-item-card">
                    <div class="teacher-avatar-and-info">
                        <img src="${teacher.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}" alt="${teacher.name}">
                        <div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <h3 style="margin:0; font-size:1.15rem;">${teacher.name}</h3>
                                ${isTop1 ? `<span style="background:linear-gradient(135deg, #f5af19, #e65c00); color:#fff; font-size:0.75rem; padding:2px 8px; border-radius:10px; font-weight:bold;"><i class="fas fa-fire"></i> زۆرترین بینەر</span>` : ''}
                                <span style="background:rgba(138,43,226,0.1); color:#8a2be2; font-size:0.75rem; padding:2px 8px; border-radius:10px;">${langLabel}</span>
                            </div>
                            <p style="margin:3px 0; color:var(--blue-accent); font-size:0.9rem;">${teacher.subject || 'کیمیا'}</p>
                            <p style="margin:0; color:var(--secondary-text); font-size:0.8rem;">
                                ${teacher.email || teacher.phone || ''} — پۆلەکانی وانەگۆتن: ${(teacher.grades || []).join('، ')}
                            </p>
                        </div>
                    </div>
                    <div style="text-align:left;">
                        <div style="font-size:1.1rem; font-weight:bold; color:var(--blue-accent); margin-bottom:5px;">
                            <i class="fas fa-eye"></i> ${(teacher.viewsCount || 0).toLocaleString()} بینین
                        </div>
                        <button class="btn-cancel delete-teacher-btn" data-id="${teacher.id}" style="padding:4px 10px; font-size:0.8rem; color:#dc3545; border-color:rgba(220,53,69,0.3);">
                            <i class="fas fa-trash-alt"></i> لابردن
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.delete-teacher-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (id === 't_hussein') {
                    alert('ناتوانیت هەژماری ئەدمینی سەرەکی بسڕیتەوە.');
                    return;
                }
                if (confirm('ئایا دڵنیایت لە لابردنی ئەم مامۆستایە؟')) {
                    const teachers = dataStore.getAllTeachers().filter(t => t.id !== id);
                    localStorage.setItem(dataStore.STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
                    renderTeachersManagement();
                }
            });
        });
    }

    if (addNewTeacherBtn) {
        addNewTeacherBtn.addEventListener('click', () => {
            const name = prompt('ناوی سێ قۆڵی مامۆستا بنووسە:');
            if (!name) return;
            const subject = prompt('وانە / بابەت (بۆ نموونە: کیمیا):') || 'کیمیا';
            const lang = prompt('زمان (ku_ba بۆ باهدینی، ku_so بۆ سۆرانی، ar بۆ عەرەبی، en بۆ ئینگلیزی):', 'ku_ba') || 'ku_ba';
            dataStore.saveTeacher({
                name: name,
                subject: subject,
                lang: lang,
                grades: ['10', '11', '12'],
                viewsCount: 20
            });
            renderTeachersManagement();
            alert('مامۆستا بە سەرکەوتوویی زیادکرا.');
        });
    }

    // ==========================================
    // 3. USER MANAGEMENT & 4. CHAT SUPPORT
    // ==========================================
    const userListUl = document.getElementById('admin-user-list');
    function renderUserAccounts() {
        if (!userListUl) return;
        const mockUsers = [
            { email: 'Hussein.zebary.chemistry96@gmail.com', role: 'Super Admin', status: 'چالاک' },
            { email: 'student12@gmail.com', role: 'قوتابی پۆلا ١٢', status: 'چالاک' },
            { email: 'sidad.chemistry@gmail.com', role: 'مامۆستا', status: 'چالاک' }
        ];
        userListUl.innerHTML = mockUsers.map(u => `
            <li style="background:var(--surface-color); border:1px solid var(--border-color); border-radius:10px; padding:12px 16px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${u.email}</strong>
                    <div style="font-size:0.8rem; color:var(--secondary-text);">${u.role}</div>
                </div>
                <span style="color:#28a745; font-size:0.85rem; font-weight:bold;">${u.status}</span>
            </li>
        `).join('');
    }

    // ==========================================
    // 5. AI & POWERPOINT MASTER TEMPLATE LOGIC
    // ==========================================
    const tplPrimaryColor = document.getElementById('tpl-primary-color');
    const tplPrimaryText = document.getElementById('tpl-primary-text');
    const tplAccentColor = document.getElementById('tpl-accent-color');
    const tplAccentText = document.getElementById('tpl-accent-text');
    const tplSlideBgColor = document.getElementById('tpl-slide-bg-color');
    const tplSlideBgText = document.getElementById('tpl-slide-bg-text');
    const tplPageBgColor = document.getElementById('tpl-page-bg-color');
    const tplPageBgText = document.getElementById('tpl-page-bg-text');
    const tplBrandingText = document.getElementById('tpl-branding-text');
    const tplSystemPrompt = document.getElementById('tpl-system-prompt');
    const btnSaveAiTemplate = document.getElementById('btn-save-ai-template');
    const btnResetAiTemplate = document.getElementById('btn-reset-ai-template');
    const btnUpdatePreview = document.getElementById('btn-update-preview');
    const tplSaveStatus = document.getElementById('tpl-save-status');
    const previewIframe = document.getElementById('template-live-preview-frame');

    // Two-way sync between color picker and hex text inputs
    function setupColorInputSync(colorInput, textInput) {
        if (!colorInput || !textInput) return;
        colorInput.addEventListener('input', () => {
            textInput.value = colorInput.value;
            triggerPreviewUpdate();
        });
        textInput.addEventListener('input', () => {
            if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
                colorInput.value = textInput.value;
                triggerPreviewUpdate();
            }
        });
    }

    setupColorInputSync(tplPrimaryColor, tplPrimaryText);
    setupColorInputSync(tplAccentColor, tplAccentText);
    setupColorInputSync(tplSlideBgColor, tplSlideBgText);
    setupColorInputSync(tplPageBgColor, tplPageBgText);

    if (tplBrandingText) tplBrandingText.addEventListener('input', triggerPreviewUpdate);

    async function loadAiTemplateConfig() {
        try {
            const res = await fetch('/api/admin/template');
            if (res.ok) {
                const cfg = await res.json();
                applyConfigToInputs(cfg);
                localStorage.setItem('admin_master_ai_template', JSON.stringify(cfg));
                return;
            }
        } catch (e) {
            console.warn('Could not fetch /api/admin/template, checking localStorage');
        }

        const local = localStorage.getItem('admin_master_ai_template');
        if (local) {
            try {
                applyConfigToInputs(JSON.parse(local));
            } catch (e) {}
        }
    }

    function applyConfigToInputs(cfg) {
        if (!cfg) return;
        if (tplPrimaryColor && cfg.primaryColor) {
            tplPrimaryColor.value = cfg.primaryColor;
            if (tplPrimaryText) tplPrimaryText.value = cfg.primaryColor;
        }
        if (tplAccentColor && cfg.accentColor) {
            tplAccentColor.value = cfg.accentColor;
            if (tplAccentText) tplAccentText.value = cfg.accentColor;
        }
        if (tplSlideBgColor && cfg.slideBackground) {
            tplSlideBgColor.value = cfg.slideBackground;
            if (tplSlideBgText) tplSlideBgText.value = cfg.slideBackground;
        }
        if (tplPageBgColor && cfg.backgroundColor) {
            tplPageBgColor.value = cfg.backgroundColor;
            if (tplPageBgText) tplPageBgText.value = cfg.backgroundColor;
        }
        if (tplBrandingText && cfg.brandingText) {
            tplBrandingText.value = cfg.brandingText;
        }
        if (tplSystemPrompt && cfg.systemPromptInstructions) {
            tplSystemPrompt.value = cfg.systemPromptInstructions;
        }
        updateLivePreview();
    }

    function getCurrentTemplateConfig() {
        return {
            version: 1,
            themeName: 'Custom Teacher Master Template',
            primaryColor: tplPrimaryText ? tplPrimaryText.value : '#00b4d8',
            accentColor: tplAccentText ? tplAccentText.value : '#7209b7',
            backgroundColor: tplPageBgText ? tplPageBgText.value : '#0a0f1d',
            slideBackground: tplSlideBgText ? tplSlideBgText.value : '#131b2e',
            textColor: '#f8fafc',
            fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            brandingText: tplBrandingText ? tplBrandingText.value : 'ماڵپەرێ فەرمی یێ مامۆستایان - وانە و پوختەیا پاوەرپۆینت',
            systemPromptInstructions: tplSystemPrompt ? tplSystemPrompt.value : 'تۆ مامۆستایەکی شارەزای پرۆگرامی پەروەردەی هەرێمی کوردستانی.'
        };
    }

    let previewDebounceTimer = null;
    function triggerPreviewUpdate() {
        clearTimeout(previewDebounceTimer);
        previewDebounceTimer = setTimeout(updateLivePreview, 200);
    }

    function updateLivePreview() {
        if (!previewIframe) return;
        const cfg = getCurrentTemplateConfig();

        const sampleSlides = [
            {
                id: 1,
                title: 'کیمیایا پۆلا ١٢ - خەستییا گیراوەیان',
                layout: 'intro',
                summary: 'پوختەیا بەندێ ئێکێ ب شێوازێ سلایدێن پێشکەفتی یێن پاوەرپۆینت',
                icon: 'fa-flask'
            },
            {
                id: 2,
                title: 'پێناسە و یاسایێن خەستیێ (Molarity)',
                badge: 'یاسا و پێناسە',
                summary: 'خەستییا مۆلاری پێوانەکردنی ژمارەی مۆلەکانی ماددەی توواوەیە لە یەک لیتر گیراوەدا.',
                bullets: [
                    'یاسای گشتی: M = n / V (Litre)',
                    'یەکەی پێوانەی خەستی: mol/L یان M',
                    'کاریگەری پلەی گەرمی لەسەر قەبارەی گیراوە'
                ],
                formulaBox: 'M = \\frac{n}{V} = \\frac{m}{Mw \\times V}',
                keyTakeaway: 'هەردەم قەبارە دەبێت بە یەکەی لیتر (L) بێت پێش بەکارهێنانی یاساکە.',
                icon: 'fa-atom'
            }
        ];

        // Generate preview html string
        const previewHtml = `<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { margin:0; padding:15px; background:${cfg.backgroundColor}; color:#fff; font-family:system-ui, sans-serif; direction:rtl; height:100vh; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; }
        .slide { background:${cfg.slideBackground}; border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.5); }
        .badge { background:${cfg.primaryColor}22; color:${cfg.primaryColor}; border:1px solid ${cfg.primaryColor}55; padding:3px 10px; border-radius:10px; font-size:0.75rem; font-weight:bold; }
        .formula { background:linear-gradient(135deg, ${cfg.primaryColor}18, ${cfg.accentColor}18); border:1px solid ${cfg.primaryColor}44; border-radius:8px; padding:10px; text-align:center; font-family:monospace; font-size:1.1rem; direction:ltr; margin:10px 0; color:#fff; }
        .takeaway { background:rgba(255,193,7,0.1); border:1px solid rgba(255,193,7,0.3); border-radius:8px; padding:8px 12px; font-size:0.8rem; color:#fef08a; display:flex; gap:8px; align-items:center; }
        .branding { font-size:0.72rem; color:#94a3b8; margin-top:10px; text-align:center; }
    </style>
</head>
<body>
    <div class="slide">
        <span class="badge">پێناسە و یاسا</span>
        <h3 style="margin:8px 0; font-size:1.2rem; color:#fff;">کیمیایا پۆلا ١٢ - خەستییا گیراوەیان</h3>
        <p style="margin:0 0 10px; font-size:0.85rem; color:#cbd5e1;">خەستییا مۆلاری پێوانەکردنی ژمارەی مۆلەکانی ماددەی توواوەیە لە یەک لیتر گیراوەدا.</p>
        <div class="formula">M = n / V (Litre) = m / (Mw × V)</div>
        <div class="takeaway"><i class="fas fa-lightbulb" style="color:#ffc107;"></i> هەردەم قەبارە دەبێت بە یەکەی لیتر بێت.</div>
    </div>
    <div class="branding"><i class="fas fa-shield-alt" style="color:${cfg.primaryColor};"></i> ${cfg.brandingText}</div>
</body>
</html>`;

        previewIframe.srcdoc = previewHtml;
    }

    if (btnUpdatePreview) btnUpdatePreview.addEventListener('click', updateLivePreview);

    if (btnSaveAiTemplate) {
        btnSaveAiTemplate.addEventListener('click', async () => {
            const config = getCurrentTemplateConfig();
            btnSaveAiTemplate.disabled = true;
            btnSaveAiTemplate.innerHTML = '<i class="fas fa-spinner fa-spin"></i> پاشەکەوت دەکرێت...';

            try {
                const res = await fetch('/api/admin/template', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                });
                if (res.ok) {
                    localStorage.setItem('admin_master_ai_template', JSON.stringify(config));
                    if (tplSaveStatus) {
                        tplSaveStatus.style.display = 'inline-flex';
                        setTimeout(() => { tplSaveStatus.style.display = 'none'; }, 3000);
                    }
                    alert('قالبی پاوەرپۆینت بە سەرکەوتوویی پاشەکەوتکرا! هەموو مامۆستایان ئەم دیزاینە نوێیە بەکاردەهێنن کاتێ وانەی نوێ بەرهەمدەهێنن.');
                } else {
                    throw new Error('Server returned ' + res.status);
                }
            } catch (err) {
                // Fallback to localStorage
                localStorage.setItem('admin_master_ai_template', JSON.stringify(config));
                alert('قالب لە کۆگای ناوخۆیی پاشەکەوتکرا.');
            } finally {
                btnSaveAiTemplate.disabled = false;
                btnSaveAiTemplate.innerHTML = '<i class="fas fa-save"></i> پاشەکەوتکردن بو گشت مامۆستایان';
            }
        });
    }

    if (btnResetAiTemplate) {
        btnResetAiTemplate.addEventListener('click', () => {
            if (confirm('ئایا دڵنیایت لە گەڕاندنەوەی قالبی سەرەکی بۆ ڕەنگ و شێوازی بنەڕەت؟')) {
                const defaultConfig = {
                    version: 1,
                    themeName: 'Royal Dark Presentation',
                    primaryColor: '#00b4d8',
                    accentColor: '#7209b7',
                    backgroundColor: '#0a0f1d',
                    slideBackground: '#131b2e',
                    textColor: '#f8fafc',
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                    brandingText: 'ماڵپەرێ فەرمی یێ مامۆستایان - وانە و پوختەیا پاوەرپۆینت',
                    systemPromptInstructions: 'تۆ مامۆستایەکی شارەزای پرۆگرامی پەروەردەی هەرێمی کوردستانی. وانەکان بە شێوازی سلایدی پاوەرپۆینتی پێشکەوتوو بە زمانی کوردی بە ڕوونی، خاڵبەندی جوان، پێناسە، یاسا و نموونە ئامادە بکە.'
                };
                applyConfigToInputs(defaultConfig);
                updateLivePreview();
            }
        });
    }

    const btnBackupTemplateGdrive = document.getElementById('btn-backup-template-gdrive');
    if (btnBackupTemplateGdrive) {
        btnBackupTemplateGdrive.addEventListener('click', async () => {
            if (!window.GoogleDriveService) {
                alert('سیستەمی Google Drive ئامادە نییە.');
                return;
            }

            if (!window.GoogleDriveService.getAccessToken()) {
                const wantLogin = confirm('بۆ پاشەکەوتکردنی قاڵب لە Google Drive پێویستە بچیتە ژوورەوە بە هەژماری Google. ئایا دەتەوێت پەیوەست بیت؟');
                if (!wantLogin) return;
                try {
                    await window.GoogleDriveService.signInWithGoogle();
                } catch (e) {
                    alert('پەیوەستبوون سەرکەوتوو نەبوو: ' + e.message);
                    return;
                }
            }

            const config = getActiveConfigFromInputs();
            btnBackupTemplateGdrive.disabled = true;
            btnBackupTemplateGdrive.innerHTML = '<i class="fas fa-spinner fa-spin"></i> دەنێردرێت بۆ Drive...';

            try {
                const jsonContent = JSON.stringify(config, null, 2);
                const fileName = `Master_AI_Presentation_Template_${new Date().toISOString().slice(0,10)}.json`;

                await window.GoogleDriveService.uploadFile({
                    name: fileName,
                    content: jsonContent,
                    mimeType: 'application/json',
                    description: 'پاشەکەوتی قاڵبی سەرەکی پاوەرپۆینت و ژیریی دەستکردی ئەدمین - پۆلا 10-11-12'
                });

                alert(`قاڵبی سەرەکی پاوەرپۆینت بە سەرکەوتوویی لە Google Drive پاشەکەوت کرا!\nناوی فایل: ${fileName}`);
            } catch (err) {
                alert('هەڵە لە پاشەکەوتکردن لە Google Drive: ' + err.message);
            } finally {
                btnBackupTemplateGdrive.disabled = false;
                btnBackupTemplateGdrive.innerHTML = '<i class="fab fa-google-drive"></i> پاشەکەوت لە Google Drive';
            }
        });
    }

    // Initial render
    renderApprovals();
    renderTeachersManagement();
    renderUserAccounts();
    loadAiTemplateConfig();
});

