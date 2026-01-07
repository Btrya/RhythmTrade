import type { VercelRequest, VercelResponse } from '@vercel/node';

const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

/**
 * 飞书图片上传代理
 * 前端调用: POST /api/feishu/upload
 * Body: JSON
 *   - imageData: base64 图片数据
 *   - file_name: 文件名 (可选)
 * Headers:
 *   - Authorization: Bearer <user_access_token>
 *
 * 返回: { code: 0, data: { image_key: "xxx" } }
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

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  try {
    const { file_name, imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Please provide imageData as base64' });
    }

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Buffer.from(base64Data, 'base64');

    // 构建 multipart/form-data 请求
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
    const fileName = file_name || 'image.png';

    // 手动构建 multipart body
    const parts: Buffer[] = [];

    // image 部分 (图片文件)
    parts.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="image"; filename="${fileName}"\r\n` +
          `Content-Type: image/png\r\n\r\n`
      )
    );
    parts.push(binaryData);
    parts.push(Buffer.from('\r\n'));

    // image_type 部分
    parts.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="image_type"\r\n\r\n` +
          `message\r\n`
      )
    );

    // 结束边界
    parts.push(Buffer.from(`--${boundary}--\r\n`));

    const body = Buffer.concat(parts as Uint8Array[]);

    console.log('[upload] Uploading image, size:', binaryData.length, 'bytes');

    // 使用 im/v1/images API 上传图片
    const response = await fetch(`${FEISHU_API_BASE}/im/v1/images`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body as unknown as BodyInit,
    });

    const data = await response.json();
    console.log('[upload] Feishu response:', JSON.stringify(data));

    return res.status(200).json(data);
  } catch (error) {
    console.error('[upload] Error:', error);
    return res.status(500).json({
      error: 'Upload error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
