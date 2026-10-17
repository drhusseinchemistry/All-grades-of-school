// Use provisioned Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBWbSMZnDyieB673e94sZ_SHN43oF-0mSE",
    authDomain: "gen-lang-client-0138644531.firebaseapp.com",
    projectId: "gen-lang-client-0138644531",
    storageBucket: "gen-lang-client-0138644531.firebasestorage.app",
    messagingSenderId: "342880346152",
    appId: "1:342880346152:web:2adc906fdc6bb0d24b151d"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null;
const storage = typeof firebase !== 'undefined' && firebase.storage ? firebase.storage() : null;

