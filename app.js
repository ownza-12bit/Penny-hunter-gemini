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

// BrickSeek Deep Link Generator
function checkBrickSeek(store) {
    const sku = document.getElementById("sku-input").value.trim();
    
    if (!sku) {
        alert("Please enter a SKU or UPC first.");
        return;
    }

    let url = "";
    
    // Generate the official BrickSeek deep link
    if (store === 'homedepot') {
        url = `https://brickseek.com/home-depot-inventory-checker/?sku=${sku}`;
    } else if (store === 'lowes') {
        url = `https://brickseek.com/lowes-inventory-checker/?sku=${sku}`;
    }

    // Instantly open the link in a new tab (bypasses all blocks)
    if (url) {
        window.open(url, "_blank");
    }
}
