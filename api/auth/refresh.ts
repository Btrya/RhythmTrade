import type { VercelRequest, VercelResponse } from '@vercel/node';

const FEISHU_APP_ID = process.env.VITE_FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;

interface FeishuRefreshResponse {
  code: number;
  msg: string;
  data?: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    refresh_expires_in: number;
  };
}

// 获取 app_access_token
async function getAppAccessToken(): Promise<string> {
  const response = await fetch(
    'https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal',
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'Missing refresh token' });
  }

  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
    return res.status(500).json({ error: 'Missing Feishu app credentials' });
  }

  try {
    const appAccessToken = await getAppAccessToken();

    const response = await fetch(
      'https://open.feishu.cn/open-apis/authen/v1/refresh_access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${appAccessToken}`,
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token,
        }),
      }
    );

    const data: FeishuRefreshResponse = await response.json();

    if (data.code !== 0 || !data.data) {
      return res.status(400).json({
        error: 'Failed to refresh token',
        feishu_code: data.code,
        feishu_msg: data.msg,
      });
    }

    return res.status(200).json({
      access_token: data.data.access_token,
      refresh_token: data.data.refresh_token,
      expires_in: data.data.expires_in,
      refresh_expires_in: data.data.refresh_expires_in,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
