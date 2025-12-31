import type { VercelRequest, VercelResponse } from '@vercel/node';

const FEISHU_APP_ID = process.env.VITE_FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;

interface FeishuTokenResponse {
  code: number;
  msg: string;
  data?: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    refresh_expires_in: number;
    name: string;
    avatar_url: string;
    open_id: string;
    union_id: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
    return res.status(500).json({ error: 'Missing Feishu app credentials' });
  }

  try {
    // 用 code 换取 user_access_token
    const response = await fetch(
      'https://open.feishu.cn/open-apis/authen/v1/oidc/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: FEISHU_APP_ID,
          client_secret: FEISHU_APP_SECRET,
          code,
        }),
      }
    );

    const data: FeishuTokenResponse = await response.json();

    if (data.code !== 0 || !data.data) {
      return res.status(400).json({
        error: 'Failed to exchange token',
        message: data.msg,
      });
    }

    // 返回 token 和用户信息
    return res.status(200).json({
      access_token: data.data.access_token,
      refresh_token: data.data.refresh_token,
      expires_in: data.data.expires_in,
      refresh_expires_in: data.data.refresh_expires_in,
      user: {
        open_id: data.data.open_id,
        union_id: data.data.union_id,
        name: data.data.name,
        avatar_url: data.data.avatar_url,
      },
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
