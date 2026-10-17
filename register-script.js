// --- START OF FILE: register-script.js (GUHERTÎ) ---
document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();

    const registerForm = document.getElementById('register-form');
    const registerError = document.getElementById('register-error');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const secretNumber = document.getElementById('confirmPassword').value.trim();

        if (!fullName || !phoneNumber || !email || !password || !secretNumber) {
            registerError.textContent = 'تکایە هەمی خانەیان پر بکە.';
            registerError.style.display = 'block';
            return;
        }

        const submitButton = registerForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'ل هیڤیێ بە...';
        registerError.style.display = 'none';

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            await db.collection('users').doc(user.uid).set({
                fullName: fullName,
                phoneNumber: phoneNumber,
                email: email,
                secretNumber: secretNumber,
                isSubscribed: false, 
                isAdmin: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            window.location.href = 'pending.html';

        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                registerError.textContent = 'ئەڤ ئیمەیلە بەری نها هاتیە تۆمارکرن.';
            } else if (error.code === 'auth/weak-password') {
                registerError.textContent = 'تێپەڕەوشە لاوازە، دڤێت ژ 6 پیتا پتر بیت.';
            } else {
                registerError.textContent = 'کێشەیەک د تۆمارکرنێ دا چێبوو.';
                console.error('Register Error:', error);
            }
            registerError.style.display = 'block';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'تۆمار بکە';
        }
    });

    const googleRegBtn = document.getElementById('google-register-btn');
    if (googleRegBtn) {
        googleRegBtn.addEventListener('click', async () => {
            googleRegBtn.disabled = true;
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await auth.signInWithPopup(provider);
                const user = result.user;

                if (user) {
                    if (window.isSuperAdmin && window.isSuperAdmin(user)) {
                        localStorage.setItem('is_admin_mode_active', 'true');
                    }
                    // Sync profile to Firestore users collection
                    try {
                        await db.collection('users').doc(user.uid).set({
                            fullName: user.displayName || 'بەکارهێنەری گووگڵ',
                            email: user.email,
                            phoneNumber: user.phoneNumber || '',
                            isSubscribed: true,
                            isAdmin: window.isSuperAdmin ? window.isSuperAdmin(user) : false,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                    } catch (e) {
                        console.warn('Firestore user profile sync:', e);
                    }
                    window.location.href = 'index.html';
                }
            } catch (err) {
                console.error('Google Register Error:', err);
                if (registerError) {
                    registerError.textContent = 'کێشەیەک لە تۆمارکردن بە گووگڵ چێبوو: ' + (err.message || '');
                    registerError.style.display = 'block';
                }
            } finally {
                googleRegBtn.disabled = false;
            }
        });
    }
});
// --- END OF FILE: register-script.js ---
