// --- START OF FILE: quiz-chapters-script.js (GUHERTÎ) ---
document.addEventListener('DOMContentLoaded', function() {
    
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();
    const auth = firebase.auth();

    const urlParams = new URLSearchParams(window.location.search);
    const pola = urlParams.get('pola');
    const unitId = urlParams.get('unit');

    if (!pola || !unitId) {
        document.body.innerHTML = '<h1>کێشە: پول یان وانا نەهاتیە دیارکرن. تکایە بزڤرە و جارەکا دی هەول بدە.</h1><a href="pol.html">زڤرین بۆ لاپەڕێ سەرەکی</a>';
        return;
    }
    
    const unitDocRef = db.collection(`pola${pola}_cards`).doc(unitId);
    const chaptersCollection = unitDocRef.collection('chapters');

    const chaptersGrid = document.getElementById('chapters-grid');
    const modal = document.getElementById('add-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeModalBtn = document.getElementById('modalCloseBtn');
    const addForm = document.getElementById('add-form');
    const pageTitle = document.getElementById('page-title');
    const pageHeader = document.querySelector('.title-container');
    
    let sortableInstance = null;
    let localChaptersCache = [];
    
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
        renderChapters(localChaptersCache);
    });

    function loadUnitAndChapters() {
        chaptersGrid.innerHTML = '<p style="color:var(--primary-text); text-align:center;">بارکرن...</p>';
        
        unitDocRef.get().then(unitDoc => {
            if (unitDoc.exists) {
                pageTitle.textContent = `تاقیکرنێن: ${unitDoc.data().title}`;
            } else {
                 pageTitle.textContent = "وانە نەهاتە دیتن";
            }
            document.getElementById('back-link').href = `pola-${pola}-quiz.html`;
            document.getElementById('back-link').textContent = `زڤرین بۆ بەندێن پولا ${pola}`;
        });
        
        chaptersCollection.orderBy('order').onSnapshot(snapshot => {
            localChaptersCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderChapters(localChaptersCache);
        }, error => {
            console.error("Error loading chapters: ", error);
            chaptersGrid.innerHTML = '<h2 style="color:red; text-align:center;">کێشەیەک د بارکرنا داتایان دا چێبوو</h2>';
        });
    }

    function renderChapters(chapters) {
        const isAdmin = document.body.classList.contains('admin-mode');
        chaptersGrid.innerHTML = '';
        if (chapters.length === 0 && !isAdmin) {
             chaptersGrid.innerHTML = '<p style="color:var(--primary-text); text-align:center;">هێشتا چ تاقیکرن بۆ ڤی بەندی نەهاتینە زێدەکرن.</p>';
        }

        chapters.forEach(chapter => {
            const chapterElement = document.createElement('a');
            const dynamicLink = `quiz.html?pola=${pola}&unit=${unitId}&chapter=${chapter.id}`;
            chapterElement.href = dynamicLink;
            
            chapterElement.className = `chapter-card color-${chapter.color || 'blue'} size-${chapter.size || 'normal'}`;
            chapterElement.dataset.id = chapter.id;

            let adminControls = '';
            if (isAdmin) {
                adminControls = `
                    <div class="admin-controls">
                        <i class="fas fa-edit edit-icon"></i>
                        <i class="fas fa-trash delete-icon"></i>
                    </div>
                `;
            }
            chapterElement.innerHTML = `<span>${chapter.title}</span>${adminControls}`;
            chaptersGrid.appendChild(chapterElement);
        });

        if (isAdmin) {
            const addButtonElement = document.createElement('div');
            addButtonElement.className = "chapter-card add-item-card";
            addButtonElement.innerHTML = `<span><i class="fas fa-plus"></i> تاقیکرنەکا نوو زێدەبکە</span>`;
            addButtonElement.addEventListener('click', () => {
                addForm.reset();
                document.getElementById('chapter-id').value = '';
                modalTitle.innerText = 'زێدەکرنا تاقیکرنەکا نوو';
                modal.style.display = 'flex';
            });
            chaptersGrid.appendChild(addButtonElement);
            initSortable();
        } else {
            if (sortableInstance) {
                sortableInstance.destroy();
                sortableInstance = null;
            }
        }
    }
    
    function initSortable() {
        if (sortableInstance) sortableInstance.destroy();
        sortableInstance = new Sortable(chaptersGrid, {
            animation: 150, ghostClass: 'sortable-ghost', filter: '.add-item-card',
            onEnd: async function(evt) {
                const orderedIds = Array.from(chaptersGrid.querySelectorAll('.chapter-card:not(.add-item-card)')).map(el => el.dataset.id);
                const batch = db.batch();
                orderedIds.forEach((docId, index) => {
                    batch.update(chaptersCollection.doc(docId), { order: index });
                });
                try { await batch.commit(); } catch (error) { alert("کێشەیەک د پاشکەفتنا ڕیزبەندیێ دا چێبوو"); }
            },
        });
    }

    closeModalBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    addForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if(!document.body.classList.contains('admin-mode')) return;

        const chapterId = document.getElementById('chapter-id').value;
        const chapterData = {
            title: document.getElementById('chapter-title').value,
            color: document.getElementById('chapter-color').value,
            size: document.getElementById('chapter-size').value,
        };
        try {
            if (chapterId) {
                await chaptersCollection.doc(chapterId).update(chapterData);
            } else {
                chapterData.order = localChaptersCache.length;
                await chaptersCollection.add(chapterData);
            }
            modal.style.display = 'none';
        } catch (error) { alert("کێشەیەک د زێدەکرنێ/پاشکەفتنێ دا چێبوو."); }
    });

    chaptersGrid.addEventListener('click', async function(e) {
        if (!document.body.classList.contains('admin-mode')) return;

        const icon = e.target;
        const chapterCard = icon.closest('.chapter-card');
        if (!chapterCard) return;

        const chapterId = chapterCard.dataset.id;
        const chapter = localChaptersCache.find(c => c.id === chapterId);

        if (icon.classList.contains('edit-icon') || icon.classList.contains('delete-icon')) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (icon.classList.contains('edit-icon')) {
            document.getElementById('chapter-id').value = chapter.id;
            document.getElementById('chapter-title').value = chapter.title;
            document.getElementById('chapter-color').value = chapter.color || 'blue';
            document.getElementById('chapter-size').value = chapter.size || 'normal';
            modalTitle.innerText = 'گوهۆرینا تاقیکرنێ';
            modal.style.display = 'flex';
        }
        if (icon.classList.contains('delete-icon')) {
            if (confirm(`تو پشتراستی دڤێی تاقیکرنا "${chapter.title}" ژێببەی؟ (هەمی پسیارێن وێ دێ ژێچن!)`)) {
                try { 
                    await chaptersCollection.doc(chapterId).delete(); 
                } catch (error) { alert("کێشەیەک د ژێبرنێ دا چێبوو."); }
            }
        }
    });

    loadUnitAndChapters();
});
