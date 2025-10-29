



// edit-event.js - extracted from edit-event.html
const apiUrl = "https://bifs-backend.onrender.com/api/events";
const form = document.getElementById("createEventForm");
const titleInput = document.getElementById("title");
const tagsSelect = document.getElementById("tags");
const imageInput = document.getElementById("formFile");
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get("id");
const submitBtn = document.getElementById("submitBtn");
const uploadError = document.getElementById("uploadError");

const MAX_SIZE = 600 * 1024; // 600 KB
const API_BASE = window.API_BASE || "https://bifs-backend.onrender.com/api";

const successAlert = document.getElementById("success");
const failedAlert = document.getElementById("failed");

let originalEvent = null;

async function loadEvent() {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${apiUrl}/${eventId}`, { headers });
        if (!res.ok) throw new Error("Failed to fetch event");

        const event = await res.json();
        originalEvent = event;

        titleInput.value = event.title || "";
        $("#description").summernote("code", event.description || "");

        await loadTags(event.tags || []);
    } catch (error) {
        console.error("Error loading event:", error);
        showFail("\u274c Failed to load event details. Please refresh.");
    }
}

async function loadTags(selectedTags = []) {
    try {
        const res = await fetch(`${API_BASE}/tags`);
        if (!res.ok) throw new Error("Failed to fetch tags");

        const tags = await res.json();
        tagsSelect.innerHTML = "";

        tags.forEach(tag => {
            const opt = document.createElement("option");
            opt.value = tag.name;
            opt.textContent = tag.name;

            if (selectedTags.some(t => t.toLowerCase() === tag.name.toLowerCase())) {
                opt.selected = true;
            }
            tagsSelect.appendChild(opt);
        });
    } catch (err) {
        console.error("Error loading tags:", err);
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    uploadError.textContent = ""; // clear previous file error

    // Validate image size
    if (imageInput.files.length > 0) {
        const file = imageInput.files[0];
        if (file.size > MAX_SIZE) {
            uploadError.textContent = "File too large. Maximum size is 600 KB.";
            return;
        }
    }

    // Disable button and show spinner
    submitBtn.disabled = true;
    const spinner = document.createElement("span");
    spinner.classList.add("button-spinner");
    submitBtn.appendChild(spinner);

    const formData = new FormData();
    formData.append("title", titleInput.value || originalEvent.title);
    formData.append("description", $("#description").summernote("code") || originalEvent.description);
    formData.append("status", document.querySelector('input[name="status"]:checked')?.value || originalEvent.status);

    const selectedTags = Array.from(tagsSelect.selectedOptions).map(opt => opt.value);
    selectedTags.forEach(tag => formData.append("tags[]", tag));

    if (imageInput.files[0]) {
        formData.append("image", imageInput.files[0]);
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showFail("\u274c You must be signed in to edit events.");
            submitBtn.removeChild(spinner);
            submitBtn.disabled = false;
            return;
        }

        const res = await fetch(`${apiUrl}/${eventId}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        if (res.ok) {
            showSuccess();
            setTimeout(() => (window.location.href = "events.html"), 1500);
        } else {
            showFail("\u274c Failed to update event. Check inputs.");
        }
    } catch (err) {
        console.error("Update error:", err);
        showFail("\u274c Network or server error during update.");
    } finally {
        // remove spinner & re-enable button
        submitBtn.removeChild(spinner);
        submitBtn.disabled = false;
    }
});

function showSuccess() {
    successAlert.style.display = "inline-flex";
    successAlert.style.opacity = "1";
    setTimeout(() => {
        successAlert.style.display = "none";
        successAlert.style.opacity = "0";
    }, 5000);
}

function showFail(message = "\u274c Failed to process request.") {
    failedAlert.querySelector('[data-notify="message"]').textContent = message;
    failedAlert.style.display = "inline-flex";
    failedAlert.style.opacity = "1";
    setTimeout(() => {
        failedAlert.style.display = "none";
        failedAlert.style.opacity = "0";
    }, 5000);
}

document.addEventListener("DOMContentLoaded", loadEvent);
