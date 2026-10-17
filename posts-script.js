// --- START OF FILE: posts-script.js (SERERASTKIRÎ) ---
document.addEventListener('DOMContentLoaded', function() {
    const db = firebase.firestore();
    const storage = firebase.storage();
    const auth = firebase.auth();
    const postsCollection = db.collection('posts');

    const postsContainer = document.getElementById('posts-container');
    const addPostBtn = document.getElementById('add-post-btn');
    const postModal = document.getElementById('post-modal');
    const postForm = document.getElementById('post-form');
    const modalTitle = document.getElementById('modal-title');
    const closeModalBtn = postModal.querySelector('.btn-cancel');
    const imagePreview = document.getElementById('image-preview');
    const imageUploadInput = document.getElementById('post-image-upload');
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const loginCancelBtn = document.getElementById('login-cancel-btn');
    const adminLoginTrigger = document.getElementById('admin-login-trigger');

    const imageViewerModal = document.getElementById('image-viewer-modal');
    const fullImage = document.getElementById('full-image');
    const closeImageViewer = document.querySelector('.close-viewer');

    let localPostsCache = [];
    let currentEditId = null;

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
        renderPosts(localPostsCache);
    });

    function loadAndRenderPosts() {
        postsContainer.innerHTML = '<p class="loading-text">پوست دهێنە بارکرن...</p>';
        postsCollection.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            localPostsCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderPosts(localPostsCache);
        }, error => {
            console.error("Kêşe di barkirina postan da: ", error);
            postsContainer.innerHTML = '<p style="color:red;">کێشەیەک د بارکرنا داتایان دا چێبوو</p>';
        });
    }

    function renderPosts(posts) {
        const isAdmin = document.body.classList.contains('admin-mode');
        if (posts.length === 0) {
            postsContainer.innerHTML = '<p class="loading-text">هێشتا چ پوست نەهاتینە بەلاڤکرن.</p>';
            return;
        }
        
        postsContainer.innerHTML = '';

        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post-card';
            postElement.dataset.id = post.id;
            
            const postDate = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString('ku-IQ') : '';
            
            let adminControls = '';
            if (isAdmin) {
                adminControls = `
                    <div class="admin-post-controls">
                        <button class="edit-btn" title="گوهۆڕین"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" title="ژێبرن"><i class="fas fa-trash"></i></button>
                    </div>`;
            }

            let imageHTML = '';
            if (post.imageUrl) {
                imageHTML = `<img src="${post.imageUrl}" alt="${post.title || 'وێنێ پوستی'}" class="post-image" data-link="${post.link || ''}">`;
            }

            postElement.innerHTML = `
                ${adminControls}
                <h3>${post.title || ''}</h3>
                <p class="post-description">${post.description || ''}</p>
                ${imageHTML}
                <div class="post-footer">
                    <span>${postDate}</span>
                </div>`;
            
            postsContainer.appendChild(postElement);
        });
    }

    function openPostModal(post = null) {
        postForm.reset();
        imagePreview.style.display = 'none';
        imagePreview.src = '#';

        if (post) {
            modalTitle.textContent = 'گوهۆرینا پوستی';
            document.getElementById('post-id').value = post.id;
            document.getElementById('post-title').value = post.title || '';
            document.getElementById('post-description').value = post.description || '';
            document.getElementById('post-link').value = post.link || '';
            if (post.imageUrl) {
                imagePreview.src = post.imageUrl;
                imagePreview.style.display = 'block';
            }
            currentEditId = post.id;
        } else {
            modalTitle.textContent = 'پوستەکێ نوو زێدەبکە';
            document.getElementById('post-id').value = '';
            currentEditId = null;
        }
        postModal.style.display = 'flex';
    }

    function closePostModal() {
        postModal.style.display = 'none';
    }

    addPostBtn.addEventListener('click', () => openPostModal());
    closeModalBtn.addEventListener('click', closePostModal);
    postModal.addEventListener('click', (e) => {
        if (e.target === postModal) closePostModal();
    });

    imageUploadInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            }
            reader.readAsDataURL(this.files[0]);
        }
    });

    postForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitButton = this.querySelector('.btn-save');
        submitButton.disabled = true;
        submitButton.textContent = 'پاشکەفت دبت...';

        const postId = document.getElementById('post-id').value;
        const imageFile = imageUploadInput.files[0];
        let imageUrl = imagePreview.src.startsWith('http') ? imagePreview.src : null;

        try {
            if (imageFile) {
                const storageRef = storage.ref(`posts/${Date.now()}_${imageFile.name}`);
                const snapshot = await storageRef.put(imageFile);
                imageUrl = await snapshot.ref.getDownloadURL();
            }

            const postData = {
                title: document.getElementById('post-title').value.trim(),
                description: document.getElementById('post-description').value.trim(),
                link: document.getElementById('post-link').value.trim(),
                imageUrl: imageUrl,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (postId) {
                await postsCollection.doc(postId).update(postData);
            } else {
                postData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await postsCollection.add(postData);
            }
            
            closePostModal();

        } catch (error) {
            console.error("Kêşe di tomarkirina postî da: ", error);
            document.getElementById('post-error').textContent = 'Kêşeyek çêbû. تکایە دوبارە هەول بدە.';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'بەلاڤ بکە';
        }
    });

    postsContainer.addEventListener('click', async (e) => {
        const postCard = e.target.closest('.post-card');
        if (!postCard) return;
        const postId = postCard.dataset.id;
        const post = localPostsCache.find(p => p.id === postId);

        if (e.target.closest('.edit-btn')) {
            openPostModal(post);
        }
        else if (e.target.closest('.delete-btn')) {
            if (confirm(`تو پشتراستی دڤێی پوستا "${post.title}" ژێببەی؟`)) {
                try {
                    await postsCollection.doc(postId).delete();
                    if (post.imageUrl) {
                        try {
                           const imageRef = storage.refFromURL(post.imageUrl);
                           await imageRef.delete();
                        } catch (storageError) {
                            console.error("Wêne ji storage nehate jêbirin:", storageError);
                        }
                    }
                } catch (error) {
                    alert("Kêşeyek di jêbirinê da çêbû.");
                }
            }
        }
        else if (e.target.classList.contains('post-image')) {
            const link = e.target.dataset.link;
            if (link) {
                window.open(link, '_blank');
            } else {
                fullImage.src = e.target.src;
                imageViewerModal.style.display = 'flex';
            }
        }
    });

    closeImageViewer.addEventListener('click', () => imageViewerModal.style.display = 'none');
    imageViewerModal.addEventListener('click', (e) => {
        if (e.target === imageViewerModal) imageViewerModal.style.display = 'none';
    });

    adminLoginTrigger.addEventListener('dblclick', () => {
        if (!auth.currentUser) {
            loginModal.style.display = 'flex';
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('#email').value;
        const password = loginForm.querySelector('#password').value;
        auth.signInWithEmailAndPassword(email, password)
            .then(() => { loginModal.style.display = 'none'; loginForm.reset(); })
            .catch(() => { loginForm.querySelector('#login-error').textContent = 'ئیمەیل یان تێپەڕەوشە خەلەتە.'; });
    });
    
    loginCancelBtn.addEventListener('click', () => loginModal.style.display = 'none');

    loadAndRenderPosts();
});
