const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

function extractCode(text) {
    const pattern = /\b([A-Z]{3,}[0-9]+|[0-9]{2,}[A-Z]{2,}|[A-Z0-9]{5,})\b/g;
    const matches = text.toUpperCase().match(pattern);
    return matches ? matches[0] : "PROMO";
}

app.get('/api/search', async (req, res) => {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Query required" });

    try {
        // 1. "Stealth Headers" - Ghadin n-banou b7al ila 7na App dial Jumia f iPhone
        const config = { 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'fr-MA,fr;q=0.9',
                'Referer': 'https://www.jumia.ma/',
                'Cache-Control': 'no-cache'
            },
            timeout: 10000
        };

        const [jumiaRes, rssRes] = await Promise.allSettled([
            axios.get(`https://www.jumia.ma/catalog/?q=${encodeURIComponent(q)}`, config),
            axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://slickdeals.net/newsearch.php?q='+q+'&rss=1')}`)
        ]);

        let price = "N/A";
        if (jumiaRes.status === 'fulfilled') {
            const html = jumiaRes.value.data;
            
            // 2. Multi-Layer Extraction (Searching for Price in all possible tags)
            // Pattern 1: Standard Jumia Price Class
            const p1 = html.match(/class="prc">([0-9\s,.]+)\s*(?:DH|MAD)/i);
            // Pattern 2: Script Data (JSON)
            const p2 = html.match(/"price":"(\d+)"/);
            // Pattern 3: Meta Tag (SEO)
            const p3 = html.match(/property="product:price:amount" content="(\d+)"/);
            // Pattern 4: Data Attribute
            const p4 = html.match(/data-price="(\d+)"/);

            if (p1) price = p1[1].trim().replace(/\s/g, '');
            else if (p2) price = p2[1];
            else if (p3) price = p3[1];
            else if (p4) price = p4[1];
        }

        let coupons = [];
        if (rssRes.status === 'fulfilled' && rssRes.value.data.items) {
            coupons = rssRes.value.data.items
                .filter(item => !item.title.toUpperCase().includes('300X300'))
                .slice(0, 4)
                .map(item => ({
                    title: item.title.substring(0, 50),
                    code: extractCode(item.title + item.content),
                    link: item.link
                }));
        }

        // 3. Smart Fallback: Ila l-taman bqa N/A, n-jawbo b "Click to view" link
        res.json({
            store: "Jumia Morocco",
            price: price !== "N/A" ? `${price}` : "View Deals", 
            coupons: coupons.length > 0 ? coupons : [{title: "Check Live Coupons", code: "SAVE20", link: `https://www.jumia.ma/catalog/?q=${q}`}]
        });

    } catch (error) {
        console.error("Scrape Error:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => console.log(`Stealth API live on ${PORT}`));
