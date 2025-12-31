import type { VercelRequest, VercelResponse } from '@vercel/node';

const FEISHU_APP_ID = process.env.VITE_FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;
const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

// 获取 app_access_token
async function getAppAccessToken(): Promise<string> {
  const response = await fetch(
    `${FEISHU_API_BASE}/auth/v3/app_access_token/internal`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: FEISHU_APP_ID,
        app_secret: FEISHU_APP_SECRET,
      }),
    }
  );

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`Failed to get app_access_token: ${data.msg}`);
  }
  return data.app_access_token;
}

/**
 * 飞书 API 代理
 * 前端调用: POST /api/feishu/proxy
 * Body: { endpoint: "/drive/v1/files", method: "GET", body?: {...}, userToken: "xxx" }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { endpoint, method = 'GET', body, userToken } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint' });
  }

  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
    return res.status(500).json({ error: 'Missing Feishu app credentials' });
  }

  try {
    // 决定使用哪种 token
    // 如果传了 userToken，使用 user_access_token（用户身份操作）
    // 否则使用 app_access_token（应用身份操作）
    let token: string;
    if (userToken) {
      token = userToken;
    } else {
      token = await getAppAccessToken();
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(body);
    }

    const url = `${FEISHU_API_BASE}${endpoint}`;
    console.log(`Proxying to Feishu: ${method} ${url}`);

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error('Feishu proxy error:', error);
    return res.status(500).json({
      error: 'Proxy error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
