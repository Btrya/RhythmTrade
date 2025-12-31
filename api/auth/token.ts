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
  // 允许 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
    return res.status(500).json({
      error: 'Missing Feishu app credentials',
      hasAppId: !!FEISHU_APP_ID,
      hasSecret: !!FEISHU_APP_SECRET,
    });
  }

  try {
    // 先获取 app_access_token
    const appAccessToken = await getAppAccessToken();

    // 用 code 换取 user_access_token
    const response = await fetch(
      'https://open.feishu.cn/open-apis/authen/v1/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${appAccessToken}`,
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
        }),
      }
    );

    const data: FeishuTokenResponse = await response.json();

    console.log('Feishu token response:', JSON.stringify(data, null, 2));

    if (data.code !== 0 || !data.data) {
      return res.status(400).json({
        error: 'Failed to exchange token',
        feishu_code: data.code,
        feishu_msg: data.msg,
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
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
