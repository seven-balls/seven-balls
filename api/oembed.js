// Vercel serverless function: /api/oembed
// Proxies TikTok and Vimeo oEmbed requests to bypass browser CORS restrictions.

const ENDPOINTS = {
  tiktok: "https://www.tiktok.com/oembed",
  vimeo: "https://vimeo.com/api/oembed.json",
};

export default async function handler(req, res) {
  const { platform, url } = req.query || {};

  if (!platform || !url) {
    return res.status(400).json({ error: "Missing platform or url parameter" });
  }
  const endpoint = ENDPOINTS[platform];
  if (!endpoint) {
    return res.status(400).json({ error: "Unsupported platform" });
  }

  try {
    const upstream = await fetch(`${endpoint}?url=${encodeURIComponent(url)}`, {
      headers: { "User-Agent": "SevenBallsBot/1.0 (+https://sevenballs.co.uk)" },
    });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: "oEmbed lookup failed" });
    }
    const data = await upstream.json();
    // Cache successful responses for an hour
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(data);
  } catch (err) {
    console.error("oEmbed proxy error:", err);
    return res.status(500).json({ error: "Proxy request failed" });
  }
}
