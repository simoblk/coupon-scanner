const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());

app.get('/api/search', async (req, res) => {
    const q = req.query.q;
    try {
        const [jumia, rss] = await Promise.all([
            axios.get(`https://www.jumia.ma/catalog/?q=${q}`, { headers: {'User-Agent': 'Mozilla/5.0'} }),
            axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://slickdeals.net/newsearch.php?q='+q+'&rss=1')}`)
        ]);
        const price = jumia.data.match(/data-price="(\d+)"/)?.[1] || "N/A";
        const coupons = rss.data.items.slice(0, 3).map(i => ({
            title: i.title,
            code: (i.title + i.content).toUpperCase().match(/\b([A-Z]{2,}[0-9]+|[0-9]{2,}[A-Z]+)[A-Z0-9]*\b/g)?.[0] || "DEAL",
            link: i.link
        }));
        res.json({ store: "Jumia Morocco", price, coupons });
    } catch (e) { res.status(500).json({ error: "Fail" }); }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => console.log(`Live on ${PORT}`));
