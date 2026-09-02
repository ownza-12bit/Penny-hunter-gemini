// ==========================================
// 1. AUTO-UPDATING SERVICE WORKER REGISTRATION
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Make sure this matches the name of your service worker file!
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registered successfully');
                // Force check for updates while the app is open
                registration.update();
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// ==========================================
// 2. REDDIT DEAL FINDER LOGIC
// ==========================================
async function fetchCommunityDeals() {
    const intelList = document.getElementById("community-intel-list");
    
    // Give immediate visual feedback that the button was tapped
    intelList.innerHTML = "<p>Scanning Reddit for deals... 📡</p>";

    try {
        // Bypass Reddit's block using a free proxy
        const targetUrl = 'https://www.reddit.com/r/HomeDepot/search.json?q=clearance+OR+penny&restrict_sr=on&sort=new';
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(targetUrl);

        const response = await fetch(proxyUrl);
        
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();
        intelList.innerHTML = ""; // Clear loading message

        const posts = data.data.children;
        if (posts.length === 0) {
            intelList.innerHTML = "<p>No recent intel found.</p>";
            return;
        }

        // Display the top 5 posts
        posts.slice(0, 5).forEach(post => {
            const postData = post.data;
            intelList.innerHTML += `
                <div style="border-bottom: 1px solid #ccc; padding: 10px 0; margin-bottom: 10px;">
                    <strong>${postData.title}</strong><br>
                    <a href="https://www.reddit.com${postData.permalink}" target="_blank">Read more</a>
                </div>
            `;
        });

    } catch (error) {
        // Force the error to show up ON the phone screen
        intelList.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
        alert("Debug info: " + error.message); 
    }
}
