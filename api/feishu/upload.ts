import type { VercelRequest, VercelResponse } from '@vercel/node';

const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

/**
 * 飞书图片上传代理
 * 前端调用: POST /api/feishu/upload
 * Body: JSON
 *   - imageData: base64 图片数据
 *   - file_name: 文件名
 *   - parent_type: "docx_image"
 *   - parent_node: image block id
 * Headers:
 *   - Authorization: Bearer <user_access_token>
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
    const { file_name, parent_type, parent_node, imageData } = req.body;

    if (!parent_node) {
      return res.status(400).json({ error: 'Missing parent_node' });
    }

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

    // file 部分
    parts.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
          `Content-Type: image/png\r\n\r\n`
      )
    );
    parts.push(binaryData);
    parts.push(Buffer.from('\r\n'));

    // file_name 部分
    parts.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file_name"\r\n\r\n` +
          `${fileName}\r\n`
      )
    );

    // parent_type 部分
    parts.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="parent_type"\r\n\r\n` +
          `${parent_type || 'docx_image'}\r\n`
      )
    );

    // parent_node 部分
    parts.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="parent_node"\r\n\r\n` +
          `${parent_node}\r\n`
      )
    );

    // 结束边界
    parts.push(Buffer.from(`--${boundary}--\r\n`));

    const body = Buffer.concat(parts as Uint8Array[]);

    const response = await fetch(`${FEISHU_API_BASE}/drive/v1/medias/upload_all`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body as unknown as BodyInit,
    });

    const data = await response.json();
    console.log('Feishu upload response:', JSON.stringify(data));
    return res.status(200).json(data);
  } catch (error) {
    console.error('Feishu upload error:', error);
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
