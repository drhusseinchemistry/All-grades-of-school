// --- START OF FILE main-script.js ---
document.addEventListener('DOMContentLoaded', () => {
    // ========== SÎSTEMA GUHERTINA ZIMANAN (I18N) ==========
    const languageModal = document.getElementById('language-modal');
    const langToggleButton = document.getElementById('lang-toggle-btn');
    const langMenu = document.getElementById('lang-menu');
    const supportedLanguages = ['ku_ba', 'ku_so', 'ar', 'en'];
    let currentTranslations = {};

    function applyLanguage(lang) {
        if (!translations[lang]) {
            console.error(`Zimanê ${lang} nehatiye dîtin!`);
            return;
        }
        currentTranslations = translations[lang];

        document.documentElement.lang = currentTranslations.html_lang;
        document.documentElement.dir = currentTranslations.html_dir;
        
        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            if (currentTranslations[key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = currentTranslations[key];
                } else {
                    el.textContent = currentTranslations[key];
                }
            }
        });

        const editModal = document.getElementById('edit-modal');
        if(editModal) {
            editModal.querySelectorAll('[data-translate-key]').forEach(el => {
                 const key = el.dataset.translateKey;
                 if (currentTranslations[key]) el.textContent = currentTranslations[key];
            });
        }
    }

    function setLanguage(lang) {
        localStorage.setItem('userLanguage', lang);
        applyLanguage(lang);
        if (languageModal) languageModal.style.display = 'none';
        if (langMenu) langMenu.classList.remove('visible');
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    const savedLang = localStorage.getItem('userLanguage');
    if (savedLang && supportedLanguages.includes(savedLang)) {
        applyLanguage(savedLang);
    } else {
        if (languageModal) languageModal.style.display = 'flex';
    }

    if (document.getElementById('language-selector')) {
         document.getElementById('language-selector').addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.dataset.lang) {
                setLanguage(e.target.dataset.lang);
            }
        });
    }
    
    if (langToggleButton && langMenu) {
        langToggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            langMenu.classList.toggle('visible');
        });

        langMenu.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.dataset.lang) {
                setLanguage(e.target.dataset.lang);
            }
        });

        document.addEventListener('click', (e) => {
            if (!langMenu.contains(e.target) && !langToggleButton.contains(e.target)) {
                langMenu.classList.remove('visible');
            }
        });
    }


    // ========== SÎSTEMA GUHERTINA TEMAYAN (RONAHÎ/TARÎ) ==========
    const themeToggleButton = document.getElementById('theme-toggle-btn');

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if(themeToggleButton) themeToggleButton.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            if(themeToggleButton) themeToggleButton.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('userTheme', newTheme);
        applyTheme(newTheme);
    }
    
    const savedTheme = localStorage.getItem('userTheme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
    }

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }
    
    // ========== SÎSTEMÊ KONTROLKIRINA AUTH (ÇUUNA JÛR/DER) ==========
    const authActionButton = document.getElementById('auth-action-btn');
    if (authActionButton) {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                authActionButton.innerHTML = '<i class="fas fa-right-from-bracket"></i>';
                authActionButton.title = 'دەرکەفتن';
            } else {
                authActionButton.innerHTML = '<i class="fas fa-right-to-bracket"></i>';
                authActionButton.title = 'چوونا ژوور';
            }
        });

        authActionButton.addEventListener('click', () => {
            if (firebase.auth().currentUser) {
                firebase.auth().signOut().then(() => {
                    window.location.href = 'login.html';
                }).catch(error => {
                    console.error('Logout Error:', error);
                });
            } else {
                window.location.href = 'login.html';
            }
        });
    }
});
// --- END OF FILE main-script.js ---
