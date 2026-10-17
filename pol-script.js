// --- START OF FILE: pol-script.js (GUHERTÎ Û TÊKÛZ) ---
document.addEventListener('DOMContentLoaded', function() {
    
    if (!firebase.apps.length) {
        console.error("Firebase nehatiye destpêkirin!");
        return;
    }
    const db = firebase.firestore();
    const auth = firebase.auth();
    const configDocRef = db.collection('pageContent').doc('polPage');

    // DOM Elements
    const elements = {
        profileName: document.getElementById('profile-name'),
        profileTitle: document.getElementById('profile-title'),
        profileUsername: document.getElementById('profile-username'),
        grade10Title: document.querySelector('.action-card.purple h3'),
        grade10Desc: document.querySelector('.action-card.purple p'),
        grade11Title: document.querySelector('.action-card.blue h3'),
        grade11Desc: document.querySelector('.action-card.blue p'),
        grade12Title: document.querySelector('.action-card.green h3'),
        grade12Desc: document.querySelector('.action-card.green p'),
        footerTitle: document.getElementById('footer-title'),
        footerDescription: document.getElementById('footer-description'),
        socialIconsContainer: document.getElementById('social-icons'),
    };
    
    // Edit Modal Elements
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const openModalBtn = document.getElementById('edit-main-btn');
    const closeModalBtn = document.getElementById('modalCloseBtn');
    
    // Login Modal Elements
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const loginCancelBtn = document.getElementById('login-cancel-btn');
    const loginError = document.getElementById('login-error');

    const adminLoginTrigger = document.getElementById('admin-login-trigger');

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
    });

    async function loadPageData() {
        try {
            const doc = await configDocRef.get();
            if (doc.exists) {
                const data = doc.data();
                if(elements.profileName) elements.profileName.textContent = data.profileName || '';
                if(elements.profileTitle) elements.profileTitle.textContent = data.profileTitle || '';
                if(elements.profileUsername) elements.profileUsername.textContent = data.profileUsername || '';
                if(elements.grade10Title) elements.grade10Title.textContent = data.grade10Title || '';
                if(elements.grade10Desc) elements.grade10Desc.textContent = data.grade10Desc || '';
                if(elements.grade11Title) elements.grade11Title.textContent = data.grade11Title || '';
                if(elements.grade11Desc) elements.grade11Desc.textContent = data.grade11Desc || '';
                if(elements.grade12Title) elements.grade12Title.textContent = data.grade12Title || '';
                if(elements.grade12Desc) elements.grade12Desc.textContent = data.grade12Desc || '';
                if(elements.footerTitle) elements.footerTitle.textContent = data.footerTitle || '';
                if(elements.footerDescription) elements.footerDescription.textContent = data.footerDesc || '';
                
                if(elements.socialIconsContainer) {
                    elements.socialIconsContainer.innerHTML = '';
                    if (data.socialLinks) {
                        if(data.socialLinks.facebook) elements.socialIconsContainer.innerHTML += `<a href="${data.socialLinks.facebook}" target="_blank" aria-label="Facebook"><i class="fab fa-facebook"></i></a>`;
                        if(data.socialLinks.instagram) elements.socialIconsContainer.innerHTML += `<a href="${data.socialLinks.instagram}" target="_blank" aria-label="Instagram"><i class="fab fa-instagram"></i></a>`;
                        if(data.socialLinks.telegram) elements.socialIconsContainer.innerHTML += `<a href="${data.socialLinks.telegram}" target="_blank" aria-label="Telegram"><i class="fab fa-telegram"></i></a>`;
                    }
                }
            } else {
                 console.log("No config found for pol.html, using default values.");
            }
        } catch (error) {
            console.error("Error getting document:", error);
        }
    }

    function openEditModal() {
        configDocRef.get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                document.getElementById('edit-profile-name').value = data.profileName || '';
                document.getElementById('edit-profile-title').value = data.profileTitle || '';
                document.getElementById('edit-profile-username').value = data.profileUsername || '';
                document.getElementById('edit-grade10-title').value = data.grade10Title || '';
                document.getElementById('edit-grade10-desc').value = data.grade10Desc || '';
                document.getElementById('edit-grade11-title').value = data.grade11Title || '';
                document.getElementById('edit-grade11-desc').value = data.grade11Desc || '';
                document.getElementById('edit-grade12-title').value = data.grade12Title || '';
                document.getElementById('edit-grade12-desc').value = data.grade12Desc || '';
                document.getElementById('edit-footer-title').value = data.footerTitle || '';
                document.getElementById('edit-footer-desc').value = data.footerDesc || '';
                document.getElementById('social-facebook').value = data.socialLinks?.facebook || '';
                document.getElementById('social-instagram').value = data.socialLinks?.instagram || '';
                document.getElementById('social-telegram').value = data.socialLinks?.telegram || '';
            }
        });
        editModal.style.display = 'flex';
    }

    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!document.body.classList.contains('admin-mode')) {
                alert('Destûr nîne!');
                return;
            }

            const saveButton = editForm.querySelector('.btn-save');
            saveButton.textContent = '...چاوەڕێ بە';
            saveButton.disabled = true;

            const updatedData = {
                profileName: document.getElementById('edit-profile-name').value,
                profileTitle: document.getElementById('edit-profile-title').value,
                profileUsername: document.getElementById('edit-profile-username').value,
                grade10Title: document.getElementById('edit-grade10-title').value,
                grade10Desc: document.getElementById('edit-grade10-desc').value,
                grade11Title: document.getElementById('edit-grade11-title').value,
                grade11Desc: document.getElementById('edit-grade11-desc').value,
                grade12Title: document.getElementById('edit-grade12-title').value,
                grade12Desc: document.getElementById('edit-grade12-desc').value,
                footerTitle: document.getElementById('edit-footer-title').value,
                footerDesc: document.getElementById('edit-footer-desc').value,
                socialLinks: {
                    facebook: document.getElementById('social-facebook').value,
                    instagram: document.getElementById('social-instagram').value,
                    telegram: document.getElementById('social-telegram').value,
                }
            };

            try {
                await configDocRef.set(updatedData, { merge: true });
                editModal.style.display = 'none';
                loadPageData();
            } catch (error) {
                console.error("Error updating document: ", error);
                alert("کێشە د پاشکەفتنا زانیاریان دا چێبوو.");
            } finally {
                saveButton.textContent = 'پاشکەفتن';
                saveButton.disabled = false;
            }
        });
    }

    if (adminLoginTrigger) {
        adminLoginTrigger.addEventListener('click', () => {
            if (!auth.currentUser && loginModal) loginModal.style.display = 'flex';
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailVal = document.getElementById('email').value;
            const passwordVal = document.getElementById('password').value;
            loginError.style.display = 'none';
            auth.signInWithEmailAndPassword(emailVal, passwordVal)
                .then(() => {
                    loginModal.style.display = 'none';
                    loginForm.reset();
                })
                .catch(() => {
                    const errorMessage = translations[localStorage.getItem('userLanguage') || 'ku_ba'].login_error_message;
                    loginError.innerText = errorMessage;
                    loginError.style.display = 'block';
                });
        });
    }
    
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => { if(document.body.classList.contains('admin-mode')) openEditModal(); });
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', () => { editModal.style.display = 'none'; });
    if (editModal) editModal.addEventListener('click', (e) => { if (e.target === editModal) editModal.style.display = 'none'; });

    if (loginCancelBtn) loginCancelBtn.addEventListener('click', () => { loginModal.style.display = 'none'; });
    if (loginModal) loginModal.addEventListener('click', (e) => { if (e.target === loginModal) loginModal.style.display = 'none'; });

    loadPageData();
});
// --- END OF FILE: pol-script.js ---
