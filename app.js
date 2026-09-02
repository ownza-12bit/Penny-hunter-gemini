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

// Multi-Proxy Live Deal Scanner
async function fetchCommunityDeals() {
    const intelList = document.getElementById("community-intel-list");
    intelList.innerHTML = '<p class="status-msg">Scanning Reddit for deals... 📡</p>';

    const targetUrl = 'https://www.reddit.com/r/HomeDepot/search.json?q=clearance+OR+penny&restrict_sr=on&sort=new';
    
    // Tries 3 separate backup servers automatically so fetching never crashes
    const proxies = [
        'https://api.allorigins.win/raw?url=',
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://corsproxy.io/?'
    ];

    let data = null;
    let lastError = "";

    for (let proxy of proxies) {
        try {
            const response = await fetch(proxy + encodeURIComponent(targetUrl));
            if (!response.ok) continue;
            
            const rawText = await response.text();
            data = JSON.parse(rawText);
            if (data && data.data && data.data.children) {
                break; // Connection succeeded! Exit the loop
            }
        } catch (err) {
            lastError = err.message;
        }
    }

    if (!data || !data.data || !data.data.children) {
        intelList.innerHTML = `<p style="color:#d9534f; text-align:center;">Unable to reach Reddit feed right now. Please tap scan again.<br><small style="color:#888;">(${lastError || 'Network timeout'})</small></p>`;
        return;
    }

    const posts = data.data.children;
    if (posts.length === 0) {
        intelList.innerHTML = '<p class="status-msg">No recent deal posts found.</p>';
        return;
    }

    let html = '';
    posts.slice(0, 5).forEach(post => {
        const p = post.data;
        const cleanTitle = p.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        html += `
            <div class="deal-item">
                <div class="deal-title">${cleanTitle}</div>
                <a class="deal-link" href="https://www.reddit.com${p.permalink}" target="_blank" rel="noopener">View post on Reddit →</a>
            </div>
        `;
    });

    intelList.innerHTML = html;
}
