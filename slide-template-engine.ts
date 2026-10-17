// Slide Template Engine for PowerPoint-Style HTML Presentations
export interface SlideData {
  id: number;
  title: string;
  badge?: string;
  layout?: 'standard' | 'split' | 'formula' | 'cards' | 'summary' | 'intro';
  summary?: string;
  bullets?: string[];
  formulaBox?: string;
  keyTakeaway?: string;
  icon?: string;
}

export interface PresentationData {
  presentationTitle: string;
  presentationSubtitle?: string;
  grade?: string;
  subject?: string;
  teacherName?: string;
  chapter?: string;
  themeConfig?: {
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    slideBackground?: string;
    textColor?: string;
    fontFamily?: string;
    brandingText?: string;
  };
  slides: SlideData[];
}

export function generatePowerPointHtml(data: PresentationData): string {
  const cfg = data.themeConfig || {};
  const primary = cfg.primaryColor || '#00b4d8';
  const accent = cfg.accentColor || '#7209b7';
  const bg = cfg.backgroundColor || '#0a0f1d';
  const slideBg = cfg.slideBackground || '#131b2e';
  const textColor = cfg.textColor || '#f8fafc';
  const font = cfg.fontFamily || "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const branding = cfg.brandingText || 'وانە و پوختەیا پاوەرپۆینت - ماڵپەرێ فەرمی یێ مامۆستایان';

  const slidesJson = JSON.stringify(data.slides).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(data.presentationTitle || 'پێشکەشکردنی وانە')}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: ${primary};
            --accent: ${accent};
            --bg: ${bg};
            --slide-bg: ${slideBg};
            --text: ${textColor};
            --text-muted: #94a3b8;
            --border: rgba(255, 255, 255, 0.12);
            --card-bg: rgba(255, 255, 255, 0.05);
            --font-family: ${font};
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: var(--font-family);
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            user-select: none;
            direction: rtl;
        }

        /* Presentation Top Bar */
        .ppt-header {
            height: 56px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            z-index: 100;
        }

        .ppt-title-area {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .subject-tag {
            background: linear-gradient(135deg, var(--primary), var(--accent));
            color: #ffffff;
            font-size: 0.78rem;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .deck-title {
            font-size: 1rem;
            font-weight: 700;
            color: var(--text);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 380px;
        }

        .ppt-controls {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .ppt-btn {
            background: var(--card-bg);
            border: 1px solid var(--border);
            color: var(--text);
            padding: 6px 12px;
            border-radius: 8px;
            font-family: inherit;
            font-size: 0.85rem;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        }

        .ppt-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: var(--primary);
            color: #ffffff;
        }

        .ppt-btn.active {
            background: var(--primary);
            color: #ffffff;
            border-color: var(--primary);
        }

        /* Progress Bar */
        .progress-container {
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.08);
            position: relative;
        }

        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, var(--accent), var(--primary));
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            width: 0%;
        }

        /* Slide Stage / Viewport */
        .ppt-stage {
            flex: 1;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            perspective: 1000px;
        }

        .slide-frame {
            width: 100%;
            max-width: 1100px;
            height: 85vh;
            max-height: 640px;
            background: var(--slide-bg);
            border: 1px solid var(--border);
            border-radius: 20px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
            transition: transform 0.3s ease;
        }

        /* Individual Slide Canvas */
        .slide-content {
            flex: 1;
            padding: 40px 48px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            justify-content: center;
            opacity: 0;
            transform: translateY(15px);
            transition: opacity 0.4s ease, transform 0.4s ease;
        }

        .slide-content.active {
            opacity: 1;
            transform: translateY(0);
        }

        /* Slide Typography */
        .slide-badge-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
        }

        .slide-pill {
            background: rgba(0, 180, 216, 0.15);
            color: var(--primary);
            border: 1px solid rgba(0, 180, 216, 0.3);
            font-size: 0.8rem;
            font-weight: 700;
            padding: 3px 12px;
            border-radius: 12px;
        }

        .slide-heading {
            font-size: 2.2rem;
            font-weight: 800;
            line-height: 1.25;
            margin-bottom: 18px;
            color: #ffffff;
            letter-spacing: -0.5px;
        }

        .slide-summary-banner {
            background: rgba(255, 255, 255, 0.04);
            border-right: 4px solid var(--primary);
            padding: 14px 20px;
            border-radius: 10px;
            font-size: 1.1rem;
            line-height: 1.6;
            color: #e2e8f0;
            margin-bottom: 22px;
        }

        /* Bullets list */
        .slide-bullets {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 20px;
        }

        .slide-bullet-item {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            font-size: 1.05rem;
            line-height: 1.6;
            color: #cbd5e1;
        }

        .bullet-icon {
            color: var(--primary);
            font-size: 1rem;
            margin-top: 5px;
            flex-shrink: 0;
        }

        /* Highlights / Formulas / Cards */
        .formula-card {
            background: linear-gradient(135deg, rgba(0, 180, 216, 0.1), rgba(114, 9, 183, 0.1));
            border: 1px solid rgba(0, 180, 216, 0.3);
            border-radius: 14px;
            padding: 20px 24px;
            margin: 15px 0;
            text-align: center;
        }

        .formula-text {
            font-size: 1.6rem;
            font-weight: 800;
            color: #ffffff;
            direction: ltr;
            letter-spacing: 1px;
            font-family: 'Courier New', Courier, monospace;
        }

        .takeaway-card {
            background: rgba(255, 193, 7, 0.08);
            border: 1px solid rgba(255, 193, 7, 0.25);
            border-radius: 12px;
            padding: 14px 18px;
            display: flex;
            align-items: center;
            gap: 14px;
            margin-top: auto;
            color: #fef08a;
            font-size: 0.95rem;
        }

        .takeaway-card i {
            color: #ffc107;
            font-size: 1.4rem;
            flex-shrink: 0;
        }

        /* Title Slide Layout */
        .title-slide-wrapper {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
        }

        .title-slide-icon {
            width: 85px;
            height: 85px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.4rem;
            color: #ffffff;
            margin-bottom: 24px;
            box-shadow: 0 10px 30px rgba(0, 180, 216, 0.4);
            animation: pulse-icon 2.5s infinite;
        }

        @keyframes pulse-icon {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        .title-slide-heading {
            font-size: 2.8rem;
            font-weight: 900;
            margin-bottom: 14px;
            background: linear-gradient(135deg, #ffffff, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .title-slide-subtitle {
            font-size: 1.3rem;
            color: var(--text-muted);
            max-width: 700px;
            line-height: 1.6;
            margin-bottom: 25px;
        }

        .title-slide-meta {
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 0.95rem;
            color: #94a3b8;
            margin-bottom: 30px;
            flex-wrap: wrap;
            justify-content: center;
        }

        .title-slide-meta span {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: var(--card-bg);
            border: 1px solid var(--border);
            padding: 6px 14px;
            border-radius: 20px;
        }

        .start-btn {
            background: linear-gradient(135deg, var(--primary), var(--accent));
            color: #ffffff;
            border: none;
            padding: 12px 32px;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 8px 25px rgba(0, 180, 216, 0.35);
            transition: all 0.2s;
        }

        .start-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 30px rgba(0, 180, 216, 0.5);
        }

        /* Presentation Bottom Footer */
        .ppt-footer {
            height: 60px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(12px);
            border-top: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            z-index: 100;
        }

        .nav-btn-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .slide-counter-badge {
            font-size: 0.9rem;
            color: var(--text-muted);
            font-weight: 600;
            padding: 4px 12px;
            border-radius: 8px;
            background: var(--card-bg);
            border: 1px solid var(--border);
        }

        .slide-dots {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            cursor: pointer;
            transition: all 0.2s;
        }

        .dot.active {
            background: var(--primary);
            width: 24px;
            border-radius: 10px;
        }

        /* Editable Notice */
        .edit-badge-indicator {
            display: none;
            background: #ff9800;
            color: #000;
            font-size: 0.75rem;
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 6px;
            margin-right: 8px;
        }

        [contenteditable="true"] {
            outline: 2px dashed var(--primary);
            padding: 4px;
            border-radius: 6px;
            user-select: text;
        }

        /* Fullscreen styles */
        :fullscreen .slide-frame,
        :-webkit-full-screen .slide-frame {
            height: 88vh;
            max-height: 92vh;
            max-width: 95vw;
        }

        @media (max-width: 768px) {
            .slide-heading { font-size: 1.5rem; }
            .slide-content { padding: 20px; }
            .title-slide-heading { font-size: 1.8rem; }
            .deck-title { max-width: 160px; font-size: 0.85rem; }
        }
    </style>
</head>
<body>
    <!-- Top Navigation Header -->
    <header class="ppt-header">
        <div class="ppt-title-area">
            <span class="subject-tag">
                <i class="fas fa-chalkboard-teacher"></i> ${escapeHtml(data.subject || 'کیمیا')}
            </span>
            <span class="deck-title" id="deck-title-el">${escapeHtml(data.presentationTitle || 'پێشکەشکردنی وانە')}</span>
            <span class="edit-badge-indicator" id="edit-indicator">دۆخی دەستکاری چالاکە</span>
        </div>

        <div class="ppt-controls">
            <button class="ppt-btn" id="btn-edit-mode" title="دەستکاریکردنی تێکستی سلایدەکان">
                <i class="fas fa-edit"></i> <span id="edit-btn-text">دەستکاری</span>
            </button>
            <button class="ppt-btn" id="btn-fullscreen" title="پیشاندانی تەواوی شاشە">
                <i class="fas fa-expand"></i>
            </button>
        </div>
    </header>

    <!-- Progress Indicator -->
    <div class="progress-container">
        <div class="progress-bar" id="ppt-progress"></div>
    </div>

    <!-- Presentation Stage -->
    <main class="ppt-stage">
        <div class="slide-frame" id="slide-frame">
            <div id="slide-container" style="height: 100%; display: flex; flex-direction: column;">
                <!-- Slides will be rendered here dynamically -->
            </div>
        </div>
    </main>

    <!-- Bottom Navigation Footer -->
    <footer class="ppt-footer">
        <div class="branding-watermark" style="font-size:0.8rem; color:var(--text-muted);">
            <i class="fas fa-shield-alt" style="color:var(--primary); margin-left:4px;"></i>
            <span>${escapeHtml(branding)}</span>
        </div>

        <div class="slide-dots" id="slide-dots-container"></div>

        <div class="nav-btn-group">
            <span class="slide-counter-badge" id="slide-counter">١ ژ ١</span>
            <button class="ppt-btn" id="btn-prev" title="سلایدی پێشوو (Arrow Right)">
                <i class="fas fa-chevron-right"></i> پێشوو
            </button>
            <button class="ppt-btn" id="btn-next" style="background:var(--primary); color:#ffffff;" title="سلایدی دواتر (Arrow Left / Space)">
                دواتر <i class="fas fa-chevron-left"></i>
            </button>
        </div>
    </footer>

    <script>
        const SLIDES_DATA = ${slidesJson};
        let currentIndex = 0;
        let isEditMode = false;

        const slideContainer = document.getElementById('slide-container');
        const progressBar = document.getElementById('ppt-progress');
        const slideCounter = document.getElementById('slide-counter');
        const dotsContainer = document.getElementById('slide-dots-container');
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');
        const btnEdit = document.getElementById('btn-edit-mode');
        const editIndicator = document.getElementById('edit-indicator');
        const btnFullscreen = document.getElementById('btn-fullscreen');

        function renderSlides() {
            // Render Dots
            dotsContainer.innerHTML = SLIDES_DATA.map((_, idx) => 
                \`<div class="dot \${idx === currentIndex ? 'active' : ''}" onclick="goToSlide(\${idx})"></div>\`
            ).join('');

            // Render Current Slide
            const s = SLIDES_DATA[currentIndex];
            const isTitleSlide = s.layout === 'intro' || currentIndex === 0;

            let slideHtml = '';

            if (isTitleSlide) {
                slideHtml = \`
                    <div class="slide-content active title-slide-wrapper">
                        <div class="title-slide-icon">
                            <i class="fas \${s.icon || 'fa-atom'}"></i>
                        </div>
                        <h1 class="title-slide-heading" contenteditable="\${isEditMode}">\${s.title}</h1>
                        <p class="title-slide-subtitle" contenteditable="\${isEditMode}">\${s.summary || '${escapeHtml(data.presentationSubtitle || '')}'}</p>
                        
                        <div class="title-slide-meta">
                            <span><i class="fas fa-book"></i> \${'${escapeHtml(data.subject || 'کیمیا')}'}</span>
                            <span><i class="fas fa-graduation-cap"></i> \${'${escapeHtml(data.grade ? `پۆلا ${data.grade}` : 'پۆلا ١٢')}'}</span>
                            <span><i class="fas fa-chalkboard-teacher"></i> \${'${escapeHtml(data.teacherName || 'مامۆستای بابەت')}'}</span>
                        </div>

                        <button class="start-btn" onclick="nextSlide()">
                            <span>دەستپێکرنا وانێ</span>
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                \`;
            } else {
                const bulletsHtml = (s.bullets || []).map(b => \`
                    <li class="slide-bullet-item">
                        <i class="fas fa-check-circle bullet-icon"></i>
                        <span contenteditable="\${isEditMode}">\${b}</span>
                    </li>
                \`).join('');

                const formulaHtml = s.formulaBox ? \`
                    <div class="formula-card">
                        <div class="formula-text" contenteditable="\${isEditMode}">\${s.formulaBox}</div>
                    </div>
                \` : '';

                const takeawayHtml = s.keyTakeaway ? \`
                    <div class="takeaway-card">
                        <i class="fas fa-lightbulb"></i>
                        <div>
                            <strong style="display:block; margin-bottom:2px;">تێبینی و ڕێسای زێڕین:</strong>
                            <span contenteditable="\${isEditMode}">\${s.keyTakeaway}</span>
                        </div>
                    </div>
                \` : '';

                slideHtml = \`
                    <div class="slide-content active">
                        <div class="slide-badge-row">
                            <span class="slide-pill">\${s.badge || 'خاڵا گرنگ'}</span>
                            <span style="font-size:0.8rem; color:var(--text-muted);"><i class="fas \${s.icon || 'fa-file-alt'}"></i> سلاید \${currentIndex + 1}</span>
                        </div>

                        <h2 class="slide-heading" contenteditable="\${isEditMode}">\${s.title}</h2>

                        \${s.summary ? \`<div class="slide-summary-banner" contenteditable="\${isEditMode}">\${s.summary}</div>\` : ''}

                        \${bulletsHtml ? \`<ul class="slide-bullets">\${bulletsHtml}</ul>\` : ''}

                        \${formulaHtml}

                        \${takeawayHtml}
                    </div>
                \`;
            }

            slideContainer.innerHTML = slideHtml;

            // Update footer
            slideCounter.textContent = \`\${currentIndex + 1} ژ \${SLIDES_DATA.length}\`;
            const pct = ((currentIndex + 1) / SLIDES_DATA.length) * 100;
            progressBar.style.width = \`\${pct}%\`;

            btnPrev.disabled = currentIndex === 0;
            btnPrev.style.opacity = currentIndex === 0 ? '0.4' : '1';

            if (currentIndex === SLIDES_DATA.length - 1) {
                btnNext.innerHTML = 'دووبارە <i class="fas fa-redo"></i>';
            } else {
                btnNext.innerHTML = 'دواتر <i class="fas fa-chevron-left"></i>';
            }
        }

        function nextSlide() {
            if (currentIndex < SLIDES_DATA.length - 1) {
                currentIndex++;
            } else {
                currentIndex = 0;
            }
            renderSlides();
        }

        function prevSlide() {
            if (currentIndex > 0) {
                currentIndex--;
                renderSlides();
            }
        }

        function goToSlide(idx) {
            if (idx >= 0 && idx < SLIDES_DATA.length) {
                currentIndex = idx;
                renderSlides();
            }
        }

        btnNext.addEventListener('click', nextSlide);
        btnPrev.addEventListener('click', prevSlide);

        // Keyboard Navigation (RTL: Arrow Left is Next, Arrow Right is Prev)
        window.addEventListener('keydown', (e) => {
            if (isEditMode) return; // Allow typing without changing slide
            if (e.key === 'ArrowLeft' || e.key === ' ' || e.key === 'PageDown') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowRight' || e.key === 'PageUp') {
                e.preventDefault();
                prevSlide();
            }
        });

        // Edit Mode Toggle
        btnEdit.addEventListener('click', () => {
            isEditMode = !isEditMode;
            btnEdit.classList.toggle('active', isEditMode);
            editIndicator.style.display = isEditMode ? 'inline-block' : 'none';
            document.getElementById('edit-btn-text').textContent = isEditMode ? 'تەواوکرن' : 'دەستکاری';
            renderSlides();
        });

        // Fullscreen Toggle
        btnFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {});
            } else {
                document.exitFullscreen();
            }
        });

        // Initial render
        renderSlides();
    </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
