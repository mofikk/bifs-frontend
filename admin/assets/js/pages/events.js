// events.js - extracted from events.html
let deleteId = null;
const API_BASE = window.__APP?.BASE_URL || window.BASE_URL || "https://bifs-backend.onrender.com/api";

async function fetchEvents() {
    const tbody = document.getElementById("eventTableBody");
    if (!tbody) {
        console.error("fetchEvents: #eventTableBody not found in DOM");
        return;
    }
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
            <td><div class="spinner"></div></td>
            <td><div class="spinner"></div></td>
        `;
        tbody.appendChild(tr);
    }

    try {
        const url = `${API_BASE}/events`;
        const res = await fetch(url, { headers: { "Accept": "application/json" } });

        if (!res.ok) {
            const text = await res.text();
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Failed to load events (${res.status})</td></tr>`;
            return;
        }

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
            const text = await res.text();
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Server returned non-JSON response</td></tr>`;
            return;
        }

        const events = await res.json();
        if (!Array.isArray(events)) {
            const candidates = events.data || events.items || [];
            if (Array.isArray(candidates)) {
                renderEventsArray(candidates, tbody);
                return;
            }
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:orange;">No events found (unexpected response shape)</td></tr>`;
            return;
        }

        if (events.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No events yet</td></tr>`;
            return;
        }

        events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        tbody.innerHTML = "";
        renderEventsArray(events, tbody);

    } catch (error) {
        console.error("fetchEvents: caught error", error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Failed to load events (see console)</td></tr>`;
    }
}

function renderEventsArray(events, tbody) {
    events.forEach((event, index) => {
        const tr = document.createElement("tr");
        const number = index + 1;
        const cleanBody = event.description ? String(event.description).replace(/<[^>]*>/g, "") : "";
        const truncatedBody = cleanBody.length > 70 ? cleanBody.substring(0, 70) + "..." : cleanBody;
        const tagsText = Array.isArray(event.tags) ? event.tags.join(", ") : (event.tags || "");
        // make image clickable to open preview
        const imageCell = event.image_url
            ? `<img class="" src="${event.image_url}" alt="event image" data-event-id="${event.id}" style="width:60px;height:40px;object-fit:cover;">`
            : "No image";

            //i removed class: evt-thumb from img above and also removed  cursor:pointer; from style to fix layout issue

            
        const date = event.created_at
            ? new Date(event.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
            : "\u2014";

        tr.innerHTML = `
            <td>${number}</td>
            <td class="mwt-150">${event.title || "\u2014"}</td>
            <td class="mwt-200"><span class="evt-body-preview" data-event-id="${event.id}" style="cursor:pointer;">${truncatedBody}</span></td>
            <td class="mwt-150">${tagsText}</td>
            <td>${imageCell}</td>
            <td>${date}</td>
            <td>${event.status || "\u2014"}</td>
            <td class="modify mw-100">
                <button class="btn btn-fill btn-danger btn-sm btn-delete" data-id="${event.id}">Delete</button>
                <button class="btn btn-fill btn-primary btn-sm btn-edit" data-id="${event.id}">Edit</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // After rows created attach click handlers for image and body preview
    // Use event delegation on tbody for robustness
    tbody.addEventListener('click', function onTbodyClick(e) {
        const img = e.target.closest('.evt-thumb');
        if (img) {
            const src = img.getAttribute('src');
            showPreview({ type: 'image', src, title: '' });
            return;
        }

        const bodySpan = e.target.closest('.evt-body-preview');
        if (bodySpan) {
            const id = bodySpan.getAttribute('data-event-id');
            // find event by id
            const ev = events.find(x => String(x.id) === String(id));
            if (ev) {
                showPreview({ type: 'event', event: ev });
            }
            return;
        }

        const deleteBtn = e.target.closest('.btn-delete');
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (id) showDeleteModal(id);
            return;
        }

        const editBtn = e.target.closest('.btn-edit');
        if (editBtn) {
            const id = editBtn.dataset.id;
            if (id) editEvent(id);
            return;
        }
    }, { once: false });
}

// Utility: safe-ish sanitize (strip script tags)
function sanitizeHtml(html) {
    if (!html) return '';
    return String(html).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
}

function showPreview({ type, src, title, event }) {
    const modal = $('#previewModal');
    const previewTitle = document.getElementById('previewTitle');
    const previewBody = document.getElementById('previewBody');
    if (!previewBody || !previewTitle) return;
    if (type === 'image') {
        previewTitle.textContent = title || 'Image Preview';
        previewBody.innerHTML = `<div style="text-align:center;"><img src="${src}" alt="preview" style="max-width:100%; height:auto; border-radius:4px;"></div>`;
    } else if (type === 'event' && event) {
        previewTitle.textContent = event.title || 'Event Preview';
        const imgHtml = event.image_url ? `<img src="${event.image_url}" alt="event image" style="max-width:100%; height:auto; object-fit:cover; margin-bottom:12px;">` : '';
        const bodyHtml = sanitizeHtml(event.description || '');
        // Wrap like a main page post: title, image, full body
        previewBody.innerHTML = `
            <div class="preview-event">
                <h3 style="margin-top:0;">${event.title || ''}</h3>
                ${imgHtml}
                <div class="preview-body">${bodyHtml}</div>
            </div>
        `;
    }
    modal.modal('show');
}

function showDeleteModal(id) {
    deleteId = id;
    ConfirmModal.show({
        title: 'Delete event',
        message: '<p>Are you sure you want to delete this event?</p>',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        iconClass: 'fa fa-trash',
        confirmClass: 'btn-confirm',
        cancelClass: 'btn-cancel',
        onConfirm: async () => {
            if (!deleteId) return;
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Authentication required');
                }

                // Quick client-side role guard using JWT payload
                let payload = null;
                try {
                    payload = JSON.parse(atob(token.split('.')[1]));
                } catch (e) { /* ignore */ }
                if (!payload || (payload.role !== 'Administrator' && payload.role !== 'admin')) {
                    throw new Error('You do not have permission to delete events');
                }

                const res = await fetch(`${API_BASE}/events/${deleteId}`, { 
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (res.status === 403) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.error || 'You do not have permission to delete events');
                }

                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.error || `Failed to delete event (${res.status})`);
                }

                await fetchEvents();
                const successAlert = document.getElementById('success');
                if (successAlert) {
                    successAlert.style.display = 'inline-flex';
                    successAlert.style.opacity = '1';
                    setTimeout(() => {
                        successAlert.style.opacity = '0';
                        setTimeout(() => { successAlert.style.display = 'none'; }, 500);
                    }, 4000);
                }
            } catch (error) {
                console.error('Error deleting event:', error);
                const errorAlert = document.getElementById('failed');
                if (errorAlert) {
                    errorAlert.querySelector('[data-notify="message"]').textContent = error.message || 'Failed to delete event';
                    errorAlert.style.display = 'inline-flex';
                    errorAlert.style.opacity = '1';
                    setTimeout(() => { errorAlert.style.opacity = '0'; setTimeout(() => { errorAlert.style.display = 'none'; }, 500); }, 4000);
                }
            }
            deleteId = null;
        }
    }).catch(err => console.error('Confirm modal error:', err));
}

function editEvent(id) {
    window.location.href = `edit-event.html?id=${id}`;
}

document.addEventListener("DOMContentLoaded", fetchEvents);
