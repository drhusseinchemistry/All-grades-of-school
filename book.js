document.addEventListener('DOMContentLoaded', () => {

    // ========== KODA PARASTINÊ Û PWA (WEK BERÊ) ==========
    const overlay = document.getElementById('screenshot-overlay');
    window.addEventListener('blur', () => { overlay.style.display = 'flex'; });
    window.addEventListener('focus', () => { overlay.style.display = 'none'; });
    document.addEventListener('contextmenu', event => event.preventDefault());
    document.addEventListener('dragstart', event => {
        if (event.target.tagName === 'IMG') event.preventDefault();
    });
    let deferredPrompt;
    const installPwaBtn = document.getElementById('install-pwa-btn');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installPwaBtn.style.display = 'flex';
    });
    installPwaBtn.addEventListener('click', async () => {
        if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; installPwaBtn.style.display = 'none'; }
    });
    window.addEventListener('appinstalled', () => { installPwaBtn.style.display = 'none'; deferredPrompt = null; });

    // ========== KODA GUHERTINA TEMAYAN Û PARASTINA ÇAVAN (WEK BERÊ) ==========
    const pdfThemeBtn = document.getElementById('pdf-theme-btn');
    const monochromeThemeBtn = document.getElementById('monochrome-theme-btn');
    const eyeCareBtn = document.getElementById('eye-care-btn');
    const bookBody = document.querySelector('.book-body');
    function applyTheme(themeName) {
        bookBody.classList.remove('pdf-theme', 'monochrome-theme');
        if (themeName) bookBody.classList.add(themeName);
        localStorage.setItem('activeTheme', themeName || '');
    }
    const savedTheme = localStorage.getItem('activeTheme');
    if (savedTheme) applyTheme(savedTheme);
    if (localStorage.getItem('eyeCareActive') === 'true') bookBody.classList.add('eye-care-active');
    pdfThemeBtn.addEventListener('click', () => {
        const isCurrentlyActive = bookBody.classList.contains('pdf-theme');
        applyTheme(isCurrentlyActive ? '' : 'pdf-theme');
    });
    monochromeThemeBtn.addEventListener('click', () => {
        const isCurrentlyActive = bookBody.classList.contains('monochrome-theme');
        applyTheme(isCurrentlyActive ? '' : 'monochrome-theme');
    });
    eyeCareBtn.addEventListener('click', () => {
        bookBody.classList.toggle('eye-care-active');
        localStorage.setItem('eyeCareActive', bookBody.classList.contains('eye-care-active'));
    });

    // ========== KODA PIRTÛKÊ Û ZOOMA NÛ (WEK BERÊ) ==========
    let allPosts = [];
    let currentPageIndex = 0;
    let postsPerPage = 1;
    let isDragging = false;
    const bookView = document.getElementById('book-view');
    const bookContainer = document.getElementById('book-container');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    
    const topControls = document.getElementById('top-controls');
    const moreOptionsBtn = document.getElementById('more-options-btn');
    const moreOptionsMenu = document.getElementById('more-options-menu');
    let controlsTimeout;

    function showControls() { clearTimeout(controlsTimeout); topControls.classList.add('controls-visible'); controlsTimeout = setTimeout(hideControls, 4000); }
    function hideControls() { topControls.classList.remove('controls-visible'); moreOptionsMenu.classList.remove('visible'); }
    bookContainer.addEventListener('click', showControls);
    bookContainer.addEventListener('mousemove', showControls);
    bookContainer.addEventListener('touchstart', showControls, { passive: true });
    moreOptionsBtn.addEventListener('click', (e) => { e.stopPropagation(); moreOptionsMenu.classList.toggle('visible'); showControls(); });
    
    const urlParams = new URLSearchParams(window.location.search);
    const pola = urlParams.get('pola');
    
    const savedPageIndex = sessionStorage.getItem(`lastPageIndex_pola${pola}`);
    if (savedPageIndex) {
        currentPageIndex = parseInt(savedPageIndex, 10);
    }

    if (!pola || !['10', '11', '12'].includes(pola)) {
        bookView.innerHTML = '<p class="loading-text">Pola nehatiye diyarkirin an jî şaş e. Ji kerema xwe ji rûpela sereke vegerin.</p>';
        document.getElementById('top-controls').style.display = 'none';
        return;
    }
    
    const dbPath = `pola${pola}_imagesData`;
    const postsRef = database.ref(dbPath);

    function updatePostsPerPage() {
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        const isWideScreen = window.innerWidth >= 768;
        const newPostsPerPage = (isLandscape || isWideScreen) ? 2 : 1;
        if (postsPerPage !== newPostsPerPage) {
            postsPerPage = newPostsPerPage;
            if (currentPageIndex % postsPerPage !== 0) {
                currentPageIndex = Math.floor(currentPageIndex / postsPerPage) * postsPerPage;
            }
            renderBookView();
        }
    }

    function renderBookView() {
        if (!bookView || allPosts.length === 0) return;
        bookView.innerHTML = '';
        if (currentPageIndex < 0) currentPageIndex = 0;
        if (currentPageIndex >= allPosts.length) currentPageIndex = Math.floor((allPosts.length - 1) / postsPerPage) * postsPerPage;
        
        const pagePosts = allPosts.slice(currentPageIndex, Math.min(currentPageIndex + postsPerPage, allPosts.length));
        pagePosts.forEach((post) => {
            const img = document.createElement('img');
            img.alt = `پۆست #${post.id}`;
            img.draggable = false;
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isDragging) return;
                createZoomOverlay(img.src);
            });
            bookView.appendChild(img);
            img.src = post.imageUrl;
        });
        prevBtn.disabled = (currentPageIndex === 0);
        nextBtn.disabled = (currentPageIndex + postsPerPage >= allPosts.length);
        preloadAdjacentImages(currentPageIndex);

        sessionStorage.setItem(`lastPageIndex_pola${pola}`, currentPageIndex);
    }
    
    function createZoomOverlay(src) {
        const zoomOverlay = document.createElement('div');
        zoomOverlay.classList.add('zoom-overlay');
        const panzoomWrapper = document.createElement('div');
        panzoomWrapper.classList.add('panzoom-wrapper');
        const zoomedImg = document.createElement('img');
        zoomedImg.src = src;
        panzoomWrapper.appendChild(zoomedImg);
        zoomOverlay.appendChild(panzoomWrapper);
        document.body.appendChild(zoomOverlay);
        const panzoom = Panzoom(zoomedImg, { maxScale: 10, minScale: 1, contain: 'outside' });
        panzoomWrapper.addEventListener('wheel', panzoom.zoomWithWheel, { passive: false });
        zoomOverlay.addEventListener('click', () => { document.body.removeChild(zoomOverlay); });
    }

    function preloadAdjacentImages(currentIndex) {
        const preloadCount = postsPerPage * 2;
        for (let i = 1; i <= preloadCount; i++) {
            const nextIndex = currentIndex + i;
            if (nextIndex < allPosts.length) {
                const post = allPosts[nextIndex];
                if (post && post.imageUrl) { (new Image()).src = post.imageUrl; }
            }
        }
    }

    postsRef.on('value', snapshot => {
        const data = snapshot.val();
        if (data && Object.keys(data).length > 0) {
            bookView.innerHTML = '<p class="loading-text">Wêne tên daxistin, ji kerema xwe li bendê be...</p>';
            allPosts = Object.keys(data).map(key => ({ id: key, ...data[key] })).sort((a, b) => parseInt(a.id) - parseInt(b.id));
            updatePostsPerPage();
            renderBookView();
            setTimeout(showControls, 500);
        } else {
            bookView.innerHTML = `<p class="loading-text">Ti pۆst ji bo pola ${pola} nehatine dîtin.</p>`;
        }
    });

    prevBtn.addEventListener('click', () => { if (currentPageIndex > 0) { currentPageIndex -= postsPerPage; renderBookView(); } });
    nextBtn.addEventListener('click', () => { if (currentPageIndex + postsPerPage < allPosts.length) { currentPageIndex += postsPerPage; renderBookView(); } });
    window.addEventListener('resize', updatePostsPerPage);
    window.matchMedia("(orientation: landscape)").addEventListener("change", updatePostsPerPage);

    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {});
        } else if (document.exitFullscreen) { document.exitFullscreen(); }
    }
    fullscreenBtn.addEventListener('click', toggleFullScreen);
    
    if (urlParams.get('fullscreen') === 'true') {
        document.body.addEventListener('click', toggleFullScreen, { once: true });
        document.body.addEventListener('touchend', toggleFullScreen, { once: true });
    }

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchQuery = searchInput.value.trim().toLowerCase();
        if (!searchQuery || allPosts.length === 0) return;
        const postIndex = allPosts.findIndex(post => post.id.toString().toLowerCase() === searchQuery || (post.nivisin && post.nivisin.toLowerCase().includes(searchQuery)));
        if (postIndex !== -1) { currentPageIndex = postIndex - (postIndex % postsPerPage); renderBookView(); searchInput.value = ''; searchInput.blur(); } 
        else { alert(`Ti encam bo "${searchInput.value.trim()}" nehat dîtin.`); }
    });
    
    const externalLinkOverlay = document.getElementById('external-link-overlay');
    const externalLinkContent = document.querySelector('.external-link-content');
    const leftTapArea = document.getElementById('left-tap-area');
    let lastTap = 0; const doubleTapDelay = 300; let overlayTouchStartX = 0; let overlayTouchMoveX = 0;
    
    const iframeOverlay = document.getElementById('iframe-overlay-container');
    const toolIframe = document.getElementById('tool-iframe');
    const closeIframeBtn = document.querySelector('.close-iframe-btn');

    function toggleExternalOverlay(forceHide = false) { if (forceHide || externalLinkOverlay.classList.contains('visible')) { externalLinkOverlay.classList.remove('visible'); externalLinkContent.style.transform = 'translateX(0)'; } else { externalLinkOverlay.classList.add('visible'); } }
    
    leftTapArea.addEventListener('touchstart', (e) => { const currentTime = new Date().getTime(); const tapLength = currentTime - lastTap; if (tapLength < doubleTapDelay && tapLength > 0) { e.preventDefault(); } lastTap = currentTime; }, { passive: false });
    
    externalLinkOverlay.addEventListener('click', (e) => { if (e.target === externalLinkOverlay) { toggleExternalOverlay(true); } });
    externalLinkOverlay.addEventListener('touchstart', (e) => { overlayTouchStartX = e.touches[0].clientX; overlayTouchMoveX = overlayTouchStartX; externalLinkContent.style.transition = 'none'; }, { passive: true });
    externalLinkOverlay.addEventListener('touchmove', (e) => { overlayTouchMoveX = e.touches[0].clientX; const diff = overlayTouchMoveX - overlayTouchStartX; if (diff < 0) { externalLinkContent.style.transform = `translateX(${diff}px)`; } }, { passive: true });
    externalLinkOverlay.addEventListener('touchend', (e) => { const diff = overlayTouchMoveX - overlayTouchStartX; externalLinkContent.style.transition = 'transform 0.3s ease-out'; if (diff < -80) { toggleExternalOverlay(true); } else { externalLinkContent.style.transform = 'translateX(0)'; } });

    let touchStartCoords = { x: 0, y: 0 };
    let touchEndCoords = { x: 0, y: 0 };
    let touchStartTime = 0;
    let initialTouches = 0;
    const swipeThreshold = 60; 

    function showTool(tool) {
        let src = '';
        if (tool === 'calculator') {
            src = 'calculated.html';
        } else if (tool === 'board') {
            src = 'board.html';
        }

        if (src) {
            if (toolIframe.dataset.currentTool !== tool) {
                 toolIframe.src = src;
                 toolIframe.dataset.currentTool = tool;
            }
            iframeOverlay.style.display = 'flex';
        }
    }

    function hideTool() {
        iframeOverlay.style.display = 'none';
    }
    closeIframeBtn.addEventListener('click', hideTool);

    bookContainer.addEventListener('touchstart', e => {
        initialTouches = e.touches.length;
        touchStartTime = new Date().getTime();
        touchStartCoords = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        touchEndCoords = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        isDragging = false;
    }, { passive: true });

    bookContainer.addEventListener('touchmove', e => {
        if (e.touches.length > 0) {
            touchEndCoords = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            if (Math.abs(touchEndCoords.x - touchStartCoords.x) > 10 || Math.abs(touchEndCoords.y - touchStartCoords.y) > 10) {
                isDragging = true;
            }
        }
    }, { passive: true });

    bookContainer.addEventListener('touchend', e => {
        const touchEndTime = new Date().getTime();
        const duration = touchEndTime - touchStartTime;

        if (duration < 600) { 
            const deltaX = touchEndCoords.x - touchStartCoords.x;
            const deltaY = touchEndCoords.y - touchStartCoords.y;

            if (initialTouches === 1) {
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
                    if (deltaX < 0) nextBtn.click();
                    else prevBtn.click();
                } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > swipeThreshold) {
                    if (deltaY > 0) {
                        window.location.href = `pola-${pola}.html`;
                    }
                }
            } else if (initialTouches === 2) {
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
                    if (deltaX < 0) {
                        showTool('calculator');
                    } else {
                        showTool('board');
                    }
                } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > swipeThreshold) {
                    if (deltaY > 0) {
                        window.location.href = `pola-${pola}-quiz.html`;
                    }
                }
            }
        }
        initialTouches = 0;
        isDragging = false; 
    });

});
