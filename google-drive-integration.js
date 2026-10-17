/**
 * Google Drive Integration Service
 * Powered by Firebase Auth with Google OAuth provider
 * In-memory token management, Drive API v3 operations, and UI modal
 */

(function (window) {
    'use strict';

    // Scopes configured in applet
    const DRIVE_SCOPES = [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
    ];

    // IN-MEMORY TOKEN STORAGE ONLY (MANDATORY: Never store in localStorage or sessionStorage)
    let cachedAccessToken = null;
    let currentUser = null;
    let isSigningIn = false;

    // Listeners for auth changes
    const authListeners = [];

    function notifyAuthListeners() {
        authListeners.forEach(fn => {
            try { fn({ user: currentUser, token: cachedAccessToken }); } catch (e) { console.error(e); }
        });
    }

    // Initialize Firebase Auth listener
    function initAuth() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.warn('Firebase Auth SDK not found yet.');
            return;
        }

        const auth = firebase.auth();
        auth.onAuthStateChanged(async (user) => {
            currentUser = user;
            if (!user) {
                cachedAccessToken = null;
                notifyAuthListeners();
            } else {
                // If user is present but token expired/not cached, trigger silent refresh if available
                if (!cachedAccessToken && !isSigningIn) {
                    notifyAuthListeners();
                }
            }
        });
    }

    // Google Sign-In with popup requesting Drive scopes
    async function signInWithGoogle() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            throw new Error('Firebase Auth not available');
        }

        try {
            isSigningIn = true;
            const provider = new firebase.auth.GoogleAuthProvider();
            DRIVE_SCOPES.forEach(scope => provider.addScope(scope));
            
            // Set prompt to select account if needed
            provider.setCustomParameters({ prompt: 'select_account' });

            const result = await firebase.auth().signInWithPopup(provider);
            const credential = result.credential;

            if (credential && credential.accessToken) {
                cachedAccessToken = credential.accessToken;
            } else if (result.user && result.credential?.accessToken) {
                cachedAccessToken = result.credential.accessToken;
            } else {
                // Firebase Web SDK v8 populates credential.accessToken
                cachedAccessToken = credential ? credential.accessToken : null;
            }

            currentUser = result.user;
            notifyAuthListeners();
            return { user: currentUser, accessToken: cachedAccessToken };
        } catch (error) {
            console.error('Google Drive sign-in error:', error);
            throw error;
        } finally {
            isSigningIn = false;
        }
    }

    // Sign out
    async function signOut() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            await firebase.auth().signOut();
        }
        cachedAccessToken = null;
        currentUser = null;
        notifyAuthListeners();
    }

    function getAccessToken() {
        return cachedAccessToken;
    }

    function getCurrentUser() {
        return currentUser;
    }

    function onAuthStateChanged(callback) {
        authListeners.push(callback);
        // Call immediately with current state
        callback({ user: currentUser, token: cachedAccessToken });
        return () => {
            const idx = authListeners.indexOf(callback);
            if (idx > -1) authListeners.splice(idx, 1);
        };
    }

    // ==========================================
    // GOOGLE DRIVE API OPERATIONS
    // ==========================================

    /**
     * List files from user's Google Drive
     * @param {Object} options
     * @param {string} options.q Query string
     * @param {number} options.pageSize Number of files
     * @param {string} options.filterType 'all'|'pdf'|'slide'|'doc'|'image'
     * @param {string} options.search Keyword search
     */
    async function listFiles(options = {}) {
        const token = cachedAccessToken;
        if (!token) throw new Error('NOT_AUTHENTICATED');

        let queryParts = ['trashed = false'];

        if (options.search && options.search.trim()) {
            const escaped = options.search.replace(/'/g, "\\'");
            queryParts.push(`name contains '${escaped}'`);
        }

        if (options.filterType && options.filterType !== 'all') {
            switch (options.filterType) {
                case 'pdf':
                    queryParts.push("mimeType = 'application/pdf'");
                    break;
                case 'slide':
                    queryParts.push("(mimeType contains 'presentation' or mimeType contains 'powerpoint')");
                    break;
                case 'doc':
                    queryParts.push("(mimeType contains 'document' or mimeType contains 'word' or mimeType = 'text/plain')");
                    break;
                case 'image':
                    queryParts.push("mimeType contains 'image/'");
                    break;
            }
        }

        const q = queryParts.join(' and ');
        const fields = 'nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink, webContentLink, iconLink)';
        const pageSize = options.pageSize || 30;

        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&pageSize=${pageSize}&orderBy=modifiedTime desc`;

        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            if (res.status === 401) {
                cachedAccessToken = null;
                notifyAuthListeners();
            }
            throw new Error(err.error?.message || `Drive API error: ${res.status}`);
        }

        return await res.json();
    }

    /**
     * Download or read file content (Blob, text, or arrayBuffer)
     * For Google Docs/Slides/Sheets, exports to PDF or plain text
     */
    async function getFileContent(fileId, mimeType) {
        const token = cachedAccessToken;
        if (!token) throw new Error('NOT_AUTHENTICATED');

        let url;
        if (mimeType && mimeType.includes('vnd.google-apps.presentation')) {
            url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
        } else if (mimeType && mimeType.includes('vnd.google-apps.document')) {
            url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
        } else {
            url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        }

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch file content (${res.status})`);
        }

        const blob = await res.blob();
        return blob;
    }

    /**
     * Upload a new file (e.g., HTML presentation, PDF, Malzama, notes) to Google Drive
     * Uses multipart/related to upload metadata + file data
     */
    async function uploadFile({ name, content, mimeType = 'text/html', folderId = null, description = '' }) {
        const token = cachedAccessToken;
        if (!token) throw new Error('NOT_AUTHENTICATED');

        const metadata = {
            name: name,
            mimeType: mimeType,
            description: description || 'کەرەستەی پەروەردەیی لە پلاتفۆرمی پۆلا 10-11-12'
        };

        if (folderId) {
            metadata.parents = [folderId];
        }

        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        // Handle string content or Blob/ArrayBuffer
        let fileData = content;
        let isBlob = content instanceof Blob;

        let multipartRequestBody;
        if (typeof content === 'string') {
            multipartRequestBody =
                delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                `Content-Type: ${mimeType}\r\n\r\n` +
                content +
                close_delim;
        } else {
            // For binary/blob content
            const metadataBlob = new Blob([
                delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                `Content-Type: ${mimeType}\r\n\r\n`
            ], { type: 'text/plain' });

            const closeBlob = new Blob([close_delim], { type: 'text/plain' });
            multipartRequestBody = new Blob([metadataBlob, content, closeBlob]);
        }

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: multipartRequestBody
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error?.message || `Upload failed: ${res.status}`);
        }

        return await res.json();
    }

    /**
     * Delete file from Google Drive
     * MANDATORY: Must only be called after explicit user confirmation dialog
     */
    async function deleteFile(fileId) {
        const token = cachedAccessToken;
        if (!token) throw new Error('NOT_AUTHENTICATED');

        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok && res.status !== 204) {
            throw new Error(`Failed to delete file: ${res.status}`);
        }

        return true;
    }

    /**
     * Explicit User Confirmation Modal for Destructive Operations (MANDATORY)
     * Meets the security constitution requirements
     */
    function showDestructiveConfirmDialog({ title, message, itemName, onConfirm, onCancel }) {
        let existing = document.getElementById('gdrive-confirm-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'gdrive-confirm-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center;
            z-index: 99999; direction: rtl; font-family: inherit; padding: 15px;
        `;

        modal.innerHTML = `
            <div style="background: var(--surface-color, #1e293b); color: var(--primary-text, #f8fafc); border: 1px solid var(--border-color, #334155); border-radius: 16px; max-width: 440px; width: 100%; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); text-align: right;">
                <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 16px;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 style="margin: 0 0 10px; font-size: 1.25rem; font-weight: 700; color: #ef4444;">
                    ${title || 'پشتڕاستکردنەوەی سڕینەوە لە Google Drive'}
                </h3>
                <p style="margin: 0 0 14px; color: var(--secondary-text, #94a3b8); font-size: 0.95rem; line-height: 1.6;">
                    ${message || 'ئایا دڵنیایت دەتەوێت ئەم فایلە لە Google Drive بسڕیتەوە؟ ئەم کردارە ناگەڕێتەوە.'}
                </p>
                ${itemName ? `<div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 8px; margin-bottom: 20px; font-size: 0.88rem; color: #38bdf8; word-break: break-all;"><i class="fas fa-file"></i> ${itemName}</div>` : ''}
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="gdrive-confirm-cancel-btn" style="padding: 10px 18px; border-radius: 10px; border: 1px solid var(--border-color, #475569); background: transparent; color: var(--primary-text, #f8fafc); cursor: pointer; font-family: inherit; font-size: 0.9rem;">
                        پاشگەزبوونەوە (Cancel)
                    </button>
                    <button id="gdrive-confirm-delete-btn" style="padding: 10px 20px; border-radius: 10px; border: none; background: #dc2626; color: #ffffff; cursor: pointer; font-weight: 600; font-family: inherit; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-trash-alt"></i> بەڵێ، بسڕەوە (Confirm Delete)
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const cancelBtn = modal.querySelector('#gdrive-confirm-cancel-btn');
        const deleteBtn = modal.querySelector('#gdrive-confirm-delete-btn');

        cancelBtn.addEventListener('click', () => {
            modal.remove();
            if (onCancel) onCancel();
        });

        deleteBtn.addEventListener('click', async () => {
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> دەسڕێتەوە...';
            try {
                if (onConfirm) await onConfirm();
            } finally {
                modal.remove();
            }
        });
    }

    // Auto-init on script load
    if (typeof window !== 'undefined') {
        window.addEventListener('DOMContentLoaded', () => {
            initAuth();
        });
    }

    // Export service to global window
    window.GoogleDriveService = {
        initAuth,
        signInWithGoogle,
        signOut,
        getAccessToken,
        getCurrentUser,
        onAuthStateChanged,
        listFiles,
        getFileContent,
        uploadFile,
        deleteFile,
        showDestructiveConfirmDialog
    };

})(window);
