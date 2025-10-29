(function roleGuard() {
  // Resolve various shapes for stored user: raw object, JSON string, {user}, {data}
  function resolveUser(raw) {
    if (!raw) return null;
    let obj = raw;
    if (typeof raw === 'string') {
      try { obj = JSON.parse(raw); } catch (e) { return null; }
    }
    if (!obj) return null;
    if (obj.user && typeof obj.user === 'object') return obj.user;
    if (obj.data && typeof obj.data === 'object') return obj.data;
    return obj;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.toLowerCase();

    const rawStored = window.__APP?.userData || localStorage.getItem('user');
    const user = resolveUser(rawStored);
    const role = user?.role?.toLowerCase();

    const isAdmin = ['admin', 'administrator'].includes(role);
    const isObserver = role === 'observer';

    // === MODAL CREATION ===
    function showAccessDeniedModal() {
      // Use shared ConfirmModal for consistent look and behavior
      ConfirmModal.show({
        title: 'Access denied',
        message: '<p>Administrator access only.</p>',
        singleButton: true,
        iconClass: 'fa fa-lock',
        confirmText: 'OK',
        cancelText: '',
        confirmClass: 'btn-cancel', // OK button color (#24447b)
        cancelClass: 'btn-cancel'
      }).then(() => {
        // nothing else required; modal closes itself
      }).catch(err => {
        console.error('Access denied modal error', err);
      });
    }

    // === HARD REDIRECT PROTECTION (Direct URL entry) ===
    if (isObserver) {
      if (
        path.includes('edit-user.html') ||
        path.includes('edit-event.html') ||
        path.includes('add-user.html')
      ) {
        // If the observer *manually types the URL*, show modal briefly then redirect
        document.body.innerHTML = ''; // Clear content to avoid showing form
        showAccessDeniedModal();
        setTimeout(() => location.replace('/admin/pages/dashboard.html'), 2000);
        return;
      }
    }

    // === INTERCEPT LINK CLICKS BEFORE NAVIGATION ===
    if (isObserver) {
      document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href').toLowerCase();
        if (
          href.includes('edit-user.html') ||
          href.includes('edit-event.html') ||
          href.includes('add-user.html')
        ) {
          link.addEventListener('click', e => {
            e.preventDefault();
            e.stopImmediatePropagation(); // stop the browser from going anywhere
            showAccessDeniedModal();
          });
        }
      });
    }

    // === BUTTON / ACTION RESTRICTIONS ===
    if (isObserver) {
      // Helper that applies observer restrictions to any root element
      function applyObserverRestrictions(root = document) {
        // Disable Delete buttons (apply exact attributes/props requested)
        root.querySelectorAll('.btn-delete').forEach(btn => {
          try {
            // set both property and attribute
            try { btn.disabled = true; } catch (e) {}
            try { btn.setAttribute('disabled', ''); } catch (e) {}
            try { btn.setAttribute('aria-disabled', 'true'); } catch (e) {}
            btn.classList.add('disabled');
            btn.title = 'Not allowed for Observer';
            btn.style.opacity = '0.5';
            btn.style.pointerEvents = 'none';
            // prevent future click handlers from firing
            btn.addEventListener('click', e => e.preventDefault(), { capture: true });
          } catch (e) { /* ignore elements that may be detached */ }
        });

        // Disable Edit buttons (apply same attributes; anchors are neutralized)
        root.querySelectorAll('.btn-edit').forEach(btn => {
          try {
            btn.classList.add('disabled');
            btn.title = 'Not allowed for Observer';
            try { btn.setAttribute('aria-disabled', 'true'); } catch (e) {}
            try { btn.setAttribute('disabled', ''); } catch (e) {}
            btn.style.opacity = '0.5';
            btn.style.pointerEvents = 'none';

            // If this is an anchor, remove navigation and make unfocusable
            if (btn.tagName && btn.tagName.toLowerCase() === 'a') {
              try {
                btn.dataset._origHref = btn.getAttribute('href') || '';
                btn.removeAttribute('href');
                btn.setAttribute('tabindex', '-1');
                btn.style.cursor = 'default';
              } catch (e) { /* ignore */ }
            } else {
              try { btn.disabled = true; } catch (e) { /* ignore */ }
            }

            // Prevent any click handlers as an extra safeguard
            btn.addEventListener('click', e => {
              e.preventDefault();
              e.stopImmediatePropagation();
            }, { capture: true });
          } catch (e) { /* ignore */ }
        });
      }

      // Apply immediately to any existing elements
      applyObserverRestrictions(document);

      // Observe DOM for dynamically added buttons (e.g., tables populated after fetch)
      const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
          if (!m.addedNodes || m.addedNodes.length === 0) continue;
          m.addedNodes.forEach(node => {
            if (!(node instanceof Element)) return;
            // If a container row or button was added, re-apply restrictions within it
            if (node.matches && (node.matches('.btn-delete') || node.matches('.btn-edit'))) {
              applyObserverRestrictions(node.parentElement || node);
            } else {
              applyObserverRestrictions(node);
            }
          });
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // On Users page: disable the Add button for Observers rather than hiding it
      if (path.includes('users.html')) {
        const addBtn = document.querySelector('.btn-add');
        if (addBtn) {
          try {
            addBtn.classList.add('disabled');
            addBtn.title = 'Not allowed for Observer';
            addBtn.style.opacity = '0.5';
            addBtn.style.pointerEvents = 'none';
            addBtn.setAttribute('aria-disabled', 'true');
            // If it's an anchor, neutralize navigation
            if (addBtn.tagName && addBtn.tagName.toLowerCase() === 'a') {
              addBtn.dataset._origHref = addBtn.getAttribute('href') || '';
              addBtn.removeAttribute('href');
              addBtn.setAttribute('tabindex', '-1');
            } else {
              // If the button contains an <a> inside (existing markup), neutralize that link
              const innerA = addBtn.querySelector && addBtn.querySelector('a');
              if (innerA) {
                innerA.dataset._origHref = innerA.getAttribute('href') || '';
                innerA.removeAttribute('href');
                innerA.setAttribute('tabindex', '-1');
              }
              try { addBtn.disabled = true; addBtn.setAttribute('disabled', ''); } catch (e) {}
            }
          } catch (e) { /* ignore */ }
        }
      }
    }
  });
})();
