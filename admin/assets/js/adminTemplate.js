// Initialize app state and UI (no template injection)
(async function initializeApp() {
  console.log('Initializing app...');
  
  // safe parse user JSON
  let token = localStorage.getItem("token");
  let userData = null;
  try {
    const raw = localStorage.getItem("user");
    console.log('Raw user data from localStorage:', raw);
    userData = raw ? JSON.parse(raw) : null;
    console.log('Parsed user data:', userData);
    
    // Immediately try to update navbar with user name
    if (userData && userData.name) {
      console.log('Found user name:', userData.name);
      const navbarUsers = document.querySelectorAll("#navbarUserName");
      console.log('Found navbar elements:', navbarUsers.length);
      
      navbarUsers.forEach(navbarUser => {
        const span = navbarUser.querySelector('span.no-icon');
        if (span) {
          span.textContent = userData.name;
          console.log('Updated navbar text to:', userData.name);
        } else {
          console.log('No span element found in:', navbarUser.outerHTML);
        }
      });
    } else {
      console.log('No user name found in data');
    }
  } catch (e) {
    console.warn("Invalid user data in localStorage:", e);
    localStorage.removeItem("user");
  }

  window.__APP = window.__APP || {};
  window.__APP.BASE_URL = window.__APP.BASE_URL || "https://bifs-backend.onrender.com/api";
  window.__APP.token = token;
  window.__APP.userData = userData;

  try {
    // initialize UI visibility and inactivity detection
    if (typeof initUI === 'function') initUI();

    // attempt to update navbar display if the element exists on the page
    await updateNavbarUserOnceAsync();

    // enforce auth on load: if token missing or invalid/expired, sign the user out
    try {
      const verifyResult = await verifyAuth();
      if (!verifyResult.ok && (verifyResult.status === 401 || verifyResult.reason === 'missing_token_or_user')) {
        console.info('Auth verification failed on load, forcing logout.', verifyResult);
        forceLogout();
        return; // stop further initialization
      }
    } catch (e) {
      // verification failure shouldn't break page load; keep existing UI for offline debugging
      console.warn('Error while verifying auth on load (ignored):', e);
    }
  } catch (e) { /* ignore */ }
})();

// Inactivity tracking
let inactivityTimeout;
const INACTIVITY_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

function resetInactivityTimer() {
    if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
    }
    inactivityTimeout = setTimeout(() => {
        console.log('User inactive for 30 minutes, logging out');
        forceLogout();
    }, INACTIVITY_TIMEOUT);
}

function setupInactivityDetection() {
    // Reset timer on any user activity
    ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(eventName => {
        document.addEventListener(eventName, resetInactivityTimer, true);
    });
    
    // Initial setup
    resetInactivityTimer();
}

const BASE_URL = window.__APP?.BASE_URL || "https://bifs-backend.onrender.com/api";

// Populate navbar placeholders and auth link visibility (no redirects)
function initUI() {
    // Set up inactivity detection if user is logged in
    if (window.__APP?.token || localStorage.getItem('token')) {
        setupInactivityDetection();
    }
  // set auth links visibility as before
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

  // try immediate synchronous update first
  (async () => {
    if (await updateNavbarUserOnceAsync()) return;
    // retry a couple more times in case navbar is injected later
    let attempts = 0;
    const maxAttempts = 6;
    const interval = setInterval(async () => {
      attempts++;
      if (await updateNavbarUserOnceAsync() || attempts >= maxAttempts) clearInterval(interval);
    }, 300);
  })();
}

