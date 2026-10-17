// --- START OF FILE: login-script.js ---
document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'ل هیڤیێ بە...';
        loginError.style.display = 'none';

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            const status = await checkUserStatus(user);
            
            if (status && status.status === 'granted') {
                window.location.href = 'index.html';
            }

        } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                loginError.textContent = 'ئیمەیل یان تێپەڕەوشە خەلەتە.';
            } else {
                loginError.textContent = 'کێشەیەک د چونا ژوور دا چێبوو.';
                console.error('Login Error:', error);
            }
            loginError.style.display = 'block';
            submitButton.disabled = false;
            submitButton.textContent = 'داخل ببە';
        }
    });
});
// --- END OF FILE: login-script.js ---
