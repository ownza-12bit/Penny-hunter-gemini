const app = {
    deals: JSON.parse(localStorage.getItem('pennyHunterDeals')) || [],
    currentScan: null,
    videoStream: null,
    
    // Core Navigation
    navigate: (viewId) => {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
    },

    // 1. Scoring Algorithms
    calculatePennyScore: (markdownPct, currentPrice, isVerified) => {
        let score = 0;
        if (markdownPct >= 90) score += 50;
        else if (markdownPct >= 80) score += 30;
        else if (markdownPct >= 70) score += 10;

        const priceStr = currentPrice.toFixed(2);
        if (priceStr.endsWith('.01') || priceStr.endsWith('.02') || priceStr.endsWith('.03') || priceStr.endsWith('.06')) {
            score += 40;
        }
        if (!isVerified) score -= 20; // Penalize unverified predictions
        return Math.max(0, Math.min(score, 100));
    },

    calculateResaleScore: (buyPrice, resalePrice, shippingCost) => {
        if (!resalePrice || resalePrice <= 0) return { score: 0, rating: '🔴 PASS', profit: 0, net: 0, roi: 0 };
        
        // Conservative eBay/Marketplace fee estimate (approx 15%)
        const fees = resalePrice * 0.15;
        const net = resalePrice - fees - shippingCost;
        const profit = net - buyPrice;
        const roi = buyPrice > 0 ? (profit / buyPrice) * 100 : profit * 100;

        let rating = '🔴 PASS';
        let score = 0;

        if (profit >= 15 && roi >= 100) { rating = '🟢 GREAT'; score = 90; }
        else if (profit >= 10 && roi >= 50) { rating = '🟡 GOOD'; score = 70; }
        else if (profit > 0) { rating = '🟠 MAYBE'; score = 40; }

        return { score, rating, profit, net, roi, fees };
    },

    // 2. Deal Entry & Math
    calculateScores: () => {
        const ref = parseFloat(document.getElementById('deal-ref-price').value) || 0;
        const cur = parseFloat(document.getElementById('deal-cur-price').value) || 0;
        const resale = parseFloat(document.getElementById('deal-resale-price').value) || 0;
        const ship = parseFloat(document.getElementById('deal-shipping').value) || 0;
        const verified = document.getElementById('deal-verified').checked;

        const markdown = ref > 0 ? ((ref - cur) / ref) * 100 : 0;
        const pScore = app.calculatePennyScore(markdown, cur, verified);
        const rData = app.calculateResaleScore(cur, resale, ship);

        document.getElementById('live-scores').innerHTML = `
            <p><strong>Markdown:</strong> ${markdown.toFixed(1)}%</p>
            <p><strong>Penny Score:</strong> ${pScore}/100 ${pScore > 80 ? '🔥' : ''}</p>
            <p><strong>Est. Profit:</strong> $${rData.profit.toFixed(2)} (ROI: ${rData.roi.toFixed(0)}%)</p>
            <p><strong>Resale Rating:</strong> ${rData.rating}</p>
            <p style="font-size:10px; color:#aaa;">*Calculated based on USER ENTERED data.</p>
        `;
    },

    // 3. Legal Action Deep Links
    openURL: (type) => {
        const upc = document.getElementById('deal-upc').value;
        if (!upc) return alert("Please enter a SKU/UPC first.");
        
        let url = '';
        if (type === 'hd') url = `https://www.homedepot.com/s/${upc}`;
        if (type === 'lowes') url = `https://www.lowes.com/search?searchTerm=${upc}`;
        if (type === 'ebay') url = `https://www.ebay.com/sch/i.html?_nkw=${upc}&LH_Sold=1&LH_Complete=1`; // Sold listings only
        
        window.open(url, '_blank');
    },

    manualSearch: () => {
        const val = document.getElementById('manual-sku').value;
        if(!val) return;
        app.setupDealForm(val);
    },

    setupDealForm: (upc) => {
        document.getElementById('deal-upc').value = upc;
        document.getElementById('deal-name').value = '';
        document.getElementById('deal-ref-price').value = '';
        document.getElementById('deal-cur-price').value = '';
        document.getElementById('deal-resale-price').value = '';
        document.getElementById('deal-verified').checked = false;
        app.calculateScores();
        app.navigate('view-deal');
    },

    saveDeal: () => {
        const deal = {
            id: Date.now(),
            upc: document.getElementById('deal-upc').value,
            name: document.getElementById('deal-name').value || 'Unknown Product',
            store: document.getElementById('deal-store').value,
            refPrice: parseFloat(document.getElementById('deal-ref-price').value) || 0,
            curPrice: parseFloat(document.getElementById('deal-cur-price').value) || 0,
            resalePrice: parseFloat(document.getElementById('deal-resale-price').value) || 0,
            shipping: parseFloat(document.getElementById('deal-shipping').value) || 0,
            verified: document.getElementById('deal-verified').checked,
            timestamp: new Date().toISOString()
        };

        const markdown = deal.refPrice > 0 ? ((deal.refPrice - deal.curPrice) / deal.refPrice) * 100 : 0;
        deal.markdown = markdown;
        deal.pennyScore = app.calculatePennyScore(markdown, deal.curPrice, deal.verified);
        deal.resale = app.calculateResaleScore(deal.curPrice, deal.resalePrice, deal.shipping);

        app.deals.push(deal);
        localStorage.setItem('pennyHunterDeals', JSON.stringify(app.deals));
        app.showWatchlist();
    },

    // 4. Feed & Display Logic
    showWatchlist: () => {
        app.renderDeals(app.deals, "Your Watchlist");
    },
    
    filterDeals: (filter) => {
        let filtered = [];
        let title = "Results";
        if (filter === 'penny') { filtered = app.deals.filter(d => d.pennyScore >= 80); title = "🪙 Possible Pennies"; }
        else if (filter === 90) { filtered = app.deals.filter(d => d.markdown >= 90); title = "🔥 90%+ OFF"; }
        else if (filter === 80) { filtered = app.deals.filter(d => d.markdown >= 80); title = "💰 80%+ OFF"; }
        else if (filter === 70) { filtered = app.deals.filter(d => d.markdown >= 70); title = "💵 70%+ OFF"; }
        else if (filter === 'homedepot') { filtered = app.deals.filter(d => d.store.includes('Home Depot')); title = "🏪 Home Depot Deals"; }
        else if (filter === 'lowes') { filtered = app.deals.filter(d => d.store.includes("Lowe's")); title = "🔵 Lowe's Deals"; }
        
        app.renderDeals(filtered, title);
    },

    renderDeals: (dealArray, title) => {
        document.getElementById('list-title').innerText = title;
        const container = document.getElementById('deal-list-container');
        container.innerHTML = '';

        if (dealArray.length === 0) {
            container.innerHTML = '<p>No deals found. Go scan something!</p>';
        }

        dealArray.sort((a,b) => b.timestamp - a.timestamp).forEach(deal => {
            const isStale = (Date.now() - new Date(deal.timestamp).getTime()) > (6 * 60 * 60 * 1000); // 6 hours
            const timeStr = new Date(deal.timestamp).toLocaleString();
            
            const card = document.createElement('div');
            card.className = `deal-card ${deal.pennyScore >= 80 ? 'penny' : 'sale'}`;
            card.innerHTML = `
                <h3>
                    ${deal.pennyScore >= 80 ? '🪙 POSSIBLE PENNY' : '🔥 CLEARANCE'}
                    <span>${deal.resale.rating}</span>
                </h3>
                <p><strong>${deal.name}</strong></p>
                <p class="meta">UPC: ${deal.upc} | ${deal.store}</p>
                
                <div class="price-row">
                    <span style="text-decoration: line-through; color: #888;">$${deal.refPrice.toFixed(2)}</span>
                    <span style="color: ${deal.verified ? '#00C851' : '#ffbb33'}">$${deal.curPrice.toFixed(2)}</span>
                </div>
                
                ${!deal.verified ? '<p class="warning">⚠️ PREDICTED — NOT VERIFIED</p>' : '<p class="meta" style="color: #00C851;">✓ VERIFIED PRICE</p>'}
                <p class="meta">Markdown: ${deal.markdown.toFixed(1)}% | Penny Score: ${deal.pennyScore}/100</p>
                <hr style="border-color:#333; margin: 8px 0;">
                <p class="meta"><strong>Resale Estimate:</strong></p>
                <p class="meta">Est. Net Profit: $${deal.resale.profit.toFixed(2)} | ROI: ${deal.resale.roi.toFixed(0)}%</p>
                <p class="meta">Data Source: USER ENTERED / CALCULATED</p>
                <p class="meta">LAST CHECKED: ${timeStr} ${isStale ? '<span class="warning"> (⚠️ STALE)</span>' : ''}</p>
                
                <div class="card-actions">
                    <button onclick="app.setupDealForm('${deal.upc}')">EDIT / UPDATE</button>
                </div>
            `;
            container.appendChild(card);
        });
        app.navigate('view-list');
    },

    // 5. Hardware Barcode Scanner (HTML5)
    startScanner: async () => {
        app.navigate('view-scanner');
        const status = document.getElementById('scanner-status');
        
        if (!('BarcodeDetector' in window)) {
            status.innerText = "Barcode Scanner not natively supported on this browser. Please use Manual entry.";
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            app.videoStream = stream;
            const video = document.getElementById('camera-stream');
            video.srcObject = stream;
            
            const barcodeDetector = new BarcodeDetector({ formats: ['upc_a', 'upc_e', 'ean_13', 'ean_8'] });
            
            status.innerText = "Scanning... Point at barcode.";
            
            const scanLoop = setInterval(async () => {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    try {
                        const barcodes = await barcodeDetector.detect(video);
                        if (barcodes.length > 0) {
                            clearInterval(scanLoop);
                            app.stopScanner();
                            app.setupDealForm(barcodes[0].rawValue);
                        }
                    } catch (e) {
                        // ignore frame errors
                    }
                }
            }, 500);
            
            app.currentScan = scanLoop;
            
        } catch (err) {
            status.innerText = "Camera access denied or unavailable.";
        }
    },

    stopScanner: () => {
        if (app.currentScan) clearInterval(app.currentScan);
        if (app.videoStream) app.videoStream.getTracks().forEach(track => track.stop());
        app.navigate('view-home');
    }
};

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(() => console.log('SW Registered'));
    });
}
