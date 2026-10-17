// --- START OF FILE: app.js (KODA ÇAKKIRÎ Û TEMAM) ---
document.addEventListener('DOMContentLoaded', () => {
    // Girêdana bi hemî xizmetên Firebase
    const database = firebase.database(); // Realtime Database ji bo postên pirtûkê
    const storage = firebase.storage();
    const auth = firebase.auth();
    const db = firebase.firestore(); // Girêdana bi Firestore ji bo piştrastkirina rola admin

    // Elementên DOM
    const authStatus = document.getElementById('auth-status');
    const appContent = document.getElementById('app-content');

    const SUPER_ADMIN_EMAIL = "hussein.zebary.chemistry96@gmail.com";

    // Fonksiyona piştrastkirina rola admin ji Firestore
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

    // Çavdêriya rewşa têketina bikarhêner
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const isAdmin = await checkIsAdmin(user);
            if (isAdmin) {
                // Heke bikarhêner admin be, destûrê bide û fonksiyonan dest pê bike
                authStatus.textContent = `Bi xêr hatî, Admin (${user.email})`;
                authStatus.style.background = "#28a745";
                appContent.style.display = 'block'; // Naveroka rûpelê nîşan bide
                initializeAdminFunctions(); // Hemî fonksiyonên rûpelê dest pê bike
            } else {
                // Heke bikarhêner ne admin be, destûrê nede
                authStatus.textContent = "Destûr nîne";
                authStatus.style.background = "#dc3545";
                appContent.innerHTML = "<h1 style='text-align:center; color: red;'>Destûra te nîne vê rûpelê bibînî.</h1>";
                appContent.style.display = 'block';
            }
        } else {
            // Heke bikarhêner têketî nebe, wî bişîne rûpela loginê
            window.location.href = 'login.html';
        }
    });

    // Hemî fonksiyonên berê yên rûpelê di nav vê fonksiyonê de têne danîn
    function initializeAdminFunctions() {
        
        const findImageUrl = async (id, grade) => {
            const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const storagePath = `pola${grade}_images`;
            for (const ext of extensions) {
                try {
                    return await storage.ref(`${storagePath}/${id}.${ext}`).getDownloadURL();
                } catch (error) { /* Berdewam be */ }
            }
            return null;
        };

        const deletePrimaryImage = async (id, grade) => {
            const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const storagePath = `pola${grade}_images`;
            for (const ext of extensions) {
                try {
                    await storage.ref(`${storagePath}/${id}.${ext}`).delete();
                    console.log(`Wêneyê serekî ${id}.${ext} ji bo pola ${grade} hate jêbirin.`);
                    return;
                } catch (error) {
                    if (error.code !== 'storage/object-not-found') {
                        console.error(`Kêşe di jêbirina ${storagePath}/${id}.${ext} da:`, error);
                    }
                }
            }
        };

        const singlePostForm = document.getElementById('singlePostForm');
        const excelUploadForm = document.getElementById('excelUploadForm');
        const uploadStatus = document.getElementById('uploadStatus');
        const gradeSelector = document.getElementById('gradeSelector');

        function getDbPath(postId = '') {
            const grade = gradeSelector.value;
            return `pola${grade}_imagesData/${postId}`;
        }
        function getStoragePath(fileName = '') {
            const grade = gradeSelector.value;
            return `pola${grade}_images/${fileName}`;
        }

        singlePostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const postId = document.getElementById('postId').value;
            const postText = document.getElementById('postText').value;
            const primaryImageFile = document.getElementById('primaryImageFile').files[0];
            
            if (!postId) {
                alert("ژمارا پۆستی (ID) پێدڤی یە.");
                return;
            }
            
            const dbPath = getDbPath(postId);
            const postRef = database.ref(dbPath);
            const existingPost = await postRef.once('value');
            if (existingPost.exists()) {
                if (!confirm(`پۆست ب ID #${postId} ژ بەری نها هەیە. تو پشتراستی دخوازی وی نویکەی؟`)) {
                    return;
                }
            }

            alert("پۆست دهێتە بەلاڤکرن...");

            try {
                const updates = { nivisin: postText, id: postId };

                if (primaryImageFile) {
                    const grade = gradeSelector.value;
                    await deletePrimaryImage(postId, grade);
                    const fileExtension = primaryImageFile.name.split('.').pop();
                    const storagePath = getStoragePath(`${postId}.${fileExtension}`);
                    const primaryImageRef = storage.ref(storagePath);
                    const primarySnapshot = await primaryImageRef.put(primaryImageFile);
                    updates.imageUrl = await primarySnapshot.ref.getDownloadURL();
                }
                
                await postRef.update(updates);

                alert("پۆست ب سەرکەفتی هاتە بەلاڤکرن / نویکرن!");
                singlePostForm.reset();
            } catch(error) {
                alert(`کێشەیەک د بەلاڤکرنێ دا چێبوو: ${error.message}`);
            }
        });
        
        excelUploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const excelFile = document.getElementById('excelFile').files[0];
            if (!excelFile) return;
            const grade = gradeSelector.value;

            const reader = new FileReader();
            reader.onload = async function(event) {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                uploadStatus.textContent = `دەست ب گەڕیانا ${jsonData.length} وێنەیان بۆ پولا ${grade} بوو...`;
                
                const updates = {};
                let foundCount = 0;
                let notFoundIds = [];
                
                await Promise.all(jsonData.map(async (row) => {
                    if (row.id) {
                        const postId = row.id.toString();
                        const imageUrl = await findImageUrl(postId, grade);
                        const dbPathPrefix = `pola${grade}_imagesData`;

                        if (imageUrl) {
                            foundCount++;
                            updates[`/${dbPathPrefix}/${postId}/id`] = postId;
                            updates[`/${dbPathPrefix}/${postId}/imageUrl`] = imageUrl;
                            if (row.hasOwnProperty('nivisin')) {
                                updates[`/${dbPathPrefix}/${postId}/nivisin`] = row.nivisin || '';
                            }
                        } else {
                            notFoundIds.push(postId);
                        }
                    }
                }));
                
                if (Object.keys(updates).length === 0) {
                    uploadStatus.textContent = `چ وێنە بۆ ڤان ID-یان د فایلێ دا نەهاتنە دیتن: ${notFoundIds.join(', ')}`;
                    return;
                }
                uploadStatus.textContent = `وێنە بۆ ${foundCount} ID-یان هاتنە دیتن. داتابەیس دهێتە نویکرن...`;
                await database.ref().update(updates);
                let successMessage = `ب سەرکەفتی ${foundCount} تۆمار بۆ پولا ${grade} هاتنە نویکرن!`;
                if (notFoundIds.length > 0) successMessage += `\nوێنە بۆ ڤان ID-یان نەهاتنە دیتن: ${notFoundIds.join(', ')}`;
                uploadStatus.textContent = successMessage;
                excelUploadForm.reset();
            };
            reader.readAsArrayBuffer(excelFile);
        });

        const findPostIdInput = document.getElementById('findPostId');
        const fetchPostBtn = document.getElementById('fetchPostBtn');
        const postDetailsContainer = document.getElementById('postDetailsContainer');
        const managementStatus = document.getElementById('managementStatus');

        fetchPostBtn.addEventListener('click', async () => {
            const postId = findPostIdInput.value;
            if (!postId) {
                managementStatus.textContent = "تکایە ID-یا پۆستی بنڤیسە.";
                return;
            }
            managementStatus.textContent = `ل پۆستا #${postId} دگەڕیێ...`;
            
            try {
                const dbPath = getDbPath(postId);
                const snapshot = await database.ref(dbPath).once('value');
                const postData = snapshot.val();

                if (!postData) {
                    managementStatus.textContent = `پۆست ب ID #${postId} بۆ پولا هەلبژارتی نەهاتە دیتن.`;
                    postDetailsContainer.style.display = 'none';
                    return;
                }
                
                const imageSectionHTML = postData.imageUrl
                    ? `<img src="${postData.imageUrl}" class="img-preview" alt="Wêneyê Serekî">
                    <label for="updatePrimaryImageFile">گوهۆرینا وێنەیێ سەرەki:</label>`
                    : `<p style="color: red;">وێنە نەهاتیە بلندکرن.</p>
                    <label for="updatePrimaryImageFile">وێنەیەکێ سەرەکی بلند بکە (پێدڤی یە):</label>`;

                postDetailsContainer.innerHTML = `
                    <h3>زانیاریێن پۆستا #${postId}</h3>
                    <div class="post-details">
                        <div class="post-field">
                            <label>نڤیسینا نها:</label>
                            <textarea id="updatePostText">${postData.nivisin || ''}</textarea>
                        </div>
                        <div class="post-field">
                            <label>وێنەیێ سەرەکی:</label>
                            ${imageSectionHTML}
                            <input type="file" id="updatePrimaryImageFile" accept="image/*">
                        </div>
                    </div>
                    <div class="management-actions">
                        <button id="updatePostBtn" data-post-id="${postId}">نویکە</button>
                        <button id="deletePostBtn" data-post-id="${postId}" class="delete-btn">پۆستی ژێببە</button>
                    </div>
                `;
                postDetailsContainer.style.display = 'block';
                managementStatus.textContent = "";

                document.getElementById('updatePostBtn').addEventListener('click', handleUpdatePost);
                document.getElementById('deletePostBtn').addEventListener('click', handleDeletePost);

            } catch (error) {
                managementStatus.textContent = "کێشەیەک د دیتنا پۆستی دا چێبوو.";
                console.error(error);
            }
        });

        async function handleUpdatePost(e) {
            const postId = e.target.dataset.postId;
            const grade = gradeSelector.value;
            const newText = document.getElementById('updatePostText').value;
            const newPrimaryImageFile = document.getElementById('updatePrimaryImageFile').files[0];

            try {
                const dbPath = getDbPath(postId);
                const originalDataSnapshot = await database.ref(dbPath).once('value');
                const originalData = originalDataSnapshot.val() || {};

                if (!originalData.imageUrl && !newPrimaryImageFile) {
                    alert("بۆ نویکرنێ پێدڤی یە وێنەیەکێ سەرەکی هەلبژێری.");
                    return;
                }

                managementStatus.textContent = `پۆستا #${postId} دهێتە نویکرن...`;

                const updates = {id: postId};
                
                if (newText !== (originalData.nivisin || '')) {
                    updates.nivisin = newText;
                }
                
                if (newPrimaryImageFile) {
                    managementStatus.textContent = `وێنەیێ سەرەki یێ نوو دهێتە بلندکرن...`;
                    await deletePrimaryImage(postId, grade);
                    const fileExtension = newPrimaryImageFile.name.split('.').pop();
                    const storagePath = getStoragePath(`${postId}.${fileExtension}`);
                    const newPrimaryImageRef = storage.ref(storagePath);
                    const snapshot = await newPrimaryImageRef.put(newPrimaryImageFile);
                    updates.imageUrl = await snapshot.ref.getDownloadURL();
                }

                if (Object.keys(updates).length > 1) { 
                    await database.ref(dbPath).update(updates);
                    managementStatus.textContent = `پۆستا #${postId} ب سەرکەفتی هاتە نویکرن!`;
                } else {
                    managementStatus.textContent = "چ گوهۆرین نەهاتنە کرن.";
                }
                postDetailsContainer.style.display = 'none';
                findPostIdInput.value = '';

            } catch (error) {
                managementStatus.textContent = `Kêşe d نویکرنێ da: ${error.message}`;
                console.error(error);
            }
        }

        async function handleDeletePost(e) {
            const postId = e.target.dataset.postId;
            const grade = gradeSelector.value;

            if (!confirm(`تو پشتراستی دخوازی پۆستا #${postId} ب تمامی بۆ پولا ${grade} ژێببەی؟ ئەڤ کارە ناهێتە ڤەگەڕاندن.`)) {
                return;
            }

            managementStatus.textContent = `پۆستا #${postId} دهێتە ژێبرن...`;

            try {
                await deletePrimaryImage(postId, grade);
                const dbPath = getDbPath(postId);
                await database.ref(dbPath).remove();

                managementStatus.textContent = `پۆستا #${postId} ب سەرکەفتی هاتە ژێبرن.`;
                postDetailsContainer.style.display = 'none';
                findPostIdInput.value = '';

            } catch (error) {
                managementStatus.textContent = `Kêşe d ژێبرنێ da: ${error.message}`;
                console.error(error);
            }
        }
    }
});
