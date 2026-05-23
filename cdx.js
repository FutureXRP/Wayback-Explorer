// Vercel serverless function — proxies requests to the Wayback Machine CDX API
// This runs on Vercel's servers, bypassing any client-side restrictions
// Deploy at: futurexrp-wayback-explorer.vercel.app/api/cdx

export default async function handler(req, res) {
  // Allow requests from anywhere (our GitHub Pages site + Claude fetching)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Build the CDX API URL from query params passed through
  const {
    url,
    matchType = 'prefix',
    limit = '100',
    from = '',
    to = '',
    output = 'json',
    fl = 'timestamp,original,statuscode,mimetype,length',
    collapse = '',
    filter = ''
  } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing required parameter: url' });
  }

  let cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=${output}&fl=${encodeURIComponent(fl)}&matchType=${matchType}&limit=${limit}`;

  if (from) cdxUrl += `&from=${from}`;
  if (to) cdxUrl += `&to=${to}`;
  if (collapse) cdxUrl += `&collapse=${collapse}`;
  if (filter) cdxUrl += `&filter=${encodeURIComponent(filter)}`;

  try {
    const response = await fetch(cdxUrl, {
      headers: {
        'User-Agent': 'WaybackExplorer/1.0 (github.com/FutureXRP/wayback-explorer)'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `CDX API returned ${response.status}`,
        cdxUrl
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch from Wayback Machine CDX API',
      message: error.message,
      cdxUrl
    });
  }
}
