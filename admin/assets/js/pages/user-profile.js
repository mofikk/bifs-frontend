// user-profile.js - extracted from user-profile.html
(function () {
    const API_BASE = window.__APP?.BASE_URL || "https://bifs-backend.onrender.com/api";
    const token = window.__APP?.token || localStorage.getItem('token') || null;
    const storedUser = (window.__APP?.userData) ? window.__APP.userData : (() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; }
    })();

    const nameInput = document.getElementById('profile-name-input');
    const emailInput = document.getElementById('profile-email-input');
    const nameForm = document.getElementById('profile-name-form');
    const nameSubmit = document.getElementById('profile-name-submit');

    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const passwordForm = document.getElementById('profile-password-form');
    const passwordSubmit = document.getElementById('profile-password-submit');

    const modalChangeName = $('#modal-change-name');
    const modalResetPassword = $('#modal-reset-password');
    const modalChangeNameConfirm = document.getElementById('modal-change-name-confirm');
    const modalResetPasswordConfirm = document.getElementById('modal-reset-password-confirm');

    const successAlert = document.getElementById('success');
    const failedAlert = document.getElementById('failed');

    function showBtnLoading(btn, text) {
        if (!btn) return;
        if (btn.dataset.loading === "1") return;
        btn.dataset.loading = "1";
        btn.disabled = true;

        let ph = btn.querySelector('span');
        if (!ph) {
            ph = document.createElement('span');
            btn.appendChild(ph);
        }

        ph.dataset.orig = ph.innerHTML || '';
        ph.innerHTML = `<span class="button-spinner" aria-hidden="true"></span>${text ? ' ' + text : ''}`;
    }

    function hideBtnLoading(btn) {
        if (!btn) return;
        btn.disabled = false;
        btn.dataset.loading = "0";

        const ph = btn.querySelector('span');
        if (ph) {
            ph.innerHTML = ph.dataset.orig || '';
            delete ph.dataset.orig;
        }
    }

    function showAlert(type, message) {
        const el = (type === 'success') ? successAlert : failedAlert;
        if (!el) return;
        const msgSpan = el.querySelector('[data-notify="message"]');
        msgSpan.textContent = message || '';
        el.style.display = 'inline-flex';
        el.style.opacity = '1';
        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => { el.style.display = 'none'; }, 300);
        }, 3500);
    }

    function displayRole(role) {
        if (!role) return '\u2014';
        if (role === 'admin') return 'Administrator';
        if (role === 'user') return 'Observer';
        if (role === 'Administrator' || role === 'Observer') return role;
        return String(role);
    }

    async function populateProfile() {
        const cardNameEl = document.getElementById('profile-card-name');
        const cardEmailEl = document.getElementById('profile-card-email');
        const cardRoleEl = document.getElementById('profile-card-role');
        const avatarEl = document.getElementById('profile-avatar');

        try {
            if (token) {
                const res = await fetch(`${API_BASE}/auth/validate`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                if (res.ok) {
                    const data = await res.json();
                    const u = data.user || data;

                    nameInput.value = u.name || '';
                    emailInput.value = u.email || '';

                    if (cardNameEl) cardNameEl.textContent = u.name || '\u2014';
                    if (cardEmailEl) cardEmailEl.textContent = u.email || '\u2014';
                    if (cardRoleEl) cardRoleEl.textContent = displayRole(u.role);
                    if (avatarEl && u.avatar_url) avatarEl.src = u.avatar_url;

                    try { localStorage.setItem('user', JSON.stringify(u)); window.__APP = window.__APP || {}; window.__APP.userData = u; } catch (e) { }
                    return;
                } else {
                    console.warn('auth/validate returned', res.status);
                }
            }
        } catch (e) {
            console.warn('populateProfile live fetch failed', e);
        }

        if (storedUser) {
            nameInput.value = storedUser.name || '';
            emailInput.value = storedUser.email || '';
            if (cardNameEl) cardNameEl.textContent = storedUser.name || '\u2014';
            if (cardEmailEl) cardEmailEl.textContent = storedUser.email || '\u2014';
            if (cardRoleEl) cardRoleEl.textContent = displayRole(storedUser.role);
            if (avatarEl && storedUser.avatar_url) avatarEl.src = storedUser.avatar_url;
        }
    }

    function passwordValid(pw) {
        const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
        return re.test(pw);
    }

    function getUserId() {
        if (storedUser && storedUser.id) return storedUser.id;
        try {
            if (!token) return null;
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id || payload.sub || null;
        } catch (e) { return null; }
    }

    nameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentName = (storedUser && storedUser.name) ? storedUser.name : '';
        if (nameInput.value.trim() === currentName.trim()) {
            showAlert('failed', 'No change detected.');
            return;
        }
        // Use ConfirmModal instead of inline modal
        ConfirmModal.show({
            title: 'Change name',
            message: '<p>Are you sure you want to change your name?</p>',
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            iconClass: 'fa fa-user',
            confirmClass: 'btn-confirm btn-danger',
            cancelClass: 'btn-cancel btn-info',
            onConfirm: async () => {
                // proceed with name change
                showBtnLoading(nameSubmit, '');
                const userId = getUserId();
                if (!userId) {
                    showAlert('failed', 'User not identified. Please sign in again.');
                    hideBtnLoading(nameSubmit);
                    return;
                }
                const newName = nameInput.value.trim();
                if (!newName) {
                    showAlert('failed', 'Name cannot be empty.');
                    hideBtnLoading(nameSubmit);
                    return;
                }
                try {
                    const res = await fetch(`${API_BASE}/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
                        },
                        body: JSON.stringify({ name: newName })
                    });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error || json.message || 'Failed to update name');
                    try {
                        const raw = localStorage.getItem('user');
                        if (raw) {
                            const u = JSON.parse(raw);
                            u.name = newName;
                            localStorage.setItem('user', JSON.stringify(u));
                            window.__APP = window.__APP || {};
                            window.__APP.userData = u;
                        }
                    } catch (e) { }
                    showAlert('success', 'Name updated successfully');
                    setTimeout(() => location.reload(), 900);
                } catch (err) {
                    console.error('update name error', err);
                    showAlert('failed', err.message || 'Failed to update name');
                } finally {
                    hideBtnLoading(nameSubmit);
                }
            }
        }).catch(err => console.error('ConfirmModal error:', err));
    });

    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const p1 = newPasswordInput.value || '';
        const p2 = confirmPasswordInput.value || '';
        document.getElementById('password-error').textContent = '';
        document.getElementById('confirm-error').textContent = '';

        if (!p1 || !p2) {
            document.getElementById('password-error').textContent = 'Password fields required.';
            return;
        }
        if (p1 !== p2) {
            document.getElementById('confirm-error').textContent = 'Passwords do not match.';
            return;
        }
        if (!passwordValid(p1)) {
            document.getElementById('password-error').textContent = 'Password must be 8+ chars, include uppercase, number and symbol.';
            return;
        }
        ConfirmModal.show({
            title: 'Reset password',
            message: '<p>Are you sure you want to reset your password?</p>',
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            iconClass: 'fa fa-key',
            confirmClass: 'btn-confirm btn-danger',
            cancelClass: 'btn-cancel btn-info',
            onConfirm: async () => {
                const userId = getUserId();
                if (!userId) {
                    showAlert('failed', 'User not identified. Please sign in again.');
                    return;
                }
                const newPw = newPasswordInput.value;
                showBtnLoading(passwordSubmit, '');
                try {
                    const res = await fetch(`${API_BASE}/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
                        },
                        body: JSON.stringify({ password: newPw })
                    });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error || json.message || 'Failed to reset password');
                    showAlert('success', 'Password changed. You will be logged out.');
                    setTimeout(() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '../sign-in.html';
                    }, 1200);
                } catch (err) {
                    console.error('reset password error', err);
                    showAlert('failed', err.message || 'Failed to reset password');
                } finally {
                    hideBtnLoading(passwordSubmit);
                }
            }
        }).catch(err => console.error('ConfirmModal error:', err));
    });

    populateProfile();
})();
