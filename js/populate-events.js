// populate-events.js
// Fetch published events from the API and render them into the blog page.
(function () {
  const API_BASE = window.__APP?.BASE_URL || 'https://bifs-backend.onrender.com/api';
  const ENDPOINT = API_BASE.replace(/\/+$/, '') + '/events';

  // Set up Intersection Observer for lazy loading images
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.1
  });

  function stripHtml(html) {
    if (!html) return '';
    return String(html).replace(/<[^>]*>/g, '');
  }

  function truncate(text, n = 180) {
    if (!text) return '';
    return text.length > n ? text.slice(0, n).trim() + '...' : text;
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return '' }
  }

  function makeCard(ev) {
    const card = document.createElement('div');
    card.className = 'blog-card';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'blog-img';
    const img = document.createElement('img');
    img.loading = 'lazy'; // Enable native lazy loading
    img.dataset.src = ev.image_url || 'images/blog.png'; // Store actual image URL
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E'; // Tiny placeholder
    img.alt = ev.title || 'event image';
    imgWrap.appendChild(img);

    const details = document.createElement('div');
    details.className = 'blog-details';
    const a = document.createElement('a');
    a.href = `view-event.html?id=${encodeURIComponent(ev.id)}`;
    const h1 = document.createElement('h1');
    h1.textContent = ev.title || 'Untitled';
    a.appendChild(h1);

    const dateP = document.createElement('p');
    dateP.id = 'date';
    dateP.textContent = formatDate(ev.created_at || ev.createdAt || ev.updated_at);

    const bodyP = document.createElement('p');
    bodyP.id = 'body';
    bodyP.textContent = truncate(stripHtml(ev.description || ''), 180);

    details.appendChild(a);
    details.appendChild(dateP);
    details.appendChild(bodyP);

    card.appendChild(imgWrap);
    card.appendChild(details);
    return card;
  }

  async function loadAndRender() {
    const wrapper = document.querySelector('.blog-item');
    if (!wrapper) return;

    // show loading placeholder
    wrapper.innerHTML = '<p style="padding:24px; text-align:center;"></p>';

    try {
      const res = await fetch(ENDPOINT, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to fetch events: ' + res.status);
      const events = await res.json();

      // backend returns all events; filter published
      const publishedAll = Array.isArray(events) ? events.filter(e => String((e.status || '').toLowerCase()) === 'published') : [];

      // If no published events at all, show message and stop
      if (!publishedAll.length) {
        wrapper.innerHTML = '<p style="padding:24px; text-align:center; color:#666;"> </p>';
        return;
      }

      // Sort by date (newest first)
      publishedAll.sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || a.updated_at || 0);
        const dateB = new Date(b.created_at || b.createdAt || b.updated_at || 0);
        return dateB - dateA;
      });

      // Only show 3 latest on the homepage (index). Other pages get full list.
      const path = window.location.pathname || '';
      const isIndex = path === '/' || path.endsWith('/index.html') || path.endsWith('index.html');
      const published = isIndex ? publishedAll.slice(0, 3) : publishedAll;

      // If the page already contains a .blog-card used as a visual template, clone it
      const existingTemplateCard = document.querySelector('.blog-item .blog-card');
      wrapper.innerHTML = '';

      if (existingTemplateCard) {
        // Use template cloning so markup and classes remain identical to your design.
        published.forEach(ev => {
          const cloned = existingTemplateCard.cloneNode(true);

          // fill image if present
          const imgEl = cloned.querySelector('.blog-img img');
          if (imgEl) {
            imgEl.loading = 'lazy'; // Enable native lazy loading
            imgEl.dataset.src = ev.image_url || imgEl.src || 'images/blog.png';
            imgEl.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
          }

          // fill title and link
          const link = cloned.querySelector('.blog-details a');
          const titleEl = cloned.querySelector('.blog-details a h1');
          if (link) link.href = `view-event.html?id=${encodeURIComponent(ev.id)}`;
          if (titleEl) titleEl.textContent = ev.title || 'Untitled';

          // fill date and body (find by id inside clone if present, else fallback to first <p> elements)
          const dateEl = cloned.querySelector('#date') || cloned.querySelector('.blog-details p:nth-of-type(1)');
          const bodyEl = cloned.querySelector('#body') || cloned.querySelector('.blog-details p:nth-of-type(2)');
          if (dateEl) dateEl.textContent = formatDate(ev.created_at || ev.createdAt || ev.updated_at);
          if (bodyEl) bodyEl.textContent = truncate(stripHtml(ev.description || ''), 180);

          // wrap in a blog-item (preserve original nesting) and append
          const itemWrap = document.createElement('div');
          itemWrap.className = 'blog-card';
          itemWrap.appendChild(cloned);
          wrapper.appendChild(itemWrap);
        });
      } else {
        // fallback: generate block cards from scratch
        published.forEach(ev => {
          const card = makeCard(ev);
          const itemWrap = document.createElement('div');
          itemWrap.className = 'blog-card';
          itemWrap.appendChild(card);
          wrapper.appendChild(itemWrap);
        });
      }

      // Observe all images for lazy loading
      wrapper.querySelectorAll('.blog-img img').forEach(img => {
        if (img.dataset.src) {
          imageObserver.observe(img);
        }
      });

    } catch (err) {
      console.error('populate-events error', err);
      wrapper.innerHTML = '<p style="padding:24px; text-align:center; color:red;"></p>';
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') loadAndRender();
  else document.addEventListener('DOMContentLoaded', loadAndRender);
})();
