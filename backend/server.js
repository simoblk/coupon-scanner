const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// 1. Enable CORS for GitHub Pages connectivity
app.use(cors());

// 2. Smart Coupon Extractor Logic
function extractCode(text) {
    const pattern = /\b([A-Z]{2,}[0-9]+|[0-9]{2,}[A-Z]+)[A-Z0-9]*\b/g;
    const matches = text.toUpperCase().match(pattern);
    return matches ? matches[0] : "DEAL";
}

app.get('/api/search', async (req, res) => {
    const q = req.query.q;
    
    if (!q) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    try {
        // 3. Professional Headers bach Jumia may-blokich l-server (Fix for Error 500)
        const config = { 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            },
            timeout: 8000 // 8 seconds timeout
        };

        // 4. Promise.allSettled: Bach ila fchlat Jumia, l-coupons i-t-l3ou (o l-3aks)
        const [jumiaRes, rssRes] = await Promise.allSettled([
            axios.get(`https://www.jumia.ma/catalog/?q=${encodeURIComponent(q)}`, config),
            axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://slickdeals.net/newsearch.php?q='+q+'&rss=1')}`)
        ]);

        // Extract Price from Jumia (if success)
        let price = "N/A";
        if (jumiaRes.status === 'fulfilled') {
            const match = jumiaRes.value.data.match(/data-price="(\d+)"/);
            price = match ? match[1] : "N/A";
        }

        // Extract Coupons from RSS (if success)
        let coupons = [];
        if (rssRes.status === 'fulfilled') {
            coupons = rssRes.value.data.items.slice(0, 3).map(item => ({
                title: item.title,
                code: extractCode(item.title + item.content),
                link: item.link
            }));
        }

        // 5. Final Response
        res.json({
            store: "Jumia Morocco",
            price: price,
            coupons: coupons,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Critical Server Error:", error.message);
        res.status(500).json({ 
            error: "Internal Server Error", 
            message: error.message 
        });
    }
});

// 6. Dynamic Port for Koyeb/Render/Local
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running 100% on port ${PORT}`);
});
