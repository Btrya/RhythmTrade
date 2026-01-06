const FEISHU_APP_ID = import.meta.env.VITE_FEISHU_APP_ID;

const FEISHU_AUTH_URL = 'https://open.feishu.cn/open-apis/authen/v1/authorize';

// 需要请求的权限范围
const SCOPES = [
  'drive:drive', // 云空间读写
  'drive:drive.metadata:readonly', // 云空间元数据只读
  'docx:document', // 文档查看编辑
  'docx:document:readonly', // 文档只读
  'contact:user.base:readonly', // 用户基本信息
  'docs:document.media:upload', // 文档媒体上传
];

export function getFeishuAuthUrl(): string {
  const redirectUri = `${window.location.origin}/auth/callback`;

  const params = new URLSearchParams({
    app_id: FEISHU_APP_ID,
    redirect_uri: redirectUri,
    scope: SCOPES.join(' '),
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
