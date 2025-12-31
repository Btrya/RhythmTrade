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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const response = await fetch(
      'https://open.feishu.cn/open-apis/authen/v1/oidc/refresh_access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: FEISHU_APP_ID,
          client_secret: FEISHU_APP_SECRET,
          refresh_token,
        }),
      }
    );

    const data: FeishuRefreshResponse = await response.json();

    if (data.code !== 0 || !data.data) {
      return res.status(400).json({
        error: 'Failed to refresh token',
        message: data.msg,
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
    return res.status(500).json({ error: 'Internal server error' });
  }
}
