// ...new file...
/*
  UI + auth helpers moved out of adminTemplate.js.
  Exposes: initUI(), verifyAuth(), forceLogout(), logout()
*/
(function () {
  const BASE_URL = window.__APP?.BASE_URL || "https://bifs-backend.onrender.com/api";

  function resolveUserObject(raw) {
    if (!raw) return null;
    let obj = raw;
    if (typeof raw === 'string') {
      try { obj = JSON.parse(raw); } catch (e) { obj = null; }
    }
    if (!obj) return null;
    if (obj.user && typeof obj.user === 'object') return obj.user;
    if (obj.data && typeof obj.data === 'object') return obj.data;
    return obj;
  }

  function getCandidateName(user) {
    if (!user) return null;
    if (user.name) return user.name;
    if (user.fullName) return user.fullName;
    if (user.username) return user.username;
    if (user.displayName) return user.displayName;
    const token = window.__APP?.token || localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.name || payload.email || null;
      } catch (e) { /* ignore */ }
    }
    return null;
  }

  function getUserIdFromStoredOrToken() {
    const raw = window.__APP?.userData || localStorage.getItem('user');
    const user = resolveUserObject(raw);
    if (user && user.id) return user.id;
    const token = window.__APP?.token || localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || payload.sub || null;
    } catch (e) { return null; }
  }

  async function fetchFullUserAndCache() {
    const token = window.__APP?.token || localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetch(`${BASE_URL}/auth/validate`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const u = data.user || data;
          if (u && u.id) {
            try {
              const rawStored = localStorage.getItem('user');
              const stored = rawStored ? JSON.parse(rawStored) : {};
              const merged = Object.assign({}, stored, u);
              localStorage.setItem('user', JSON.stringify(merged));
              window.__APP = window.__APP || {};
              window.__APP.userData = merged;
              return merged;
            } catch (e) { /* ignore */ }
          }
        }
      } catch (e) { /* ignore */ }
    }

    const id = getUserIdFromStoredOrToken();
    if (!id) return null;
    try {
      const res2 = await fetch(`${BASE_URL}/users/${id}`, { headers: { 'Content-Type': 'application/json' }});
      if (res2.ok) {
        const u2 = await res2.json();
        try {
          const rawStored = localStorage.getItem('user');
          const stored = rawStored ? JSON.parse(rawStored) : {};
          const merged = Object.assign({}, stored, u2);
          localStorage.setItem('user', JSON.stringify(merged));
          window.__APP = window.__APP || {};
          window.__APP.userData = merged;
          return merged;
        } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  async function updateNavbarUserOnceAsync() {
    const raw = window.__APP?.userData || localStorage.getItem('user');
    const user = resolveUserObject(raw);
    let name = getCandidateName(user);

    if (!name) {
      const fetched = await fetchFullUserAndCache();
      if (fetched) name = getCandidateName(fetched);
    }

    const navbarUser = document.getElementById("navbarUserName");
    if (navbarUser && name) {
      navbarUser.textContent = name;
      return true;
    }
    return false;
  }

  // initUI toggles auth link visibility and ensures navbar user is updated
  async function initUI() {
    const userDataRaw = window.__APP?.userData || localStorage.getItem('user');
    const userObj = resolveUserObject(userDataRaw);
    const hasAuth = Boolean(userObj && (window.__APP?.token || localStorage.getItem('token')));

    const loginLinks = document.querySelectorAll(".show-if-logged-out");
    const authLinks = document.querySelectorAll(".show-if-logged-in");
    if (hasAuth) {
      loginLinks.forEach(el => el.style.display = "none");
      authLinks.forEach(el => el.style.display = "");
    } else {
      loginLinks.forEach(el => el.style.display = "");
      authLinks.forEach(el => el.style.display = "none");
    }

    // try immediate synchronous update first, then retry a few times
    if (await updateNavbarUserOnceAsync()) return;
    let attempts = 0;
    const maxAttempts = 6;
    const interval = setInterval(async () => {
      attempts++;
      if (await updateNavbarUserOnceAsync() || attempts >= maxAttempts) clearInterval(interval);
    }, 300);
  }

  async function verifyAuth() {
    const token = window.__APP?.token;
    const userData = window.__APP?.userData;
    if (!token || !userData) return { ok: false, reason: "missing_token_or_user" };
    try {
      const res = await fetch(`${BASE_URL}/auth/validate`, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (!res.ok) return { ok: false, status: res.status };
      const navbarUser = document.getElementById("navbarUserName");
      if (navbarUser && userData.name) {
        navbarUser.textContent = userData.name;
      }
      return { ok: true };
    } catch (error) {
      console.error("Auth validation error:", error);
      return { ok: false, error };
    }
  }

  function forceLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "../../admin/sign-in.html";
  }
  function logout() { forceLogout(); }

  // expose functions for pages
  window.initUI = initUI;
  window.verifyAuth = verifyAuth;
  window.forceLogout = forceLogout;
  window.logout = logout;

})();