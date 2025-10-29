// dashboard.js - extracted from dashboard.html
document.addEventListener("DOMContentLoaded", async () => {
    const apiBase = "https://bifs-backend.onrender.com/api";

    const endpoints = [
        { url: `${apiBase}/events`, selector: '.count-box:nth-of-type(1) h3' },
        { url: `${apiBase}/users`, selector: '.count-box:nth-of-type(2) h3' },
        { url: `${apiBase}/subscribers`, selector: '.count-box:nth-of-type(3) h3' }
    ];

    // include auth token when available (admin dashboard should use authenticated requests)
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    for (const { url, selector } of endpoints) {
        try {
            const res = await fetch(url, { headers });
            if (!res.ok) {
                // Log status and response body for easier debugging
                let body = '';
                try { body = await res.text(); } catch (e) {}
                throw new Error(`Failed to load ${url} (status=${res.status}) ${body}`);
            }
            const data = await res.json();
            document.querySelector(selector).textContent = data.length;
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            document.querySelector(selector).textContent = "\u2014";
        }
    }
});
