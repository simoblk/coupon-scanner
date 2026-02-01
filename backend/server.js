const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

// Filter noise from coupon codes
function isValidCoupon(title) {
    const noise = ['300X300', 'BANNER', 'LOGO', 'IMAGE', 'PNG', 'JPG', 'PDF'];
    return !noise.some(word => title.toUpperCase().includes(word));
}

// Extract clean codes
function extractCode(text) {
    const pattern = /\b([A-Z]{3,}[0-9]+|[0-9]{2,}[A-Z]{2,}|[A-Z0-9]{5,})\b/g;
    const matches = text.toUpperCase().match(pattern);
    return matches ? matches[0] : "PROMO";
}

app.get('/api/search', async (req, res) => {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Query required" });

    try {
        const config = { 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            timeout: 12000
        };

        const [jumiaRes, rssRes] = await Promise.allSettled([
            axios.get(`https://www.jumia.ma/catalog/?q=${encodeURIComponent(q)}`, config),
            axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://slickdeals.net/newsearch.php?q='+q+'&rss=1')}`)
        ]);

        // --- NEW JUMIA PRICE EXTRACTION LOGIC ---
        let price = "N/A";
        if (jumiaRes.status === 'fulfilled') {
            const html = jumiaRes.value.data;
            
            // Method 1: Target the price attribute in product cards
            const matchAttr = html.match(/data-price="(\d+)"/);
            
            // Method 2: Target the visible price class with MAD/DH
            const matchClass = html.match(/class="prc">([0-9,.\s]+)(?:DH|MAD)/i);
            
            // Method 3: Look into JSON-LD scripts (Most Reliable)
            const matchJSON = html.match(/"price":"(\d+)"/);

            if (matchAttr) price = matchAttr[1];
            else if (matchJSON) price = matchJSON[1];
            else if (matchClass) price = matchClass[1].trim().replace(/\s/g, '');
        }

        // --- CLEAN COUPONS LOGIC ---
        let coupons = [];
        if (rssRes.status === 'fulfilled' && rssRes.value.data.items) {
            coupons = rssRes.value.data.items
                .filter(item => isValidCoupon(item.title))
                .slice(0, 4)
                .map(item => ({
                    title: item.title.split(' - ')[0].substring(0, 50),
                    code: extractCode(item.title + item.content),
                    link: item.link
                }));
        }

        res.json({
            store: "Jumia Morocco",
            price: price !== "N/A" ? `${price}` : "N/A",
            coupons: coupons.length > 0 ? coupons : [{title: "Check Live Deals", code: "GETDEAL", link: `https://www.jumia.ma/catalog/?q=${q}`}]
        });

    } catch (error) {
        res.status(500).json({ error: "Server Error", message: error.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => console.log(`Deep Scraper live on ${PORT}`));