// keep verifyAuth available but do NOT call it automatically
async function verifyAuth() {
  const token = window.__APP?.token;
  const userData = window.__APP?.userData;

  if (!token || !userData) {
    // don't force logout here — caller may choose to handle missing auth
    return { ok: false, reason: "missing_token_or_user" };
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/validate`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      return { ok: false, status: res.status };
    }

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

// Function to log out + redirect (still available for sign-out UI)
function forceLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../../admin/sign-in.html";
}

// simple alias for UI logout buttons
function logout() { forceLogout(); }

function resolveUserObject(raw) {
  console.log('Resolving user object from:', raw);
  if (!raw) {
    console.log('No raw data provided');
    return null;
  }
  let obj = raw;
  if (typeof raw === 'string') {
    try { 
      obj = JSON.parse(raw);
      console.log('Parsed string data:', obj);
    } catch (e) { 
      console.log('Failed to parse string data:', e);
      obj = null; 
    }
  }
  if (!obj) {
    console.log('No valid object after parsing');
    return null;
  }
  if (obj.user && typeof obj.user === 'object') {
    console.log('Found user object in .user property:', obj.user);
    return obj.user;
  }
  if (obj.data && typeof obj.data === 'object') {
    console.log('Found user object in .data property:', obj.data);
    return obj.data;
  }
  console.log('Using raw object as user data:', obj);
  return obj;
}

function getCandidateName(user) {
  if (!user) return null;
  if (user.name) return user.name;
  if (user.fullName) return user.fullName;
  if (user.username) return user.username;
  // do not prefer email as "name" unless nothing else — keep for fallback
  if (user.displayName) return user.displayName;
  // token fallback (prefer payload.name then payload.email)
  const token = window.__APP?.token || localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.name || payload.email || null;
    } catch (e) { /* ignore malformed token */ }
  }
  return null;
}

function getUserIdFromStoredOrToken() {
  // try stored user id first
  const raw = window.__APP?.userData || localStorage.getItem('user');
  const user = resolveUserObject(raw);
  if (user && user.id) return user.id;
  // fallback to token payload
  const token = window.__APP?.token || localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || payload.sub || null;
  } catch (e) { return null; }
}

async function fetchFullUserAndCache() {
  const token = window.__APP?.token || localStorage.getItem('token');
  // prefer auth/validate which should return the authenticated user
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
          // merge into localStorage user
          try {
            const rawStored = localStorage.getItem('user');
            const stored = rawStored ? JSON.parse(rawStored) : {};
            const merged = Object.assign({}, stored, u);
            localStorage.setItem('user', JSON.stringify(merged));
            window.__APP = window.__APP || {};
            window.__APP.userData = merged;
            return merged;
          } catch (e) { /* ignore storage errors */ }
        }
      }
    } catch (e) { /* ignore */ }
  }

  // fallback: try GET /users/:id
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
  // First try to get user data from memory/localStorage
  const raw = window.__APP?.userData || localStorage.getItem('user');
  let user;
  
  try {
    user = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    console.error('Failed to parse user data:', e);
    return false;
  }
  
  // If we have a user object with a name, use it immediately
  if (user && user.name) {
    const navbarUsers = document.querySelectorAll("#navbarUserName");
    navbarUsers.forEach(navbarUser => {
      const span = navbarUser.querySelector('span.no-icon') || navbarUser;
      span.textContent = user.name;
    });
    return true;
  }

  // If no valid user data, try to get it from the token
  if (!user || !user.name) {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Try to extract user info from the JWT token
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          user = {
            id: payload.id,
            name: payload.name || 'Admin User', // Fallback name if not in token
            email: payload.email,
            role: payload.role
          };
          // Save this info for future use
          localStorage.setItem('user', JSON.stringify(user));
          window.__APP = window.__APP || {};
          window.__APP.userData = user;
          
          // Update the UI
          const navbarUsers = document.querySelectorAll("#navbarUserName");
          navbarUsers.forEach(navbarUser => {
            const span = navbarUser.querySelector('span.no-icon') || navbarUser;
            span.textContent = user.name;
          });
          return true;
        }
      } catch (e) {
        console.error('Error parsing token:', e);
      }
      
      // Only try to fetch from server if we couldn't get info from token
      try {
        const response = await fetch(`${BASE_URL}/auth/validate`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user?.name) {
            name = data.user.name;
            // Update localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            window.__APP = window.__APP || {};
            window.__APP.userData = data.user;
          }
        } else if (response.status === 401) {
          // Token expired or invalid
          forceLogout();
          return false;
        }
      } catch (error) {
        console.warn('Failed to fetch user data:', error);
      }
    }
  }

  // Update all instances of navbarUserName
  const navbarUsers = document.querySelectorAll("#navbarUserName");
  console.log('Found navbar elements in update function:', navbarUsers.length);
  if (navbarUsers.length > 0 && name) {
    navbarUsers.forEach(navbarUser => {
      const span = navbarUser.querySelector('span.no-icon');
      if (span) {
        console.log('Updating span with name:', name);
        span.textContent = name;
      } else {
        console.log('No span found in navbar element:', navbarUser.outerHTML);
        // Try to create the structure if it doesn't exist
        navbarUser.innerHTML = `
          <i class="nc-icon nc-single-02"></i>
          <span class="no-icon">${name}</span>
        `;
      }
    });
    return true;
  }
  return false;
}