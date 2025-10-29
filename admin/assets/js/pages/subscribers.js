// subscribers.js - extracted from subscribers.html
const subApiUrl = "https://bifs-backend.onrender.com/api/subscribers";
const subTbody = document.getElementById("subscriberTableBody");
const subSuccessAlert = document.getElementById("success");
const subFailedAlert = document.getElementById("failed");

let subDeleteId = null;

// Handle delete button clicks
function handleDeleteClick(e) {
    const deleteBtn = e.target.closest('.btn-delete');
    if (!deleteBtn) return;
    
    const id = deleteBtn.dataset.id;
    if (id) showDeleteModal(id);
}

async function fetchSubscribers() {
    subTbody.innerHTML = "";

    for (let i = 0; i < 5; i++) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                <td><div class="spinner"></div></td>
                <td><div class="spinner"></div></td>
                <td><div class="spinner"></div></td>
                <td><div class="spinner"></div></td>
            `;
        subTbody.appendChild(tr);
    }

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(subApiUrl, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

        let subscribers = await res.json();
        subscribers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        subTbody.innerHTML = "";

        if (subscribers.length === 0) {
            subTbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted py-4">
                            No subscribers yet
                        </td>
                    </tr>
                `;
            return;
        }

        subscribers.forEach((sub, index) => {
            const date = sub.created_at
                ? new Date(sub.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                })
                : "\u2014";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${sub.email || "\u2014"}</td>
                    <td>${date}</td>
                    <td>
                        <button data-permission="Administrator" class="btn btn-fill btn-danger btn-sm btn-delete" data-id="${sub.id}">
                            Delete
                        </button>
                    </td>
                `;
            subTbody.appendChild(tr);
        });
        
        // Add click handler using event delegation
        subTbody.removeEventListener('click', handleDeleteClick); // Remove old handler if exists
        subTbody.addEventListener('click', handleDeleteClick);
    } catch (error) {
        console.error("Error loading subscribers:", error);
        showFail("\u274c Failed to load subscribers. Please refresh or try again later.");
        subTbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger py-4">
                        Failed to load subscribers.
                    </td>
                </tr>
            `;
    }
}

function showDeleteModal(id) {
    subDeleteId = id;
    ConfirmModal.show({
        title: 'Delete subscriber',
        message: '<p>Are you sure you want to delete this subscriber?</p>',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        iconClass: 'fa fa-trash',
        confirmClass: 'btn-confirm',
        cancelClass: 'btn-cancel',
        onConfirm: async () => {
            if (!subDeleteId) return;
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required');
        }
        
        // Check user role from JWT token
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'Administrator' && payload.role !== 'admin') {
            throw new Error('You do not have permission to delete subscribers');
        }

        const res = await fetch(`${subApiUrl}/${subDeleteId}`, { 
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (res.status === 403) {
            throw new Error('You do not have permission to delete subscribers');
        }
        
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to delete subscriber');
        }                await fetchSubscribers();
                showSuccess();
            } catch (error) {
                console.error('Error deleting subscriber:', error);
                showFail(error.message || '\u274c Failed to delete subscriber. Please try again.');
            } finally {
                subDeleteId = null;
            }
        }
    }).catch(err => {
        console.error('Confirm modal error:', err);
    });
}

function showSuccess() {
    subSuccessAlert.style.display = "inline-flex";
    subSuccessAlert.style.opacity = "1";
    setTimeout(() => {
        subSuccessAlert.style.display = "none";
        subSuccessAlert.style.opacity = "0";
    }, 5000);
}

function showFail(message = "\u274c Something went wrong.") {
    const el = subFailedAlert;
    if (!el) return;
    el.querySelector('[data-notify="message"]').textContent = message;
    el.style.display = "inline-flex";
    el.style.opacity = "1";
    setTimeout(() => {
        el.style.display = "none";
        el.style.opacity = "0";
    }, 5000);
}

document.addEventListener("DOMContentLoaded", fetchSubscribers);
