// edit-user.js - extracted from edit-user.html
document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("updateUserForm");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirmPassword");
    const roleAdmin = document.getElementById("roleAdmin");
    const roleUser = document.getElementById("roleUser");
    const passwordError = document.querySelector(".password-error");
    const passwordMatch = document.querySelector(".password-match");
    const errorDiv = document.getElementById("errorLoadingDetails");
    const submitBtn = form.querySelector("button[type='submit']");

    const successAlert = document.getElementById("success");
    const failedAlert = document.getElementById("failed");

    const BASE_URL = "https://bifs-backend.onrender.com/api";

    if (!document.querySelector(".name-error")) {
        nameInput.insertAdjacentHTML("afterend", `<p class="name-error text-danger small"></p>`);
    }
    if (!document.querySelector(".email-error")) {
        emailInput.insertAdjacentHTML("afterend", `<p class="email-error text-danger small"></p>`);
    }

    const nameError = document.querySelector(".name-error");
    const emailError = document.querySelector(".email-error");

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("id");
    if (!userId) return alert("No user ID provided.");

    let originalUser = null;

    try {
        const res = await fetch(`${BASE_URL}/users/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch user details");

        const user = await res.json();
        originalUser = user;

        nameInput.value = user.name || "";
        emailInput.value = user.email || "";
        passwordInput.value = "";
        confirmInput.value = "";

        if (user.role === "admin") roleAdmin.checked = true;
        else roleUser.checked = true;

        nameInput.disabled = false;
        emailInput.disabled = false;
        roleAdmin.disabled = false;
        roleUser.disabled = false;
    } catch (err) {
        console.error("Error loading user:", err);
        if (errorDiv) {
            errorDiv.style.display = "block";
            errorDiv.textContent = "!! There was an error loading form details. Please refresh.";
        }
        showAlert(failedAlert);
        return;
    }

    document.querySelectorAll(".toggle-eye").forEach(toggle => {
        toggle.addEventListener("click", () => {
            const input = toggle.closest(".form-group").querySelector("input");
            const icon = toggle.querySelector("i");
            if (input.type === "password") {
                input.type = "text";
                icon.classList.replace("bi-eye", "bi-eye-slash");
            } else {
                input.type = "password";
                icon.classList.replace("bi-eye-slash", "bi-eye");
            }
        });
    });

    form.addEventListener("submit", async e => {
        e.preventDefault();

        passwordError.textContent = "";
        passwordMatch.textContent = "";
        nameError.textContent = "";
        emailError.textContent = "";

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmInput.value.trim();
        const role = document.querySelector('input[name="role"]:checked')?.value || "user";

        if (password || confirmPassword) {
            if (password !== confirmPassword) {
                passwordMatch.textContent = "Passwords do not match.";
                showAlert(failedAlert);
                return;
            }
        }

        submitBtn.disabled = true;
        const spinner = document.createElement("span");
        spinner.classList.add("button-spinner");
        submitBtn.appendChild(spinner);

        try {
            const usersRes = await fetch(`${BASE_URL}/users`);
            const users = await usersRes.json();

            const nameExists = users.some(u => u.name?.toLowerCase() === name.toLowerCase() && u.id !== userId);
            const emailExists = users.some(u => u.email?.toLowerCase() === email.toLowerCase() && u.id !== userId);

            if (nameExists || emailExists) {
                if (nameExists) nameError.textContent = "This name already exists.";
                if (emailExists) emailError.textContent = "This email already exists.";
                showAlert(failedAlert);

                submitBtn.disabled = false;
                if (submitBtn.contains(spinner)) submitBtn.removeChild(spinner);
                return;
            }

            const now = new Date().toISOString();
            const createdAt = originalUser?.createdAt || now;

            const updatedUser = {
                ...originalUser,
                name,
                email,
                role,
                password: password || originalUser.password,
                createdAt,
                updatedAt: now
            };

            const res = await fetch(`${BASE_URL}/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedUser)
            });

            if (res.ok) {
                showAlert(successAlert);
                setTimeout(() => (window.location.href = "users.html"), 5000);
            } else {
                showAlert(failedAlert);
            }
        } catch (err) {
            console.error("Error updating user:", err);
            showAlert(failedAlert);
        } finally {
            if (submitBtn.contains(spinner)) submitBtn.removeChild(spinner);
            submitBtn.disabled = false;
        }
    });

    function showAlert(alertEl) {
        alertEl.style.display = "inline-flex";
        alertEl.style.opacity = "1";
        setTimeout(() => {
            alertEl.style.opacity = "0";
            alertEl.style.display = "none";
        }, 5000);
    }
});
