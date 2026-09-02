// Auto-Updating Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registered');
                registration.update();
            })
            .catch(err => console.log('ServiceWorker failed', err));
    });
}

// Live Deal Scanner via RSS Backdoor
async function fetchCommunityDeals() {
    const intelList = document.getElementById("community-intel-list");
    intelList.innerHTML = '<p class="status-msg">Scanning Reddit (via RSS)... 📡</p>';

    // Use Reddit's public RSS feed instead of the blocked JSON API
    const redditRssUrl = 'https://www.reddit.com/r/HomeDepot/search.rss?q=clearance+OR+penny&restrict_sr=on&sort=new';
    
    // Use a dedicated RSS converter that Reddit allows through
    const fetchUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(redditRssUrl);

    try {
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error("Network blocked the request");
        
        const data = await response.json();
        
        // Check if data came back empty
        if (data.status !== 'ok' || !data.items || data.items.length === 0) {
            intelList.innerHTML = '<p class="status-msg">No recent deal posts found.</p>';
            return;
        }

        let html = '';
        // Display the top 5 posts
        data.items.slice(0, 5).forEach(post => {
            // Clean the text so weird symbols don't break the app
            const cleanTitle = post.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            html += `
                <div class="deal-item">
                    <div class="deal-title">${cleanTitle}</div>
                    <a class="deal-link" href="${post.link}" target="_blank" rel="noopener">View post on Reddit →</a>
                </div>
            `;
        });

        intelList.innerHTML = html;

    } catch (err) {
        intelList.innerHTML = `<p style="color:#d9534f; text-align:center;">Feed failed to load. Please try again.<br><small style="color:#888;">(${err.message})</small></p>`;
    }
}
