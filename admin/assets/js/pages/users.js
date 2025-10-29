// users.js - extracted from users.html
(function () {
    const API_BASE = window.__APP?.BASE_URL || "https://bifs-backend.onrender.com/api";
    const API_URL = `${API_BASE.replace(/\/+$/, '')}/users`;

    let deleteId = null;
    const successMsg = document.getElementById("success");
    const errorMsg = document.getElementById("failed");

    function showError(message) {
        if (errorMsg) {
            errorMsg.querySelector('[data-notify="message"]').textContent = message;
            errorMsg.style.display = 'inline-flex';
            errorMsg.style.opacity = '1';
            setTimeout(() => {
                errorMsg.style.opacity = '0';
                setTimeout(() => { errorMsg.style.display = 'none'; }, 500);
            }, 4000);
        } else {
            console.error('Error alert element not found:', message);
        }
    }

    function getTableBody() {
        return document.getElementById("user-table-body");
    }

    async function fetchUsersImpl() {
        const tbody = getTableBody();
        if (!tbody) { console.error("[users] table tbody not found"); return; }

        tbody.innerHTML = "";
        for (let i = 0; i < 5; i++) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
        <td><div class="spinner"></div></td>
        <td><div class="spinner"></div></td>
        <td><div class="spinner"></div></td>
        <td><div class="spinner"></div></td>
        <td><div class="spinner"></div></td>
        <td><div class="spinner"></div></td>
      `;
            tbody.appendChild(tr);
        }

        const token = window.__APP?.token || localStorage.getItem("token");
        const headers = token ? { "Accept": "application/json", "Authorization": "Bearer " + token } : { "Accept": "application/json" };

        try {
            const res = await fetch(API_URL, { headers });
            if (!res.ok) {
                if (res.status === 403) {
                    showError('Not authorized. Please contact an administrator.');
                    return;
                }
                const txt = await res.text().catch(() => "");
                console.error("[users] fetch failed:", res.status, txt);
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load users (${res.status})</td></tr>`;
                return;
            }

            const ct = res.headers.get("content-type") || "";
            if (!ct.includes("application/json")) {
                const bodyText = await res.text().catch(() => "");
                console.error("[users] expected JSON but got:", bodyText.slice(0, 500));
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Server returned non-JSON response</td></tr>`;
                return;
            }

            const payload = await res.json();
            const users = Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : []);
            tbody.innerHTML = "";
            if (!users.length) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No users found</td></tr>`;
                return;
            }

            users.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
            users.forEach((user, i) => {
                const date = user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }) : "\u2014";
                const tr = document.createElement("tr");
                tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${user.name || "\u2014"}</td>
          <td>${user.email || "\u2014"}</td>
          <td>${user.role || "\u2014"}</td>
          <td>${date}</td>
          <td class="modify">
            <button type="button" class="btn btn-fill btn-danger btn-sm btn-delete" data-id="${user.id}" data-permission="Administrator">Delete</button>
            <a href="edit-user.html?id=${user.id}" class="btn btn-fill btn-info btn-sm btn-edit" data-permission="Administrator">Edit</a>
          </td>
        `;
                tbody.appendChild(tr);
            });

        } catch (err) {
            console.error("[users] fetch error:", err);
            const tbody2 = getTableBody();
            if (tbody2) tbody2.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load users (see console)</td></tr>`;
        }
    }

    function onTableClick(e) {
        // Handle delete button
        const btnDelete = e.target.closest && e.target.closest(".btn-delete");
        if (btnDelete) {
            const id = btnDelete.dataset.id;
            if (!id) return;
            deleteId = id;
            ConfirmModal.show({
                title: 'Delete user',
                message: '<p>Are you sure you want to delete this user?</p>',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                iconClass: 'fa fa-user-times',
                confirmClass: 'btn-confirm',
                cancelClass: 'btn-cancel',
                onConfirm: async () => {
                    if (!deleteId) return;
                    const token = window.__APP?.token || localStorage.getItem('token');
                    if (!token) {
                        showError('Not authorized. Please contact an administrator.');
                        return;
                    }
                    // Client-side role check before attempting delete
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        if (payload.role !== 'Administrator' && payload.role !== 'admin') {
                            showError('Not authorized. Please contact an administrator.');
                            return;
                        }
                    } catch (e) {
                        showError('Invalid authentication token');
                        return;
                    }
                    try {
                        const res = await fetch(`${API_URL}/${deleteId}`, { 
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        if (res.status === 403) {
                            showError('Not authorized. Please contact an administrator.');
                            return;
                        }
                        if (!res.ok) {
                            const error = await res.json().catch(() => ({}));
                            throw new Error(error.error || 'Failed to delete user');
                        }
                        await fetchUsersImpl();
                        if (successMsg) {
                            successMsg.querySelector('[data-notify="message"]').textContent = 'User deleted successfully';
                            successMsg.style.display = 'inline-flex';
                            successMsg.style.opacity = '1';
                            setTimeout(() => {
                                successMsg.style.opacity = '0';
                                setTimeout(() => { successMsg.style.display = 'none'; }, 500);
                            }, 4000);
                        }
                    } catch (error) {
                        console.error('[users] delete error:', error);
                        showError(error.message || 'Failed to delete user');
                    } finally {
                        deleteId = null;
                    }
                }
            }).catch(err => console.error('Confirm modal error:', err));
            return;
        }
        // Handle edit button
        const btnEdit = e.target.closest && e.target.closest(".btn-edit");
        if (btnEdit) {
            // Check user role before allowing navigation
            const token = window.__APP?.token || localStorage.getItem('token');
            let role = '';
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    role = payload.role;
                } catch (e) {}
            }
            if (role !== 'Administrator' && role !== 'admin') {
                showError('Not authorized. Please contact an administrator.');
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            }
            // Otherwise, allow default navigation
        }
    }

    window._bifs_fetchUsers = fetchUsersImpl;

    function initBindings() {
        const tbody = getTableBody();
        if (tbody) tbody.removeEventListener("click", onTableClick);
        if (tbody) tbody.addEventListener("click", onTableClick);
    }

    function bootstrap() {
        initBindings();
        setTimeout(() => window._bifs_fetchUsers && window._bifs_fetchUsers(), 10);
    }

    if (document.readyState === "complete" || document.readyState === "interactive") bootstrap();
    else document.addEventListener("DOMContentLoaded", bootstrap);

    document.addEventListener("templatesLoaded", () => {
        bootstrap();
    });
})();