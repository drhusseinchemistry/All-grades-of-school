// --- START OF FILE: script.js (GUHERTÎ) ---
document.addEventListener('DOMContentLoaded', function() {
    if (!firebase || !firebase.apps.length) {
        console.error("Firebase nehatiye destpêkirin! Piştrast be ku `firebase-config.js` hatiye barkirin.");
        return;
    }
    const db = firebase.firestore();
    const auth = firebase.auth();

    const grade = document.body.dataset.grade;
    if (!grade) {
        console.error("پول نەهاتیە دیارکرن!");
        return;
    }
    const collectionName = `pola${grade}_cards`;
    const cardsCollection = db.collection(collectionName); 

    const linksContainer = document.getElementById('links-container');
    const modal = document.getElementById('add-modal');
    const closeModalBtn = document.getElementById('modalCloseBtn');
    const addForm = document.getElementById('add-form');
    
    let sortableInstance = null;
    let localCardsCache = [];

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
        
        renderCards(localCardsCache);
        
        if (isAdmin) {
            if (!sortableInstance) initSortable();
        } else {
            if (sortableInstance) {
                sortableInstance.destroy();
                sortableInstance = null;
            }
        }
    });

    function loadAndRenderCards() {
        linksContainer.innerHTML = '<p style="color:var(--primary-text);">...بارکرن</p>';
        cardsCollection.orderBy('order').onSnapshot(snapshot => {
            localCardsCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderCards(localCardsCache);
        }, error => {
            console.error(`Kêşe di barkirina kartan ji ${collectionName} da: `, error);
            linksContainer.innerHTML = '<p style="color:red;">کێشەیەک د بارکرنا داتایان دا چێبوو</p>';
        });
    }

    function renderCards(cards) {
        const isAdmin = document.body.classList.contains('admin-mode');
        linksContainer.innerHTML = '';

        if (cards.length === 0 && !isAdmin) {
             linksContainer.innerHTML = '<p style="color:var(--secondary-text);">هێشتا هیچ بەشێک بۆ ئەم پۆلە نییە.</p>';
        }

        cards.forEach(card => {
            const cardElement = document.createElement('a');
            cardElement.href = card.href || `quiz-chapters.html?pola=${grade}&unit=${card.id}`;
            cardElement.classList.add('action-card', card.color);
            cardElement.dataset.id = card.id;

            cardElement.innerHTML = `
                <i class="fas fa-trash delete-icon"></i>
                <i class="fas ${card.icon || 'fa-question-circle'}"></i>
                <h3>${card.title}</h3>
                <p>${card.description}</p>
            `;
            linksContainer.appendChild(cardElement);
        });
        
        if (isAdmin) {
            const addButtonElement = document.createElement('div');
            addButtonElement.className = "action-card add-item-card";
            addButtonElement.id = "addNewCardBtn";
            addButtonElement.innerHTML = `<i class="fas fa-plus"></i><h3>بەشەکێ نوو یێ پسیاران زێدەبکە</h3>`;
            linksContainer.appendChild(addButtonElement);

            addButtonElement.addEventListener('click', () => {
                addForm.reset();
                modal.style.display = 'flex';
            });
            initSortable();
        }
    }
    
    function initSortable() {
        if (sortableInstance) sortableInstance.destroy();
        
        sortableInstance = new Sortable(linksContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            filter: '.add-item-card',
            onEnd: async function(evt) {
                const updatedOrder = Array.from(linksContainer.querySelectorAll('.action-card:not(.add-item-card)'))
                                        .map(el => el.dataset.id);
                const batch = db.batch();
                updatedOrder.forEach((docId, index) => {
                    const docRef = cardsCollection.doc(docId);
                    batch.update(docRef, { order: index });
                });
                
                try {
                    await batch.commit();
                } catch (error) {
                    alert("کێشەیەک د پاشکەفتنا ڕیزبەندیێ دا چێبوو");
                    loadAndRenderCards(); 
                }
            },
        });
    }

    closeModalBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    addForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if(!document.body.classList.contains('admin-mode')) return;
        
        const newCardData = {
            title: document.getElementById('card-title').value,
            description: document.getElementById('card-desc').value,
            color: document.getElementById('card-color').value,
            icon: 'fa-question-circle',
            order: localCardsCache.length
        };

        try {
            const newDocRef = await cardsCollection.add(newCardData);
            const newHref = `quiz-chapters.html?pola=${grade}&unit=${newDocRef.id}`;
            await newDocRef.update({ href: newHref });
            modal.style.display = 'none';
        } catch (error) {
            console.error("Kêşe di zێدەکرنا کارتێ da: ", error);
            alert("کێشەیەک د زێدەکرنێ دا چێبوو.");
        }
    });

    linksContainer.addEventListener('click', async function(e) {
        if (e.target.classList.contains('delete-icon')) {
            e.preventDefault(); e.stopPropagation();
            if (!document.body.classList.contains('admin-mode')) return;
            const cardElement = e.target.closest('.action-card');
            const cardId = cardElement.dataset.id;
            const card = localCardsCache.find(c => c.id === cardId);
            if (confirm(`تو پشتراستی دڤێی بەشێ "${card.title}" ژێببەی؟`)) {
                try {
                    await cardsCollection.doc(cardId).delete();
                } catch (error) {
                    alert("کێشەیەک د ژێبرنێ دا چێبوو.");
                }
            }
        }
    });

    loadAndRenderCards();
});
