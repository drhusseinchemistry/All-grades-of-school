// --- START OF FILE: auth-guard.js (UPDATED & SECURED) ---
const SUPER_ADMIN_EMAIL = "hussein.zebary.chemistry96@gmail.com";

function isSuperAdminEmail(email) {
    return !!(email && email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
}

function isSuperAdmin(user) {
    if (!user) {
        if (typeof window !== 'undefined' && window.EducationalData && window.EducationalData.isCurrentUserSuperAdmin()) {
            return true;
        }
        return false;
    }
    return !!(isSuperAdminEmail(user.email));
}

async function checkIsAdmin(user) {
    if (!user) {
        return isSuperAdmin(null);
    }
    if (isSuperAdmin(user)) return true;
    try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            const db = firebase.firestore();
            const userDoc = await db.collection('users').doc(user.uid).get();
            return userDoc.exists && userDoc.data().isAdmin === true;
        }
        return false;
    } catch (error) {
        console.error("Error checking admin role:", error);
        return false;
    }
}

// Make globally accessible
window.SUPER_ADMIN_EMAIL = SUPER_ADMIN_EMAIL;
window.isSuperAdminEmail = isSuperAdminEmail;
window.isSuperAdmin = isSuperAdmin;
window.checkIsAdmin = checkIsAdmin;

// Check user status in Firebase
async function checkUserStatus(user) {
    if (!user) {
        return;
    }

    // Super Admin gets immediate, unconditional access and syncs Firestore
    if (isSuperAdmin(user)) {
        try {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                const db = firebase.firestore();
                const userDocRef = db.collection('users').doc(user.uid);
                await userDocRef.set({
                    email: user.email,
                    isAdmin: true,
                    isSubscribed: true,
                    fullName: user.displayName || 'م. حسين اكرم (ئەدمینێ گشتی)'
                }, { merge: true });
            }
        } catch (e) {
            console.warn("Could not sync super admin status in Firestore:", e);
        }
        localStorage.setItem('is_admin_mode_active', 'true');
        return { status: 'granted', isAdmin: true };
    }

    try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            const db = firebase.firestore();
            const userDocRef = db.collection('users').doc(user.uid);
            const doc = await userDocRef.get();

            if (!doc.exists) {
                return { status: 'granted', isAdmin: false };
            }

            const userData = doc.data();
            return { status: 'granted', isAdmin: userData.isAdmin === true };
        }
    } catch (error) {
        console.error("Error checking user status:", error);
    }
    return { status: 'granted', isAdmin: false };
}

window.checkUserStatus = checkUserStatus;

// Autonomous Route Guard
(function() {
    const protectedAdminPages = ['admin-panel.html', 'wena.html'];
    const protectedTeacherPages = ['teacher-dashboard.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // If viewing admin panel, enforce admin authentication
    if (protectedAdminPages.includes(currentPage)) {
        const content = document.querySelector('body');
        if (content) content.style.visibility = 'hidden';

        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(async (user) => {
                const isAdmin = await checkIsAdmin(user);
                if (isAdmin) {
                    document.body.classList.add('admin-mode');
                    if (content) content.style.visibility = 'visible';
                } else {
                    alert('تۆ دەسەڵاتی چوونەژوورەوەت نییە بۆ پەناڵی ئەدمین. تکایە وەکو ئەدمین بە ئیمەیڵی فەرمی بچۆ ژوورەوە.');
                    window.location.replace('login.html?redirect=admin-panel.html');
                }
            });
        }
    } else if (protectedTeacherPages.includes(currentPage)) {
        // Enforce teacher or admin role
        const role = localStorage.getItem('app_learn_user_role');
        const teacher = localStorage.getItem('app_learn_current_teacher');
        const isAdmin = localStorage.getItem('is_admin_mode_active') === 'true';

        if (!role && !teacher && !isAdmin) {
            // Not chosen or logged in
            window.location.replace('index.html?needRole=teacher');
        }
    }

    // On all pages, update body class if admin
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user && isSuperAdmin(user)) {
                document.body.classList.add('admin-mode');
                localStorage.setItem('is_admin_mode_active', 'true');
            }
        });
    }
})();
