const FEISHU_APP_ID = import.meta.env.VITE_FEISHU_APP_ID;

const FEISHU_AUTH_URL = 'https://open.feishu.cn/open-apis/authen/v1/authorize';

export function getFeishuAuthUrl(): string {
  const redirectUri = `${window.location.origin}/auth/callback`;

  const params = new URLSearchParams({
    app_id: FEISHU_APP_ID,
    redirect_uri: redirectUri,
    state: generateState(),
  });

  return `${FEISHU_AUTH_URL}?${params.toString()}`;
}

function generateState(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function redirectToFeishuAuth(): void {
  window.location.href = getFeishuAuthUrl();
}
