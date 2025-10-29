// add-user.js - extracted from add-user.html
document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("createUserForm");
    const successAlert = document.getElementById("success");
    const failedAlert = document.getElementById("failed");
    const submitBtn = document.getElementById("submitBtn");
    const BASE_URL = "https://bifs-backend.onrender.com/api";

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirmPassword");

    const passwordError = document.querySelector(".password-error");
    const passwordMatch = document.querySelector(".password-match");
    const nameError = document.createElement("p");
    const emailError = document.createElement("p");

    nameError.className = "text-danger small name-error";
    emailError.className = "text-danger small email-error";
    nameInput.insertAdjacentElement("afterend", nameError);
    emailInput.insertAdjacentElement("afterend", emailError);

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

    function showAlert(type) {
        const alertEl = type === "success" ? successAlert : failedAlert;
        alertEl.style.display = "inline-flex";
        alertEl.style.opacity = "1";
        setTimeout(() => {
            alertEl.style.transition = "opacity 0.5s ease";
            alertEl.style.opacity = "0";
            setTimeout(() => (alertEl.style.display = "none"), 500);
        }, 3000);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        passwordError.textContent = "";
        passwordMatch.textContent = "";
        nameError.textContent = "";
        emailError.textContent = "";

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmInput.value.trim();

        if (!passwordRegex.test(password)) {
            passwordError.textContent =
                "Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.";
            return;
        }

        if (password !== confirmPassword) {
            passwordMatch.textContent = "Passwords do not match.";
            return;
        }

        submitBtn.disabled = true;
        const spinner = document.createElement("span");
        spinner.classList.add("button-spinner");
        submitBtn.appendChild(spinner);

        const userData = {
            name,
            email,
            password,
            role: "Observer",
            created_at: new Date().toISOString(),
        };

        try {
            const res = await fetch(`${BASE_URL}/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            const data = await res.json();

            if (res.ok) {
                showAlert("success");
                form.reset();
            } else {
                console.error("Error creating user:", data);
                if (data.error?.includes("Email already registered")) {
                    emailError.textContent = "This email is already in use.";
                }
                showAlert("failed");
            }
        } catch (err) {
            console.error("Request failed:", err);
            showAlert("failed");
        } finally {
            submitBtn.removeChild(spinner);
            submitBtn.disabled = false;
        }
    });
});
