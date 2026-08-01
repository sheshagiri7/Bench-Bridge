/**
 * Netlify Serverless Function: github-oauth
 * Handles the GitHub OAuth 2.0 token exchange securely server-side.
 *
 * Environment variables required (set in Netlify dashboard):
 *   GITHUB_CLIENT_ID     = Ov23liNUXSK1qIvupRtI
 *   GITHUB_CLIENT_SECRET = <your secret from GitHub developer settings>
 */

export async function handler(event) {

    // Allow preflight CORS
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 204,
            headers: corsHeaders(),
            body: ""
        };
    }

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: corsHeaders(),
            body: JSON.stringify({ error: "Method not allowed" })
        };
    }

    let code, redirectUri;
    try {
        ({ code, redirectUri } = JSON.parse(event.body || "{}"));
    } catch {
        return {
            statusCode: 400,
            headers: corsHeaders(),
            body: JSON.stringify({ error: "Invalid JSON body" })
        };
    }

    if (!code) {
        return {
            statusCode: 400,
            headers: corsHeaders(),
            body: JSON.stringify({ error: "Missing code parameter" })
        };
    }

    // Exchange authorization code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            client_id:     process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri:  redirectUri
        })
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
        return {
            statusCode: 400,
            headers: corsHeaders(),
            body: JSON.stringify({ error: tokenData.error_description || tokenData.error })
        };
    }

    const accessToken = tokenData.access_token;

    // Fetch the authenticated user's profile from GitHub API
    const userRes = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "User-Agent":  "BenchBridge-App"
        }
    });
    const userProfile = await userRes.json();

    // Fetch the user's primary email (may be private, not in /user)
    let email = userProfile.email;
    if (!email) {
        try {
            const emailRes = await fetch("https://api.github.com/user/emails", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "User-Agent":  "BenchBridge-App"
                }
            });
            const emails = await emailRes.json();
            const primary = emails.find(e => e.primary && e.verified);
            email = primary ? primary.email : emails[0]?.email || null;
        } catch (_) {}
    }

    return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({
            name:       userProfile.name || userProfile.login,
            login:      userProfile.login,
            email:      email || userProfile.login + "@users.noreply.github.com",
            avatar_url: userProfile.avatar_url,
            bio:        userProfile.bio || ""
        })
    };
}

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    };
}
