// Get the tag name from the URL
function getTagFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tag');
}

// Fetch and display events for the selected tag
async function displayTagEvents() {
    const tag = getTagFromUrl();
    if (!tag) {
        console.error('No tag provided');
        return;
    }

    try {
        // Update page title with the tag name
        const tagTitle = document.getElementById('tagName');
        if (tagTitle) {
            tagTitle.textContent = `${tag}`;
        }

        // Fetch events for this tag
        const response = await fetch(`https://bifs-backend.onrender.com/api/events?tag=${encodeURIComponent(tag)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const events = await response.json();

        // Filter to only published events
        const publishedEvents = events.filter(event => event.status === 'published');

        const blogItem = document.querySelector('.blog-item');
        if (!blogItem) return;
        blogItem.innerHTML = '';

        if (publishedEvents.length === 0) {
            blogItem.innerHTML = '<p>No published events found for this tag.</p>';
            return;
        }

        // Display each event
        publishedEvents.forEach(event => {
            const date = new Date(event.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const eventHtml = `
                <div class="blog-card">
                    <div class="blog-img">
                        <img src="${event.image_url || 'images/default.avif'}" alt="${escapeHtml(event.title)}">
                    </div>
                    <div class="blog-details">
                        <a href="view-event.html?id=${event.id}">
                            <h1>${escapeHtml(event.title)}</h1>
                        </a>
                        <p class="date">${date}</p>
                        <p class="excerpt">${getExcerpt(event.description)}</p>
                    </div>
                </div>
            `;
            blogItem.innerHTML += eventHtml;
        });

    } catch (err) {
        console.error('Error fetching events for tag:', err);
    }
}

// Helper: Get a short excerpt from the HTML description
function getExcerpt(html, maxLength = 150) {
    if (!html) return '';
    // Remove HTML tags and get plain text
    const text = html.replace(/<[^>]+>/g, '');
    if (text.length <= maxLength) return text;
    // Truncate at word boundary
    return text.substr(0, text.lastIndexOf(' ', maxLength)) + '...';
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (s) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[s];
    });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', displayTagEvents);