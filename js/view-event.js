// Get the event ID from the URL
function getEventIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Fetch and display event details
async function displayEvent() {
    const eventId = getEventIdFromUrl();
    if (!eventId) {
        console.error('No event ID provided');
        return;
    }

    try {
        const response = await fetch(`https://bifs-backend.onrender.com/api/events/${eventId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const event = await response.json();

        // Update the page with event details
        document.getElementById('event-title').textContent = event.title;
        
        // Update the event date
        const eventDate = document.getElementById('event-date');
        if (eventDate && event.created_at) {
            const date = new Date(event.created_at);
            eventDate.textContent = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
        
        // Update the event image using the full image_url
        const eventImage = document.querySelector('.b-img img');
        if (eventImage && event.image_url) {
            eventImage.src = event.image_url;
            eventImage.alt = event.title;
        }

        // Update the event body using the description field which contains HTML
        const eventBody = document.getElementById('event-body');
        if (eventBody && event.description) {
            eventBody.innerHTML = event.description;
        }
    } catch (error) {
        console.error('Error fetching event:', error);
    }
}

// Fetch and display latest posts
async function displayLatestPosts() {
    try {
        // fetch all events (server currently ignores limit query), then filter client-side
        const response = await fetch('https://bifs-backend.onrender.com/api/events');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const events = await response.json();

        const recentContainer = document.querySelector('.r-item');
        if (!recentContainer) return;
        recentContainer.innerHTML = '';

        // only published events
        const published = (events || []).filter(e => e.status === 'published');

        // take up to 4 most recent
        published.slice(0, 4).forEach(event => {
            const timeAgo = getTimeAgo(new Date(event.created_at));
            const html = `
                <div class="items">
                    <div class="r-img">
                        <img src="${event.image_url || 'images/default.avif'}" alt="${escapeHtml(event.title)}">
                    </div>
                    <div class="r-info">
                        <h3><a href="view-event.html?id=${event.id}">${escapeHtml(event.title)}</a></h3>
                        <p class="r-date">${timeAgo}</p>
                    </div>
                </div>
            `;
            recentContainer.innerHTML += html;
        });
    } catch (err) {
        console.error('Error fetching latest posts:', err);
    }
}

// Helper: small HTML escaper to avoid injecting raw titles
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

// Helper function to format time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return diffHours <= 1 ? (diffHours === 1 ? '1 hour ago' : 'Just now') : `${diffHours} hours ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Fetch and display tags with their event counts
async function displayTags() {
    try {
        console.log('Fetching tags...');
        const response = await fetch('https://bifs-backend.onrender.com/api/tags');
        if (!response.ok) {
            console.error('Tags API response not ok:', response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tags = await response.json();
        console.log('Received tags:', tags);

        const tagList = document.getElementById('tag-list');
        if (!tagList) {
            console.error('tag-list element not found');
            return;
        }
        tagList.innerHTML = '';

        // Make sure we have event_count, if not, log error
        if (tags.length > 0 && !('event_count' in tags[0])) {
            console.error('Tags missing event_count property:', tags[0]);
        }

        // Sort tags by count (highest first) and filter out any with 0 events
        const activeTags = tags.filter(tag => (tag.event_count || 0) > 0)
                              .sort((a, b) => (b.event_count || 0) - (a.event_count || 0));

        console.log('Active tags to display:', activeTags);

        activeTags.forEach(tag => {
            const html = `
                <a href="tag.html?tag=${encodeURIComponent(tag.name)}">
                    <li>${escapeHtml(tag.name)} [${tag.event_count || 0}]</li>
                </a>
            `;
            tagList.innerHTML += html;
        });

        if (activeTags.length === 0) {
            tagList.innerHTML = '<li>No active tags found</li>';
        }
    } catch (err) {
        console.error('Error in displayTags:', err);
        const tagList = document.getElementById('tag-list');
        if (tagList) {
            tagList.innerHTML = '<li>Error loading tags</li>';
        }
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    displayEvent();
    displayLatestPosts();
    displayTags();
});
