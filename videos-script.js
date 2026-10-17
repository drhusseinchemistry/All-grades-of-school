// --- START OF FILE videos-script.js (GUHERTÎ Û TÊKÛZ) ---

document.addEventListener('DOMContentLoaded', function() {
    if (!firebase || !firebase.apps.length) {
        console.error("Firebase nehatiye destpêkirin! Piştrast be ku `firebase-config.js` hatiye barkirin.");
        document.body.innerHTML = '<h1>Firebase Initialization Error!</h1>';
        return;
    }

    const db = firebase.firestore();
    const auth = firebase.auth(); 

    // --- Get Grade and Teacher from URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const pola = urlParams.get('pola');
    const teacher = urlParams.get('teacher');

    const backLink = document.getElementById('back-to-teachers-link');
    if (backLink && pola) {
        backLink.href = `videos-teachers.html?pola=${pola}`;
    }

    if (!pola || !teacher) {
        document.body.innerHTML = `<div style="text-align: center; padding: 50px; color: var(--primary-text);"><h1>کێشە!</h1><p>پول یان ماموستا نەهاتیە دیارکرن. تکایە بزڤرە و جارەکا دی هەلبژێرە.</p><a href="index.html" style="color: var(--blue-accent);">زڤرین</a></div>`;
        return;
    }
    
    const collectionName = `pola${pola}_videos_${teacher}`;
    const videosCollection = db.collection(collectionName);
    
    const teacherName = teacher === 'hussein' ? 'ماموستا حسێن اکرم' : 'ماموستا سیداد عبدالقادر';
    document.querySelector('.page-header h1').textContent = `وانێن پولا ${pola} - ${teacherName}`;

    const settingsDocRef = db.collection('siteConfig').doc('playerSettings');
    const videosGrid = document.getElementById('videos-grid');
    const modal = document.getElementById('video-modal');
    const form = document.getElementById('video-form');
    
    const logoutBtn = document.getElementById('logout-btn');
    const searchInput = document.getElementById('search-input');
    const playerSettingsBtn = document.getElementById('player-settings-btn');
    const saveDefaultsBtn = document.getElementById('save-defaults-btn');
    const LOCAL_SETTINGS_KEY = 'kurdishPlayerSettings';

    let sortableInstance = null;
    let localVideosCache = [];
    let globalPlayerSettings = {};

    const SUPER_ADMIN_EMAIL = "hussein.zebary.chemistry96@gmail.com";

    async function checkIsAdmin(user) {
        if (!user) return false;
        if (user.email && user.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return true;
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            return userDoc.exists && userDoc.data().isAdmin === true;
        } catch (error) {
            console.error("Kêşe di piştrastkirina rola admin da:", error);
            return false;
        }
    }
    
    auth.onAuthStateChanged(async (user) => {
        const isAdmin = await checkIsAdmin(user);
        document.body.classList.toggle('admin-mode', isAdmin);
        renderVideos(localVideosCache);
    });
    
    async function initializePage() {
        await loadAndApplySettings();
        applySavedLayout();
        loadAndRenderVideos();
    }

    function loadAndRenderVideos() { 
        videosGrid.innerHTML = `<p style="color:var(--secondary-text); text-align: center; width: 100%;">...ڤیدیۆ دهێنە بارکرن</p>`;
        videosCollection.orderBy('order').onSnapshot(snapshot => {
            localVideosCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderVideos(localVideosCache);
        }, error => {
            console.error(`Kêşe di standina vîdyoyan ji ${collectionName} da:`, error);
            videosGrid.innerHTML = `<p style="color:red;">Kêşe di barkirina vîdyoyan da! Collection: ${collectionName}</p>`;
        });
    }

    function getYoutubeId(url) { try { const urlObj = new URL(url); return (urlObj.hostname === 'youtu.be') ? urlObj.pathname.slice(1) : urlObj.searchParams.get('v'); } catch (e) { return null; } }
    
    function renderVideos(videos) { 
        const isAdmin = document.body.classList.contains('admin-mode');
        videosGrid.innerHTML = ''; 
        if (videos.length === 0 && !isAdmin) {
             videosGrid.innerHTML = '<p style="color:var(--secondary-text); text-align: center; width: 100%;">هێشتا هیچ ڤیدیۆیەک بۆ ڤی بەشی نەهاتییە بارکرن.</p>';
        }

        videos.forEach(video => { 
            const videoId = getYoutubeId(video.link); 
            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : 'placeholder.jpg'; 
            const subjectAlign = video.subjectAlign || 'right';
            const infoAlign = video.infoAlign || 'center'; 

            if (isAdmin) { 
                const itemWrapper = document.createElement('div'); 
                itemWrapper.className = 'admin-video-item'; 
                itemWrapper.dataset.id = video.id; 
                itemWrapper.innerHTML = `
                    <div class="admin-controls-external"><i class="fas fa-edit edit-icon" title="گوهۆڕین"></i><i class="fas fa-trash delete-icon" title="ژێبرن"></i></div>
                    <div class="video-card">
                        <div class="thumbnail-container"><img src="${thumbnailUrl}" alt="${video.subject}" loading="lazy"><i class="fas fa-play play-icon"></i></div>
                        <div class="video-card-text-content">
                            <p class="video-subject" style="text-align: ${subjectAlign};">${video.subject || ''}</p>
                            <p class="video-info" style="text-align: ${infoAlign};">${video.info || ''}</p>
                        </div>
                        <div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
                    </div>`; 
                videosGrid.appendChild(itemWrapper); 
            } else { 
                const videoCard = document.createElement('div'); 
                videoCard.className = 'video-card'; 
                if (videoId) videoCard.dataset.videoid = videoId; 
                videoCard.innerHTML = `
                    <div class="thumbnail-container"><img src="${thumbnailUrl}" alt="${video.subject}" loading="lazy"><i class="fas fa-play play-icon"></i></div>
                    <div class="video-card-text-content">
                        <p class="video-subject" style="text-align: ${subjectAlign};">${video.subject || ''}</p>
                        <p class="video-info" style="text-align: ${infoAlign};">${video.info || ''}</p>
                    </div>`; 
                videosGrid.appendChild(videoCard); 
            } 
        }); 
        if (isAdmin) { 
            const addButton = document.createElement('div'); 
            addButton.className = 'add-item-card'; 
            addButton.innerHTML = '<h3><i class="fas fa-plus"></i> ڤیدیۆیەکا نوو زێدەبکە</h3>'; 
            addButton.addEventListener('click', () => showModal()); 
            videosGrid.appendChild(addButton); 
            initSortable(); 
        } else {
            if (sortableInstance) {
                sortableInstance.destroy();
                sortableInstance = null;
            }
        }
    }
    
    function initSortable() { if (sortableInstance) sortableInstance.destroy(); sortableInstance = new Sortable(videosGrid, { animation: 150, ghostClass: 'sortable-ghost', filter: '.add-item-card', handle: '.drag-handle', onEnd: async function(evt) { const orderedIds = Array.from(videosGrid.querySelectorAll('.admin-video-item')).map(el => el.dataset.id); const batch = db.batch(); orderedIds.forEach((docId, index) => { batch.update(videosCollection.doc(docId), { order: index }); }); try { await batch.commit(); } catch (error) { console.error(error); } }, }); }
    
    videosGrid.addEventListener('click', e => { 
        const isAdmin = document.body.classList.contains('admin-mode');
        const itemWrapper = e.target.closest('.admin-video-item'); 
        const videoCard = e.target.closest('.video-card'); 
        if (isAdmin && itemWrapper) { 
            const videoId = itemWrapper.dataset.id; 
            const video = localVideosCache.find(v => v.id === videoId); 
            if (e.target.classList.contains('edit-icon')) { 
                showModal(video); 
            } else if (e.target.classList.contains('delete-icon')) { 
                if (confirm(`تو پشتراستی دڤێی ڤیدیۆیا "${video.subject}" ژێببەی؟`)) { 
                    videosCollection.doc(videoId).delete(); 
                } 
            } else if (!e.target.closest('.drag-handle') && !e.target.closest('.admin-controls-external')) { 
                const ytId = getYoutubeId(video.link); 
                if (ytId) playVideo(ytId); 
            } 
        } else if (videoCard && videoCard.dataset.videoid) { 
            playVideo(videoCard.dataset.videoid); 
        } 
    });
    
    function showModal(video = null) { 
        form.reset();
        const editControls = document.getElementById('edit-only-controls');
        document.getElementById('video-id').value = video ? video.id : ''; 
        document.getElementById('modal-title').textContent = video ? 'گوهۆرینا ڤیدیۆیێ' : 'زێدەکرنا ڤیدیۆیەکا نوو'; 
        if(video){
            document.getElementById('video-subject').value = video.subject || ''; 
            document.getElementById('video-info').value = video.info || ''; 
            document.getElementById('video-link').value = video.link || '';
            editControls.style.display = 'block';
            document.querySelector(`input[name="subject-align"][value="${video.subjectAlign || 'right'}"]`).checked = true;
            document.querySelector(`input[name="info-align"][value="${video.infoAlign || 'center'}"]`).checked = true;
        } else {
             editControls.style.display = 'none';
        }
        modal.style.display = 'flex'; 
    }
    
    const pageHeader = document.querySelector('.page-header');
    if (pageHeader) {
        pageHeader.addEventListener('dblclick', () => {
            if (auth.currentUser) return;
            window.location.href = 'login.html';
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log('User signed out.');
            }).catch((error) => {
                console.error('Sign out error', error);
            });
        });
    }

    modal.querySelector('.btn-cancel').addEventListener('click', () => modal.style.display = 'none');
    
    form.addEventListener('submit', async e => { 
        e.preventDefault();
        if (!document.body.classList.contains('admin-mode')) {
            alert("Destûr nîne!");
            return;
        }

        const saveButton = form.querySelector('.btn-save');
        saveButton.disabled = true;
        saveButton.textContent = '...چاوەڕێ بە';

        const id = document.getElementById('video-id').value;

        try {
            const videoData = { 
                subject: document.getElementById('video-subject').value,
                info: document.getElementById('video-info').value,
                link: document.getElementById('video-link').value 
            };
            
            if (id) { 
                videoData.subjectAlign = document.querySelector('input[name="subject-align"]:checked').value;
                videoData.infoAlign = document.querySelector('input[name="info-align"]:checked').value;
                await videosCollection.doc(id).update(videoData); 
            } else { 
                videoData.order = localVideosCache.length; 
                videoData.subjectAlign = 'right';
                videoData.infoAlign = 'center';
                await videosCollection.add(videoData); 
            } 
            
            modal.style.display = 'none';
        } catch (error) {
            console.error("Kêşe di tomarkirina vîdyoyê da: ", error);
            alert(`کێشەیەک د پرۆسێسێ دا چێبوو:\n\n${error.message}`);
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'پاشکەفتن';
        }
    });

    searchInput.addEventListener('input', (e) => { 
        const searchTerm = e.target.value.toLowerCase().trim();
        const filteredVideos = localVideosCache.filter(v => 
            (v.subject && v.subject.toLowerCase().includes(searchTerm)) || 
            (v.info && v.info.toLowerCase().includes(searchTerm))
        );
        renderVideos(filteredVideos);
    });
    
    const playerModal = document.getElementById('video-player-modal');
    const closePlayerBtn = document.getElementById('close-player-btn');
    const playerContainer = document.getElementById('player-container');
    const progressBarContainer = document.querySelector('.progress-bar-container');
    const progressBarFilled = document.getElementById('progress-bar-filled');
    const progressBarThumb = document.getElementById('progress-bar-thumb');
    const currentTimeEl = document.getElementById('current-time');
    const totalDurationEl = document.getElementById('total-duration');
    const lockScreenBtn = document.getElementById('lock-screen-btn');
    const gestureOverlay = document.getElementById('gesture-overlay');
    const gestureFeedback = document.getElementById('gesture-feedback');
    const brightnessOverlay = document.getElementById('brightness-overlay');
    let player, progressInterval, controlsTimeout, singleTapTimeout, feedbackTimeout;
    let touchStartX, touchStartY, isDragging = false, gestureAction = null, lastTap = 0;
    const masterControlsMap = {};
    document.querySelectorAll('#video-player-modal .control-item-wrapper').forEach(wrapper => { masterControlsMap[wrapper.dataset.controlId] = wrapper; });
    const qualityMenu = masterControlsMap.quality?.querySelector('.quality-menu');
    const speedMenu = masterControlsMap.speed?.querySelector('.quality-menu');
    const ccMenu = masterControlsMap.cc?.querySelector('.quality-menu');
    function formatTime(seconds) { if (isNaN(seconds)) return '00:00'; const date = new Date(null); date.setSeconds(seconds); return date.toISOString().substr(14, 5); }
    function updateProgressBar() { if (!player || typeof player.getCurrentTime !== 'function') return; const currentTime = player.getCurrentTime(); const duration = player.getDuration(); if (duration > 0) { const progressPercent = (currentTime / duration) * 100; progressBarFilled.style.width = `${progressPercent}%`; progressBarThumb.style.left = `${progressPercent}%`; currentTimeEl.textContent = formatTime(currentTime); totalDurationEl.textContent = formatTime(duration); } }
    function updatePlayPauseIcon(state) { if (masterControlsMap['play-pause']) masterControlsMap['play-pause'].querySelector('i').className = (state === YT.PlayerState.PLAYING) ? 'fas fa-pause' : 'fas fa-play'; }
    function updateVolumeIcon() { if(!player || !masterControlsMap.volume) return; const volume = player.getVolume(); const icon = masterControlsMap.volume.querySelector('#volume-btn i'); if (player.isMuted() || volume === 0) icon.className = 'fas fa-volume-xmark'; else if (volume < 50) icon.className = 'fas fa-volume-low'; else icon.className = 'fas fa-volume-high'; }
    function showControlsTemporarily() { if (playerContainer.classList.contains('locked')) return; playerContainer.classList.add('controls-visible'); clearTimeout(controlsTimeout); if (player && player.getPlayerState() === YT.PlayerState.PLAYING) { controlsTimeout = setTimeout(() => playerContainer.classList.remove('controls-visible'), 5000); } }
    function onPlayerReady(event) { event.target.playVideo(); if (masterControlsMap.volume) { masterControlsMap.volume.querySelector('#volume-slider').value = player.getVolume(); updateVolumeIcon(); } }
    function onPlayerStateChange(event) { updatePlayPauseIcon(event.data); if (event.data === YT.PlayerState.PLAYING) { if (progressInterval) clearInterval(progressInterval); progressInterval = setInterval(updateProgressBar, 250); populateQualityMenu(player); populateSpeedMenu(player); populateCCMenu(player); showControlsTemporarily(); } else { clearInterval(progressInterval); clearTimeout(controlsTimeout); playerContainer.classList.add('controls-visible'); } if (event.data === YT.PlayerState.ENDED) { closePlayer(); } }
    function playVideo(videoId) { playerModal.style.display = 'flex'; document.body.style.overflow = 'hidden'; if (player && typeof player.loadVideoById === 'function') { player.loadVideoById(videoId); } else { player = new YT.Player('youtube-player', { height: '100%', width: '100%', videoId: videoId, playerVars: { 'playsinline': 1, 'controls': 0, 'showinfo': 0, 'rel': 0, 'iv_load_policy': 3, 'modestbranding': 1, 'disablekb': 1 }, events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange } }); } showControlsTemporarily(); }
    function closePlayer() { if (player && typeof player.stopVideo === 'function') player.stopVideo(); if (document.pictureInPictureElement) document.exitPictureInPicture(); playerModal.style.display = 'none'; document.body.style.overflow = 'auto'; clearInterval(progressInterval); playerContainer.classList.remove('locked', 'controls-visible'); lockScreenBtn.querySelector('i').className = 'fas fa-lock'; brightnessOverlay.style.opacity = 0; }
    function togglePlayPause() { if (!player) return; const state = player.getPlayerState(); if (state === YT.PlayerState.PLAYING) player.pauseVideo(); else player.playVideo(); }
    function toggleFullscreen() { const elem = document.getElementById('video-player-modal'); const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement; if (isFullscreen) { if (document.exitFullscreen) { document.exitFullscreen(); } else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); } else if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); } else if (document.msExitFullscreen) { document.msExitFullscreen(); } } else { if (elem.requestFullscreen) { elem.requestFullscreen(); } else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen(); } else if (elem.mozRequestFullScreen) { elem.mozRequestFullScreen(); } else if (elem.msRequestFullscreen) { elem.msRequestFullscreen(); } } }
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) { if(playerContainer.classList.contains('locked')) { playerContainer.classList.remove('locked'); lockScreenBtn.querySelector('i').className = 'fas fa-lock'; } } });
    function togglePip() { if (!document.pictureInPictureEnabled) { alert('دۆخی وێنە-د-وێنەیدا کارناکەت'); return; } if (document.pictureInPictureElement) { document.exitPictureInPicture(); } else { player.getIframe().requestPictureInPicture().catch(error => console.error("PiP Error:", error)); } }
    function toggleMute() { if (!player || !masterControlsMap.volume) return; if (player.isMuted()) player.unMute(); else player.mute(); masterControlsMap.volume.querySelector('#volume-slider').value = player.isMuted() ? 0 : player.getVolume(); updateVolumeIcon(); }
    function populateQualityMenu(p) { if (!masterControlsMap.quality) return; const q = p.getAvailableQualityLevels(); if(!q || q.length === 0) { masterControlsMap.quality.style.display = 'none'; return; } masterControlsMap.quality.style.display = 'flex'; const c = p.getPlaybackQuality(); qualityMenu.innerHTML = ''; const l = { 'highres': '4K+', 'hd2160': '2160p', 'hd1440': '1440p', 'hd1080': '1080p', 'hd720': '720p', 'large': '480p', 'medium': '360p', 'small': '240p', 'tiny': '144p', 'auto': 'خۆکار' }; [...new Set(['auto',...q])].forEach(v => { const i = document.createElement('div'); i.className = 'quality-item'; i.textContent = l[v] || v; if (v === c) i.classList.add('active'); i.addEventListener('click', e => { e.stopPropagation(); p.setPlaybackQuality(v); qualityMenu.classList.remove('visible'); }); qualityMenu.appendChild(i); }); }
    function populateCCMenu(p) { if (!masterControlsMap.cc) return; p.loadModule('captions'); setTimeout(() => { try { const o = p.getOptions('captions'); const ccBtn = masterControlsMap.cc.querySelector('button'); if (!o || !o.tracklist || o.tracklist.length === 0) { masterControlsMap.cc.style.display = 'none'; return; } masterControlsMap.cc.style.display = 'flex'; const t = o.tracklist, c = o.track || {}; ccMenu.innerHTML = ''; const off = document.createElement('div'); off.className = 'quality-item'; off.textContent = 'نەکاراکە'; if (Object.keys(c).length === 0) off.classList.add('active'); off.addEventListener('click', e => { e.stopPropagation(); p.setOption('captions', 'track', {}); ccMenu.classList.remove('visible'); ccBtn.classList.remove('active'); }); ccMenu.appendChild(off); t.forEach(tr => { const i = document.createElement('div'); i.className = 'quality-item'; i.textContent = tr.displayName; if (c.languageCode === tr.languageCode) { i.classList.add('active'); ccBtn.classList.add('active'); } i.addEventListener('click', e => { e.stopPropagation(); p.setOption('captions', 'track', { 'languageCode': tr.languageCode }); ccMenu.classList.remove('visible'); setTimeout(() => populateCCMenu(p), 200); }); ccMenu.appendChild(i); }); } catch(e){ masterControlsMap.cc.style.display = 'none'; } }, 1500); }
    function populateSpeedMenu(p) { if (!masterControlsMap.speed) return; const r = p.getAvailablePlaybackRates(); if(!r || r.length <= 1) { masterControlsMap.speed.style.display = 'none'; return; } masterControlsMap.speed.style.display = 'flex'; const c = p.getPlaybackRate(); speedMenu.innerHTML = ''; r.forEach(rate => { const i = document.createElement('div'); i.className = 'quality-item'; i.textContent = rate === 1 ? 'ئاسایی' : `${rate}x`; if (rate === c) i.classList.add('active'); i.addEventListener('click', e => { e.stopPropagation(); p.setPlaybackRate(rate); speedMenu.classList.remove('visible'); }); speedMenu.appendChild(i); }); }
    closePlayerBtn.addEventListener('click', (e) => { e.stopPropagation(); const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement; if (isFullscreen) { if (document.exitFullscreen) { document.exitFullscreen(); } else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); } else if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); } else if (document.msExitFullscreen) { document.msExitFullscreen(); } } else { closePlayer(); } });
    Object.values(masterControlsMap).forEach(wrapper => { const btn = wrapper.querySelector('button'); const slider = wrapper.querySelector('input[type="range"]'); if (btn) { btn.addEventListener('click', (e) => { e.stopPropagation(); switch(wrapper.dataset.controlId) { case 'play-pause': togglePlayPause(); break; case 'skip-forward': if(player) player.seekTo(player.getCurrentTime() + 10, true); break; case 'skip-backward': if(player) player.seekTo(player.getCurrentTime() - 10, true); break; case 'fullscreen': toggleFullscreen(); break; case 'pip': togglePip(); break; case 'volume': toggleMute(); break; case 'quality': case 'cc': case 'speed': const currentMenu = wrapper.querySelector('.quality-menu'); const wasVisible = currentMenu.classList.contains('visible'); [qualityMenu, ccMenu, speedMenu].forEach(menu => menu && menu.classList.remove('visible')); if (!wasVisible) currentMenu.classList.add('visible'); break; } }); } if (slider) { slider.addEventListener('input', (e) => { e.stopPropagation(); if(player) { player.setVolume(e.target.value); if(player.isMuted()) player.unMute(); updateVolumeIcon(); } }); } });
    document.addEventListener('click', () => [qualityMenu, ccMenu, speedMenu].forEach(menu => menu && menu.classList.remove('visible')));
    lockScreenBtn.addEventListener('click', (e) => { e.stopPropagation(); const isLocked = playerContainer.classList.toggle('locked'); lockScreenBtn.querySelector('i').className = isLocked ? 'fas fa-unlock' : 'fas fa-lock'; if (isLocked) { playerContainer.classList.remove('controls-visible'); } else { showControlsTemporarily(); } });
    playerContainer.addEventListener('mousemove', showControlsTemporarily);
    let isSeeking = false;
    const seekOnProgressBar = (e) => { e.stopPropagation(); if (!player || player.getDuration() === 0) return; const rect = progressBarContainer.getBoundingClientRect(); const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX; const newTimeFraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)); player.seekTo(newTimeFraction * player.getDuration(), true); updateProgressBar(); };
    const handleSeekMove = (e) => { if(isSeeking) seekOnProgressBar(e); };
    const stopSeeking = () => { isSeeking = false; document.removeEventListener('mousemove', handleSeekMove); document.removeEventListener('mouseup', stopSeeking); document.removeEventListener('touchmove', handleSeekMove); document.removeEventListener('touchend', stopSeeking); };
    progressBarContainer.addEventListener('mousedown', (e) => { isSeeking = true; seekOnProgressBar(e); document.addEventListener('mousemove', handleSeekMove); document.addEventListener('mouseup', stopSeeking); });
    progressBarContainer.addEventListener('touchstart', (e) => { isSeeking = true; seekOnProgressBar(e); document.addEventListener('touchmove', handleSeekMove); document.addEventListener('touchend', stopSeeking); });
    function showGestureFeedback(iconClass, value) { gestureFeedback.querySelector('i').className = `fas ${iconClass}`; gestureFeedback.querySelector('span').textContent = value; gestureFeedback.classList.add('visible'); clearTimeout(feedbackTimeout); }
    function hideGestureFeedback() { feedbackTimeout = setTimeout(() => gestureFeedback.classList.remove('visible'), 500); }
    gestureOverlay.addEventListener('touchstart', (e) => { if (e.touches.length === 1) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; isDragging = false; gestureAction = null; setTimeout(() => { isDragging = true; }, 100); } }, { passive: true });
    gestureOverlay.addEventListener('touchmove', (e) => { if (!isDragging || e.touches.length !== 1 || !player || playerContainer.classList.contains('locked')) return; const touchCurrentX = e.touches[0].clientX; const touchCurrentY = e.touches[0].clientY; const deltaY = touchStartY - touchCurrentY; const deltaX = touchStartX - touchCurrentX; if (!gestureAction && (Math.abs(deltaY) > 10 || Math.abs(deltaX) > 10)) { gestureAction = Math.abs(deltaY) > Math.abs(deltaX) ? (touchCurrentX < window.innerWidth / 2 ? 'brightness' : 'volume') : 'seek'; } if (gestureAction === 'volume' || gestureAction === 'brightness') { e.preventDefault(); if (gestureAction === 'volume') { let newVolume = Math.round(player.getVolume() + (deltaY / 5)); newVolume = Math.max(0, Math.min(100, newVolume)); player.setVolume(newVolume); if(player.isMuted()) player.unMute(); if (masterControlsMap.volume) masterControlsMap.volume.querySelector('#volume-slider').value = newVolume; updateVolumeIcon(); showGestureFeedback('fa-volume-high', `${newVolume}%`); } else { let newOpacity = parseFloat(brightnessOverlay.style.opacity || 0) - (deltaY / 200); newOpacity = Math.max(0, Math.min(0.8, newOpacity)); brightnessOverlay.style.opacity = newOpacity; const brightnessPercent = Math.round((1 - newOpacity / 0.8) * 100); showGestureFeedback('fa-sun', `${brightnessPercent}%`); } touchStartY = touchCurrentY; } }, { passive: false });
    gestureOverlay.addEventListener('touchend', () => { if (isDragging) { setTimeout(() => { isDragging = false }, 100); hideGestureFeedback(); } });
    gestureOverlay.addEventListener('touchend', function(event) { let currentTime = new Date().getTime(); let tapLength = currentTime - lastTap; clearTimeout(singleTapTimeout); if (playerContainer.classList.contains('locked')) { playerContainer.classList.add('controls-visible'); setTimeout(() => playerContainer.classList.remove('controls-visible'), 1000); return; } if (tapLength < 300 && tapLength > 0) { event.preventDefault(); if (!player) return; const rect = gestureOverlay.getBoundingClientRect(); if (event.changedTouches[0].clientX < rect.left + rect.width / 3) { player.seekTo(player.getCurrentTime() - 10, true); showGestureFeedback('fa-backward', '-10s'); } else if (event.changedTouches[0].clientX > rect.left + rect.width * 2 / 3) { player.seekTo(player.getCurrentTime() + 10, true); showGestureFeedback('fa-forward', '+10s'); } else { togglePlayPause(); } hideGestureFeedback(); } else { singleTapTimeout = setTimeout(function() { if (playerContainer.classList.contains('controls-visible')) { playerContainer.classList.remove('controls-visible'); clearTimeout(controlsTimeout); } else { showControlsTemporarily(); } }, 250); } lastTap = currentTime; });
    const playerSettingsModal = document.getElementById('player-settings-modal');
    const iconSizeSlider = document.getElementById('icon-size-slider'); const iconSizeValue = document.getElementById('icon-size-value'); const iconSpacingSlider = document.getElementById('icon-spacing-slider'); const iconSpacingValue = document.getElementById('icon-spacing-value'); const controlsPosRadios = document.querySelectorAll('input[name="controls-position"]'); const hideCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]'); let dynamicStyles = document.createElement('style'); document.head.appendChild(dynamicStyles);
    const cardTitleBgColor = document.getElementById('card-title-bg-color'); const cardTitleBgText = document.getElementById('card-title-bg-text'); const cardTitleBgOpacitySlider = document.getElementById('card-title-bg-opacity-slider'); const cardTitleBgOpacityValue = document.getElementById('card-title-bg-opacity-value'); const cardTitleTextColor = document.getElementById('card-title-text-color'); const cardTitleTextText = document.getElementById('card-title-text-text'); const cardTitleAlignRadios = document.querySelectorAll('input[name="card-title-align"]'); const fontSelector = document.getElementById('font-selector'); const cardWidthSlider = document.getElementById('card-width-slider'); const cardWidthValue = document.getElementById('card-width-value'); const cardTitlePaddingSlider = document.getElementById('card-title-padding-slider'); const cardTitlePaddingValue = document.getElementById('card-title-padding-value');
    function hexToRgb(hex) { let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null; }
    function rgbToHex(r, g, b) { return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase(); }
    function applyPlayerSettings() {
        const settings = globalPlayerSettings;
        let css = `.player-controls .control-btn { font-size: ${settings.iconSize}rem !important; } .player-controls .play-pause-main { font-size: ${settings.iconSize * 1.2}rem !important; } .player-controls .controls-left, .player-controls .controls-center, .player-controls .controls-right { gap: ${settings.iconSpacing}px !important; }`;
        if(settings.hiddenControls){ Object.keys(settings.hiddenControls).forEach(selector => { if (settings.hiddenControls[selector]) { css += `.player-controls ${selector} { display: none !important; }`; } else { css += `.player-controls ${selector} { display: flex !important; }`; } }); }
        dynamicStyles.innerHTML = css;
        playerContainer.classList.toggle('controls-inside', settings.position === 'inside');
        document.documentElement.style.setProperty('--main-font-family', settings.mainFont);
        document.documentElement.style.setProperty('--card-min-width', `${settings.cardWidth}px`);
        document.documentElement.style.setProperty('--card-title-padding', `${settings.cardTitlePadding}px`);
        document.documentElement.style.setProperty('--card-title-bg', settings.cardTitleBg);
        document.documentElement.style.setProperty('--card-title-color', settings.cardTitleTextColor);
    }
    function getCurrentSettingsFromUI() {
        const hiddenControls = {};
        hideCheckboxes.forEach(cb => { hiddenControls[cb.dataset.control] = cb.checked; });
        const rgb = hexToRgb(cardTitleBgColor.value);
        const opacity = cardTitleBgOpacitySlider.value;
        const bgColorRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        return { iconSize: parseFloat(iconSizeSlider.value), iconSpacing: parseInt(iconSpacingSlider.value), position: document.querySelector('input[name="controls-position"]:checked')?.value || 'outside', hiddenControls: hiddenControls, cardTitleBg: bgColorRgba, cardTitleTextColor: cardTitleTextColor.value, mainFont: fontSelector.value, cardWidth: parseInt(cardWidthSlider.value), cardTitlePadding: parseInt(cardTitlePaddingSlider.value), };
    }
    function saveLocalSettings() { const uiSettings = getCurrentSettingsFromUI(); globalPlayerSettings = { ...globalPlayerSettings, ...uiSettings }; localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(globalPlayerSettings)); applyPlayerSettings(); }
    async function saveGlobalDefaults() { 
        const isAdmin = document.body.classList.contains('admin-mode');
        if (!isAdmin) return; 
        const currentSettings = { ...globalPlayerSettings, ...getCurrentSettingsFromUI() }; 
        try { 
            await settingsDocRef.set(currentSettings, { merge: true }); 
            alert("ڕێکخستنە بنەڕەتیەکان بۆ هەمی بەکارهێنەران هاتنە پاشکەفتن."); 
        } catch (error) { 
            console.error("Error saving global defaults:", error); 
            alert("کێشە د پاشکەفتنا ڕێکخستنێن بنەڕەتی دا چێبوو!"); 
        } 
    }
    function updateUIFromSettings(settings) {
        if(iconSizeSlider) { iconSizeSlider.value = settings.iconSize; iconSizeValue.textContent = settings.iconSize; }
        if(iconSpacingSlider) { iconSpacingSlider.value = settings.iconSpacing; iconSpacingValue.textContent = settings.iconSpacing; }
        const posRadio = document.querySelector(`input[name="controls-position"][value="${settings.position}"]`);
        if(posRadio) posRadio.checked = true;
        hideCheckboxes.forEach(cb => { cb.checked = settings.hiddenControls?.[cb.dataset.control] || false; });
        if(settings.cardTitleBg) {
            const bgMatch = settings.cardTitleBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (bgMatch) { const [, r, g, b, a = 1] = bgMatch; if(cardTitleBgColor) cardTitleBgColor.value = rgbToHex(parseInt(r), parseInt(g), parseInt(b)); if(cardTitleBgOpacitySlider) cardTitleBgOpacitySlider.value = a; if(cardTitleBgText) cardTitleBgText.value = settings.cardTitleBg; if(cardTitleBgOpacityValue) cardTitleBgOpacityValue.textContent = Math.round(a * 100); }
        }
        if(cardTitleTextColor) { cardTitleTextColor.value = settings.cardTitleTextColor; cardTitleTextText.value = settings.cardTitleTextColor; }
        if(fontSelector) fontSelector.value = settings.mainFont;
        if(cardWidthSlider) { cardWidthSlider.value = settings.cardWidth; cardWidthValue.textContent = settings.cardWidth; }
        if(cardTitlePaddingSlider) { cardTitlePaddingSlider.value = settings.cardTitlePadding; cardTitlePaddingValue.textContent = settings.cardTitlePadding; }
    }
    async function loadAndApplySettings() {
        const defaults = { iconSize: 1.2, iconSpacing: 10, position: 'inside', hiddenControls: {}, cardTitleBg: 'rgba(30, 30, 30, 1)', cardTitleTextColor: '#FFFFFF', mainFont: "'Noto Kufi Arabic', sans-serif", cardWidth: 300, cardTitlePadding: 15, controlsLayout: { left: ['volume'], center: ['skip-forward', 'play-pause', 'skip-backward'], right: ['quality', 'cc', 'pip', 'speed', 'fullscreen'] } };
        let finalSettings;
        const localSettingsJSON = localStorage.getItem(LOCAL_SETTINGS_KEY);
        if (localSettingsJSON) { finalSettings = { ...defaults, ...JSON.parse(localSettingsJSON) }; } else { try { const doc = await settingsDocRef.get(); const firestoreDefaults = doc.exists() ? doc.data() : {}; finalSettings = { ...defaults, ...firestoreDefaults }; } catch (e) { console.error("Error loading settings from Firestore, using defaults.", e); finalSettings = defaults; } }
        globalPlayerSettings = finalSettings;
        updateUIFromSettings(finalSettings);
        applyPlayerSettings();
    }
    const editLayoutBtn = document.getElementById('edit-layout-btn');
    const saveLayoutBtn = document.getElementById('save-layout-btn');
    const cancelLayoutBtn = document.getElementById('cancel-layout-btn');
    const layoutEditControls = document.getElementById('layout-edit-controls');
    const layoutPreviewContainer = document.getElementById('layout-editor-preview');
    const mainCloseSettingsBtn = document.getElementById('main-close-settings-btn');
    let layoutSortableInstances = [];
    function enableLayoutEditing() { layoutPreviewContainer.innerHTML = ''; const previewControls = document.querySelector('.player-controls .controls-main').cloneNode(true); previewControls.querySelector('.controls-left').innerHTML = ''; previewControls.querySelector('.controls-center').innerHTML = ''; previewControls.querySelector('.controls-right').innerHTML = ''; const layout = globalPlayerSettings.controlsLayout || { left: ['volume'], center: ['skip-forward', 'play-pause', 'skip-backward'], right: ['speed', 'cc', 'quality', 'pip', 'fullscreen'] }; const allClonedIcons = {}; Object.keys(masterControlsMap).forEach(id => { allClonedIcons[id] = masterControlsMap[id].cloneNode(true); }); const previewLeft = previewControls.querySelector('.controls-left'); layout.left.forEach(id => { if (allClonedIcons[id]) previewLeft.appendChild(allClonedIcons[id]); }); const previewCenter = previewControls.querySelector('.controls-center'); layout.center.forEach(id => { if (allClonedIcons[id]) previewCenter.appendChild(allClonedIcons[id]); }); const previewRight = previewControls.querySelector('.controls-right'); layout.right.forEach(id => { if (allClonedIcons[id]) previewRight.appendChild(allClonedIcons[id]); }); layoutPreviewContainer.appendChild(previewControls); layoutSortableInstances = []; layoutPreviewContainer.querySelectorAll('.controls-left, .controls-center, .controls-right').forEach(container => { layoutSortableInstances.push(new Sortable(container, { group: 'player-controls-editor', animation: 150, ghostClass: 'sortable-ghost' })); }); layoutEditControls.style.display = 'block'; editLayoutBtn.style.display = 'none'; }
    function disableLayoutEditing() { layoutSortableInstances.forEach(instance => instance.destroy()); layoutSortableInstances = []; layoutPreviewContainer.innerHTML = ''; layoutEditControls.style.display = 'none'; editLayoutBtn.style.display = 'block'; }
    async function saveLayout() { const layout = { left: Array.from(layoutSortableInstances[0].el.children).map(item => item.dataset.controlId), center: Array.from(layoutSortableInstances[1].el.children).map(item => item.dataset.controlId), right: Array.from(layoutSortableInstances[2].el.children).map(item => item.dataset.controlId) }; globalPlayerSettings.controlsLayout = layout; saveLocalSettings(); applySavedLayout(); disableLayoutEditing(); }
    function applySavedLayout() { try { const rootElement = document.querySelector('#video-player-modal'); const savedLayout = globalPlayerSettings.controlsLayout || { left: ['volume'], center: ['skip-forward', 'play-pause', 'skip-backward'], right: ['speed', 'cc', 'quality', 'pip', 'fullscreen'] }; const controlsLeft = rootElement.querySelector('.controls-left'); const controlsCenter = rootElement.querySelector('.controls-center'); const controlsRight = rootElement.querySelector('.controls-right'); controlsLeft.innerHTML = ''; controlsCenter.innerHTML = ''; controlsRight.innerHTML = ''; savedLayout.left.forEach(id => { if (masterControlsMap[id]) controlsLeft.appendChild(masterControlsMap[id]); }); savedLayout.center.forEach(id => { if (masterControlsMap[id]) controlsCenter.appendChild(masterControlsMap[id]); }); savedLayout.right.forEach(id => { if (masterControlsMap[id]) controlsRight.appendChild(masterControlsMap[id]); }); } catch (e) { console.error("Failed to apply saved layout:", e); } }
    if(playerSettingsBtn) playerSettingsBtn.addEventListener('click', () => playerSettingsModal.style.display = 'flex');
    if(mainCloseSettingsBtn) mainCloseSettingsBtn.addEventListener('click', () => { disableLayoutEditing(); playerSettingsModal.style.display = 'none'; });
    if(iconSizeSlider) iconSizeSlider.addEventListener('input', e => { iconSizeValue.textContent = e.target.value; saveLocalSettings(); });
    if(iconSpacingSlider) iconSpacingSlider.addEventListener('input', e => { iconSpacingValue.textContent = e.target.value; saveLocalSettings(); });
    controlsPosRadios.forEach(radio => radio.addEventListener('change', saveLocalSettings));
    hideCheckboxes.forEach(cb => cb.addEventListener('change', saveLocalSettings));
    if(fontSelector) fontSelector.addEventListener('change', saveLocalSettings);
    if(cardWidthSlider) cardWidthSlider.addEventListener('input', e => { cardWidthValue.textContent = e.target.value; saveLocalSettings(); });
    if(cardTitlePaddingSlider) cardTitlePaddingSlider.addEventListener('input', e => { cardTitlePaddingValue.textContent = e.target.value; saveLocalSettings(); });
    if(editLayoutBtn) editLayoutBtn.addEventListener('click', enableLayoutEditing);
    if(saveLayoutBtn) saveLayoutBtn.addEventListener('click', saveLayout);
    if(cancelLayoutBtn) cancelLayoutBtn.addEventListener('click', disableLayoutEditing);
    if(saveDefaultsBtn) saveDefaultsBtn.addEventListener('click', saveGlobalDefaults);
    function syncBgColorFromPicker() { const rgb = hexToRgb(cardTitleBgColor.value); if (!rgb) return; const opacity = cardTitleBgOpacitySlider.value; cardTitleBgText.value = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`; cardTitleBgOpacityValue.textContent = Math.round(opacity * 100); saveLocalSettings(); }
    function syncBgColorFromText() { const tempDiv = document.createElement('div'); tempDiv.style.color = cardTitleBgText.value; if(tempDiv.style.color !== '') { const computedColor = window.getComputedStyle(tempDiv).color; const match = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/); if (match) { const [, r, g, b, a = 1] = match; cardTitleBgColor.value = rgbToHex(parseInt(r), parseInt(g), parseInt(b)); cardTitleBgOpacitySlider.value = a; cardTitleBgOpacityValue.textContent = Math.round(a * 100); saveLocalSettings(); } } }
    function syncTextColorFromPicker() { cardTitleTextText.value = cardTitleTextColor.value; saveLocalSettings(); }
    function syncTextColorFromText() { const tempDiv = document.createElement('div'); tempDiv.style.color = cardTitleTextText.value; if(tempDiv.style.color !== '') { const computedColor = window.getComputedStyle(tempDiv).color; const match = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/); if(match) { cardTitleTextColor.value = rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3])); saveLocalSettings(); } } }
    if(cardTitleBgColor) cardTitleBgColor.addEventListener('input', syncBgColorFromPicker);
    if(cardTitleBgOpacitySlider) cardTitleBgOpacitySlider.addEventListener('input', syncBgColorFromPicker);
    if(cardTitleBgText) cardTitleBgText.addEventListener('input', syncBgColorFromText);
    if(cardTitleTextColor) cardTitleTextColor.addEventListener('input', syncTextColorFromPicker);
    if(cardTitleTextText) cardTitleTextText.addEventListener('input', syncTextColorFromText);

    initializePage();
});
