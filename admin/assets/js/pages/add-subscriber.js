// add-subscriber.js - extracted from add-subscriber.html
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("subscriberForm");
    const emailInput = form.querySelector('input[type="email"]');
    const submitBtn = document.getElementById("submitBtn");
    const spinner = submitBtn.querySelector(".spinner");
    const successAlert = document.getElementById("success");
    const failedAlert = document.getElementById("failed");

    // Hide alerts initially
    successAlert.style.opacity = 0;
    failedAlert.style.opacity = 0;

    const showAlert = (el) => {
        el.style.opacity = 1;
        el.style.top = "20px";
        setTimeout(() => {
            el.style.opacity = 0;
            el.style.top = "30px";
        }, 4000);
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // normalize email to lowercase before sending
        const email = emailInput.value.trim().toLowerCase();
        if (!email) {
            alert("Please enter a valid email");
            return;
        }

        const newSubscriber = {
            email,
            createdAt: new Date().toISOString(),
        };

        try {
            submitBtn.disabled = true;
            spinner.style.display = "inline-block";

            const res = await fetch("https://bifs-backend.onrender.com/api/subscribers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSubscriber),
            });

            const data = await res.json();

            if (res.ok) {
                showAlert(successAlert);
                form.reset();
            } else if (data?.message === "You are already subscribed") {
                failedAlert.querySelector(
                    "[data-notify='message']"
                ).textContent = "You are already subscribed.";
                showAlert(failedAlert);
            } else {
                showAlert(failedAlert);
            }
        } catch (err) {
            console.error("Error adding subscriber:", err);
            showAlert(failedAlert);
        } finally {
            submitBtn.disabled = false;
            spinner.style.display = "none";
        }
    });
});
