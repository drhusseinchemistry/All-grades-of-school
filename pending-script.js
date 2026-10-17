// --- START OF FILE: pending-script.js (GUHERTÎ) ---
document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    const logoutBtn = document.getElementById('logout-btn');
    const whatsappBtn = document.getElementById('whatsapp-btn');
    const telegramBtn = document.getElementById('telegram-btn');
    const smsBtn = document.getElementById('sms-btn');

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const SUPER_ADMIN_EMAIL = "hussein.zebary.chemistry96@gmail.com";
            if (user.email && user.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
                window.location.href = 'index.html';
                return;
            }

            const userDocRef = db.collection('users').doc(user.uid);
            const doc = await userDocRef.get();

            if (!doc.exists) {
                window.location.href = 'login.html';
                return;
            }
            
            const userData = doc.data();

            if (userData.isSubscribed === true || userData.isAdmin === true) {
                window.location.href = 'index.html';
                return;
            }

            const adminPhoneNumber = '9647501990353';
            const message = `داخازیا چالاککرنا اشتراکێ:\nناڤ: ${userData.fullName}\nرەقەم موبایل: ${userData.phoneNumber}\nئیمەیل: ${userData.email}\nUID: ${user.uid}`;
            const encodedMessage = encodeURIComponent(message);

            whatsappBtn.href = `https://wa.me/${adminPhoneNumber}?text=${encodedMessage}`;
            telegramBtn.href = `https://t.me/Dr_Hussein_chemistry`;
            smsBtn.href = `sms:${adminPhoneNumber}?body=${encodedMessage}`;
            
            [whatsappBtn, telegramBtn, smsBtn].forEach(btn => {
                btn.target = "_blank";
            });

        } else {
            window.location.href = 'login.html';
        }
    });

    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'login.html';
        });
    });
});
// --- END OF FILE: pending-script.js ---
