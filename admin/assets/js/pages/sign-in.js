// sign-in.js - extracted from sign-in.html
(function () {
    const form = document.getElementById("signInForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const signInBtn = document.querySelector(".sign-in-btn");
    const BASE_URL = "https://bifs-backend.onrender.com/api";

    const generalError = document.createElement("p"); generalError.id = "general-error";
    const emailError = document.createElement("p"); emailError.id = "email-error";
    const passwordError = document.createElement("p"); passwordError.id = "password-error";
    emailError.style.color = passwordError.style.color = generalError.style.color = "red";

    const emailField = emailInput.closest(".form-group");
    const passwordField = passwordInput.closest(".form-group");
    if (emailField && !emailField.querySelector("#email-error")) emailField.appendChild(emailError);
    if (passwordField && !passwordField.querySelector("#password-error")) passwordField.appendChild(passwordError);
    if (!form.querySelector("#general-error")) form.prepend(generalError);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        generalError.textContent = ""; emailError.textContent = ""; passwordError.textContent = "";

        signInBtn.disabled = true;
        const originalText = signInBtn.textContent;
        signInBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing In...`;

        try {
            const res = await fetch(`${BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailInput.value.trim(), password: passwordInput.value.trim() }),
            });

            const contentType = res.headers.get("content-type") || "";
            let data;
            if (contentType.includes("application/json")) {
                data = await res.json();
            } else {
                const text = await res.text();
                console.error("Non-JSON response from /auth/login:", text);
                generalError.textContent = "Server returned unexpected response. See console for details.";
                return;
            }

            if (!res.ok) {
                if (data.field === "email") emailError.textContent = data.error || "Invalid email address.";
                else if (data.field === "password") passwordError.textContent = data.error || "Invalid password.";
                else generalError.textContent = data.error || "Invalid email or password.";
                return;
            }

            localStorage.setItem('token', data.token);

            let userObj = data.user || data || {};
            if (!userObj.name) {
                try {
                    const v = await fetch(`${BASE_URL}/auth/validate`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` }
                    });
                    if (v.ok) {
                        const dv = await v.json();
                        userObj = dv.user || dv || userObj;
                    } else {
                        try {
                            const payload = JSON.parse(atob(data.token.split('.')[1]));
                            const id = payload.id || payload.sub;
                            if (id) {
                                const ures = await fetch(`${BASE_URL}/users/${id}`, { headers: { 'Content-Type': 'application/json' } });
                                if (ures.ok) userObj = await ures.json();
                            }
                        } catch (e) { }
                    }
                } catch (e) { }
            }

            localStorage.setItem('user', JSON.stringify(userObj));
            signInBtn.innerHTML = "Login Successful!";
            setTimeout(() => window.location.href = "index.html", 800);
        } catch (err) {
            console.error("Login error:", err);
            generalError.textContent = "\u26a0\ufe0f Server error. Please try again later.";
        } finally {
            setTimeout(() => { signInBtn.disabled = false; signInBtn.textContent = originalText; }, 1500);
        }
    });
})();
