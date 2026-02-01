const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

// Filter bach n-7iydu smiyat l-tsawer o l-khra (Fix for 300x300)
function isValidCoupon(title) {
    const noise = ['300X300', 'BANNER', 'LOGO', 'IMAGE', 'PNG', 'JPG'];
    return !noise.some(word => title.toUpperCase().includes(word));
}

function extractCode(text) {
    const pattern = /\b([A-Z]{3,}[0-9]+|[0-9]{2,}[A-Z]{2,})[A-Z0-9]*\b/g;
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
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 10000
        };

        const [jumiaRes, rssRes] = await Promise.allSettled([
            axios.get(`https://www.jumia.ma/catalog/?q=${encodeURIComponent(q)}`, config),
            axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://slickdeals.net/newsearch.php?q='+q+'&rss=1')}`)
        ]);

        // Fix Jumia Price Scraping
        let price = "N/A";
        if (jumiaRes.status === 'fulfilled') {
            const html = jumiaRes.value.data;
            // Qelleb 3la price f l-khana l-lowla dial l-products
            const priceMatch = html.match(/class="prc">([0-9,.]+)\s*DH/i) || html.match(/data-price="(\d+)"/);
            price = priceMatch ? priceMatch[1].replace(/[,.]00$/, '') : "N/A";
        }

        // Fix Coupons Scraping (Removing 300x300 noise)
        let coupons = [];
        if (rssRes.status === 'fulfilled') {
            coupons = rssRes.value.data.items
                .filter(item => isValidCoupon(item.title))
                .slice(0, 4)
                .map(item => ({
                    title: item.title.split(' - ')[0], // Nqi l-unwan
                    code: extractCode(item.title + item.content),
                    link: item.link
                }));
        }

        res.json({
            store: "Jumia Morocco",
            price: price,
            coupons: coupons.length > 0 ? coupons : [{title: "Check Deal Page", code: "GETDEAL", link: `https://www.jumia.ma/catalog/?q=${q}`}]
        });

    } catch (error) {
        res.status(500).json({ error: "Server Error", message: error.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => console.log(`Cleaner API live on ${PORT}`));
