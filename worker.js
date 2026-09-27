/**
 * Cloudflare Worker: creates GitHub issues from client-side bug reports.
 * Deploy to https://workers.dev — free tier is more than enough.
 *
 * Set two secrets in Cloudflare:
 *   GITHUB_TOKEN  — Personal Access Token with `public_repo` scope
 *   GITHUB_REPO   — owner/repo (e.g. BlocDigital/Kerbalist)
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(url.origin),
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const { GITHUB_TOKEN, GITHUB_REPO } = env;
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      return jsonResponse({ error: 'Server misconfiguration: secrets not set' }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }

    const { title, description, browser, version, timestamp, screenshotFilename, screenshotBase64 } = body;

    if (!title || !description) {
      return jsonResponse({ error: 'title and description are required' }, 400);
    }

    // Build issue body
    let issueBody = `## Description\n${description}\n\n`;

    if (screenshotBase64 && screenshotBase64.length < 40000) {
      issueBody += `## Screenshot\n![${screenshotFilename || 'screenshot'}](${screenshotBase64})\n\n`;
    } else if (screenshotBase64) {
      issueBody += `## Screenshot\n_A large screenshot was captured but omitted from the issue body due to size limits. The reporter may resend it directly._\n\n`;
    }

    issueBody += `## Environment\n`;
    issueBody += `- **App Version:** ${version || 'unknown'}\n`;
    issueBody += `- **Browser:** ${browser || 'unknown'}\n`;
    issueBody += `- **Reported:** ${timestamp || new Date().toISOString()}\n`;

    // Create issue via GitHub API
    const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        title: `[Bug] ${title}`,
        body: issueBody,
        labels: ['bug', 'auto-reported'],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      let errJson;
      try { errJson = JSON.parse(errText); } catch { errJson = errText; }
      return jsonResponse({ error: 'GitHub API error', details: errJson }, resp.status);
    }

    const issue = await resp.json();
    return jsonResponse({
      success: true,
      url: issue.html_url,
      number: issue.number,
    });
  },
};

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
