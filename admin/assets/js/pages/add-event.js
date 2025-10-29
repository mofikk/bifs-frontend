document.addEventListener("DOMContentLoaded", async () => {
    const tagSelect = document.getElementById("tags");
    const successAlert = document.getElementById("success");
    const failedAlert = document.getElementById("failed");
    const uploadError = document.getElementById("uploadError");
    const submitBtn = document.getElementById("submitBtn");

    // Initialize Summernote with Bootstrap 4 theme
    $('#description').summernote({
        placeholder: 'Write your event description here...',
        tabsize: 2,
        height: 300,
        toolbar: [
          ['style', ['style']],
          ['font', ['bold', 'underline', 'clear']],
          ['color', ['color']],
          ['para', ['ul', 'ol', 'paragraph']],
          ['table', ['table']],
          ['insert', ['link', 'picture']],
          ['view', ['fullscreen', 'codeview', 'help']]
        ]
    });

    const BASE_URL = "https://bifs-backend.onrender.com/api";
    const MAX_SIZE = 600 * 1024; // 600 KB

    // ✅ Load available tags
    try {
        const res = await fetch(`${BASE_URL}/tags`);
        const tags = await res.json();

        tagSelect.innerHTML = ""; // Clear "Loading..."
        tags.forEach(tag => {
            const option = document.createElement("option");
            option.value = tag.name;
            option.textContent = tag.name;
            tagSelect.appendChild(option);
        });
    } catch (err) {
        console.error("Error fetching tags:", err);
    }

    // ✅ Helper for alert display
    function showAlert(type) {
        const alertEl = type === "success" ? successAlert : failedAlert;
        const showId = type === "success" ? "success-show" : "failed-show";
        alertEl.id = showId;
        setTimeout(() => { alertEl.id = type; }, 3000);
    }

    // ✅ Handle Event creation
    const form = document.getElementById("createEventForm");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        uploadError.textContent = ""; // clear previous error
        const title = document.getElementById("title").value.trim();
        const body = $('#description').summernote('code').trim();
        const tags = Array.from(tagSelect.selectedOptions).map(opt => opt.value);
        const status = document.querySelector('input[name="status"]:checked').value;
        const fileInput = document.getElementById("formFile");

        // ✅ Validate file size
        if (fileInput.files.length > 0 && fileInput.files[0].size > MAX_SIZE) {
            uploadError.textContent = "File too large. Maximum size is 600 KB.";
            return;
        }

        // ✅ Show spinner
        submitBtn.disabled = true;
        const spinner = document.createElement("span");
        spinner.classList.add("button-spinner");
        submitBtn.appendChild(spinner);

        // ✅ Build FormData (for both image + text fields)
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", body);
        formData.append("status", status);
        formData.append("tags", JSON.stringify(tags)); // backend normalizes this
        formData.append("created_at", new Date().toISOString());

        if (fileInput.files.length > 0) {
            formData.append("image", fileInput.files[0]);
        }

        // ✅ Send POST request
        try {
            // require auth for creating events
            const token = localStorage.getItem('token');
            if (!token) {
                uploadError.textContent = "You must be signed in to create events.";
                console.error("No auth token found in localStorage");
                submitBtn.removeChild(spinner);
                submitBtn.disabled = false;
                return;
            }

            const res = await fetch(`${BASE_URL}/events`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData // No Content-Type header; fetch sets boundary automatically
            });

            if (res.ok) {
                showAlert("success");
                form.reset();
                $('#description').summernote('reset');
            } else {
                const errorData = await res.json();
                console.error("Error creating event:", errorData);
                showAlert("failed");
            }
        } catch (error) {
            console.error("Error posting event:", error);
            showAlert("failed");
        } finally {
            submitBtn.removeChild(spinner);
            submitBtn.disabled = false;
        }
    });
});
