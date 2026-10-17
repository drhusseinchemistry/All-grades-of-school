document.addEventListener('DOMContentLoaded', function () {
    const db = firebase.firestore();
    const auth = firebase.auth();
    const storage = firebase.storage();

    let currentUserId = null;
    let currentUserName = null;
    let unsubscribe; 
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUserId = user.uid;
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                currentUserName = userDoc.data().fullName || user.email;
            } else {
                currentUserName = user.email;
                console.error("User document not found in Firestore!");
            }
            initializeApp();
        } else {
            console.log("No user is logged in. Redirecting...");
        }
    });

    function initializeApp() {
        const messagesContainer = document.getElementById('chat-messages');
        const messageForm = document.getElementById('message-form');
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        const connectionStatus = document.getElementById('connection-status');
        const fileInput = document.getElementById('file-input');
        const imagePreviewContainer = document.getElementById('image-preview-container');
        const removePreviewBtn = document.getElementById('remove-preview-btn');
        const editorModal = document.getElementById('editor-modal');
        const saveImageBtn = document.getElementById('save-image-btn');
        const cancelImageBtn = document.getElementById('cancel-image-btn');
        let imageEditorInstance = null;
        let selectedFile = null;

        function dataURLtoFile(dataurl, filename) {
            var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while(n--){ u8arr[n] = bstr.charCodeAt(n); }
            return new File([u8arr], filename, {type:mime});
        }

        function scrollToBottom() { messagesContainer.scrollTop = messagesContainer.scrollHeight; }
        function formatTimestamp(timestamp) { if (!timestamp) return ''; return new Date(timestamp.seconds * 1000).toLocaleTimeString('ku-IQ', { hour: '2-digit', minute: '2-digit' }); }

        const connectedRef = firebase.database().ref(".info/connected");
        connectedRef.on("value", (snap) => {
          if (snap.val() === true) {
            connectionStatus.classList.remove('disconnected', 'connecting');
            connectionStatus.classList.add('connected');
            connectionStatus.title = "Connected";
          } else {
            connectionStatus.classList.remove('connected', 'connecting');
            connectionStatus.classList.add('disconnected');
            connectionStatus.title = "Disconnected";
          }
        });

        if (unsubscribe) unsubscribe();
        messagesContainer.innerHTML = '<p class="system-message">نامەکانت دەهێنرێن...</p>';
        const chatRef = db.collection('chats').doc(currentUserId);

        unsubscribe = chatRef.onSnapshot(doc => {
            messagesContainer.innerHTML = ''; 
            if (doc.exists && doc.data().messages) {
                doc.data().messages.forEach(msg => renderMessage(msg));
            } else {
                messagesContainer.innerHTML = '<p class="system-message">نامەیەکی نوێ بنێرە بۆ دەستپێکردنی گفتوگۆ</p>';
            }
            scrollToBottom();
        }, error => {
            console.error("Error listening to chat:", error);
            messagesContainer.innerHTML = '<p class="system-message" style="color:red;">کێشەیەک لە هێنانی نامەکاندا ڕوویدا</p>';
        });

        function renderMessage(msg) {
            const isSent = msg.sender === currentUserId;
            const bubble = document.createElement('div');
            bubble.classList.add('message-bubble', isSent ? 'sent' : 'received');

            if (msg.fileUrl) {
                if (msg.fileType && msg.fileType.startsWith('video')) {
                    const video = document.createElement('video');
                    video.src = msg.fileUrl;
                    video.classList.add('chat-video');
                    video.controls = true;
                    bubble.appendChild(video);
                } else {
                    const img = document.createElement('img');
                    img.src = msg.fileUrl;
                    img.classList.add('chat-image');
                    img.onclick = () => window.open(msg.fileUrl, '_blank');
                    bubble.appendChild(img);
                }
                if (!msg.text) { bubble.classList.add('media-only'); }
            }

            if (msg.text) {
                const textP = document.createElement('p');
                textP.textContent = msg.text;
                if (msg.fileUrl) textP.classList.add('caption');
                bubble.appendChild(textP);
            }
            
            const timestamp = document.createElement('span');
            timestamp.classList.add('message-timestamp');
            timestamp.textContent = formatTimestamp(msg.timestamp);
            bubble.appendChild(timestamp);
            
            messagesContainer.appendChild(bubble);
        }
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                if (file.type.startsWith('video/')) {
                    selectedFile = file;
                    resetPreview();
                    const video = document.createElement('video');
                    video.src = URL.createObjectURL(selectedFile);
                    video.autoplay = true; video.muted = true; video.loop = true;
                    imagePreviewContainer.prepend(video);
                    imagePreviewContainer.style.display = 'block';
                    return;
                }
                if (file.type.startsWith('image/')) {
                    editorModal.style.display = 'flex';
                    imageEditorInstance = new tui.ImageEditor('#tui-image-editor-container', {
                        includeUI: { loadImage: { path: URL.createObjectURL(file), name: file.name }, theme: { 'common.backgroundColor': '#1e1e1e', 'submenu.backgroundColor': '#333' }, menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'text', 'filter'], initMenu: 'draw', uiSize: { width: '100%', height: '100%' }, menuBarPosition: 'bottom', },
                        cssMaxWidth: document.documentElement.clientWidth * 0.9,
                        cssMaxHeight: document.documentElement.clientHeight * 0.8,
                        selectionStyle: { cornerSize: 20, rotatingPointOffset: 70 },
                    });
                    window.dispatchEvent(new Event('resize'));
                }
            }
        });

        saveImageBtn.addEventListener('click', () => {
            if (imageEditorInstance) {
                const dataURL = imageEditorInstance.toDataURL();
                const originalFile = fileInput.files[0];
                selectedFile = dataURLtoFile(dataURL, `edited_${originalFile.name}`);
                resetPreview();
                const img = document.createElement('img');
                img.src = dataURL;
                imagePreviewContainer.prepend(img);
                imagePreviewContainer.style.display = 'block';
                editorModal.style.display = 'none';
                imageEditorInstance.destroy();
                imageEditorInstance = null;
            }
        });

        cancelImageBtn.addEventListener('click', () => {
            editorModal.style.display = 'none';
            if (imageEditorInstance) {
                imageEditorInstance.destroy();
                imageEditorInstance = null;
            }
            fileInput.value = '';
        });

        function resetPreview() {
            selectedFile = null; fileInput.value = ''; imagePreviewContainer.style.display = 'none';
            const previewContent = imagePreviewContainer.querySelector('img, video');
            if(previewContent) previewContent.remove();
        }

        removePreviewBtn.addEventListener('click', resetPreview);

        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = messageInput.value.trim();
            if ((!text && !selectedFile) || !currentUserId) return;
            
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            let fileUrl = null; let fileType = null;

            try {
                if (selectedFile) {
                    fileType = selectedFile.type;
                    const folder = fileType.startsWith('video') ? 'chat_videos' : 'chat_images';
                    const filePath = `${folder}/${currentUserId}/${Date.now()}_${selectedFile.name}`;
                    const fileRef = storage.ref(filePath);
                    const snapshot = await fileRef.put(selectedFile);
                    fileUrl = await snapshot.ref.getDownloadURL();
                }

                const message = { sender: currentUserId, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
                if (text) message.text = text;
                if (fileUrl) { message.fileUrl = fileUrl; message.fileType = fileType; }

                const chatDoc = await chatRef.get();

                if (!chatDoc.exists) {
                    await chatRef.set({
                        messages: [message],
                        lastMessageTimestamp: message.timestamp,
                        userEmail: auth.currentUser.email,
                        userName: currentUserName,
                        isReadByAdmin: false
                    });
                } else {
                    await chatRef.update({
                        messages: firebase.firestore.FieldValue.arrayUnion(message),
                        lastMessageTimestamp: message.timestamp,
                        isReadByAdmin: false
                    });
                }
                messageInput.value = ''; resetPreview();
            } catch (error) {
                console.error("Error sending message:", error);
                alert("کێشەیەک لە ناردنی نامەکەدا ڕوویدا.");
            } finally {
                sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            }
        });
    }
});
