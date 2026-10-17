// Use provisioned Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBWbSMZnDyieB673e94sZ_SHN43oF-0mSE",
    authDomain: "gen-lang-client-0138644531.firebaseapp.com",
    projectId: "gen-lang-client-0138644531",
    storageBucket: "gen-lang-client-0138644531.firebasestorage.app",
    messagingSenderId: "342880346152",
    appId: "1:342880346152:web:2adc906fdc6bb0d24b151d",
    firestoreDatabaseId: "ai-studio-39fc4503-adc9-4d66-a3f2-fcb88a179189"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null;
const db = typeof firebase !== 'undefined' && firebase.firestore ? firebase.firestore() : null;
const storage = typeof firebase !== 'undefined' && firebase.storage ? firebase.storage() : null;


