import { loadAuth, isTokenExpired, updateTokens } from './storage';

export class FeishuApiError extends Error {
  constructor(
    public code: number,
    message: string
  ) {
    super(message);
    this.name = 'FeishuApiError';
  }
}

interface FeishuResponse<T> {
  code: number;
  msg: string;
  data?: T;
}

export async function getAccessToken(): Promise<string> {
  const stored = loadAuth();

  if (!stored.accessToken) {
    throw new FeishuApiError(401, 'Not authenticated');
  }

  if (isTokenExpired() && stored.refreshToken) {
    // 尝试刷新 token
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: stored.refreshToken }),
    });

    if (!response.ok) {
      throw new FeishuApiError(401, 'Token expired');
    }

    const data = await response.json();
    updateTokens(data);
    return data.access_token;
  }

  return stored.accessToken;
}

/**
 * 通过 Vercel 代理调用飞书 API
 */
export async function feishuFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const userToken = await getAccessToken();

  // 通过代理调用飞书 API
  const response = await fetch('/api/feishu/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint,
      method: options.method || 'GET',
      body: options.body ? JSON.parse(options.body as string) : undefined,
      userToken,
    }),
  });

  const data: FeishuResponse<T> = await response.json();

  if (data.code !== 0) {
    throw new FeishuApiError(data.code, data.msg);
  }

  return data.data as T;
}

// ==================== 通用文件操作 ====================

interface FolderMeta {
  token: string;
  name: string;
  type: string;
}

interface FileListItem {
  token: string;
  name: string;
  type: string;
}

interface FileListResult {
  files: FileListItem[];
  has_more: boolean;
  next_page_token?: string;
}

export async function listFolderFiles(folderToken: string): Promise<FileListItem[]> {
  const allFiles: FileListItem[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({ folder_token: folderToken });
    if (pageToken) {
      params.set('page_token', pageToken);
    }

    const data = await feishuFetch<FileListResult>(`/drive/v1/files?${params.toString()}`);

    allFiles.push(...(data.files || []));
    pageToken = data.has_more ? data.next_page_token : undefined;
  } while (pageToken);

  return allFiles;
}

// ==================== 文件夹操作 ====================

export async function getRootFolderToken(): Promise<string> {
  const data = await feishuFetch<{ token: string }>('/drive/explorer/v2/root_folder/meta');
  return data.token;
}

export async function searchFolder(folderToken: string, name: string): Promise<string | null> {
  try {
    // 使用列表 API 查找文件夹，比搜索 API 更可靠
    const files = await listFolderFiles(folderToken);
    const folder = files.find((f) => f.name === name && f.type === 'folder');
    return folder ? folder.token : null;
  } catch {
    return null;
  }
}

export async function createFolder(parentToken: string, name: string): Promise<string> {
  const data = await feishuFetch<FolderMeta>('/drive/v1/files/create_folder', {
    method: 'POST',
    body: JSON.stringify({
      folder_token: parentToken,
      name,
    }),
  });
  return data.token;
}

export async function getOrCreateFolder(name: string): Promise<string> {
  const rootToken = await getRootFolderToken();

  // 先搜索是否已存在
  const existingToken = await searchFolder(rootToken, name);
  if (existingToken) {
    return existingToken;
  }

  // 不存在则创建
  return createFolder(rootToken, name);
}

// ==================== 文档操作 ====================

interface DocMeta {
  document_id: string;
  title: string;
}

export async function createDocument(folderToken: string, title: string): Promise<string> {
  const data = await feishuFetch<{ document: DocMeta }>('/docx/v1/documents', {
    method: 'POST',
    body: JSON.stringify({
      folder_token: folderToken,
      title,
    }),
  });
  return data.document.document_id;
}

export async function findDocumentByTitle(
  folderToken: string,
  title: string
): Promise<string | null> {
  const files = await listFolderFiles(folderToken);
  const doc = files.find((f) => f.name === title && f.type === 'docx');
  return doc ? doc.token : null;
}

export async function getOrCreateDocument(folderToken: string, title: string): Promise<string> {
  const existingId = await findDocumentByTitle(folderToken, title);
  if (existingId) {
    return existingId;
  }
  return createDocument(folderToken, title);
}

// ==================== 文档内容操作 ====================

export interface DocBlock {
  block_id: string;
  block_type: number;
  parent_id: string;
  children: string[];
  page?: { elements: DocElement[] };
  text?: { elements: DocElement[] };
  heading1?: { elements: DocElement[] };
  heading2?: { elements: DocElement[] };
  heading3?: { elements: DocElement[] };
  bullet?: { elements: DocElement[] };
  ordered?: { elements: DocElement[] };
  code?: { elements: DocElement[] };
  callout?: { elements: DocElement[] };
  divider?: object;
  table?: { property: { row_size: number; column_size: number }; cells: string[][] };
  image?: { token?: string; width?: number; height?: number };
}

export interface DocElement {
  text_run?: {
    content: string;
    text_element_style?: {
      bold?: boolean;
      italic?: boolean;
      strikethrough?: boolean;
      underline?: boolean;
    };
  };
}

interface DocumentContent {
  document: {
    document_id: string;
    title: string;
  };
  blocks?: DocBlock[];
}

export async function getDocumentContent(documentId: string): Promise<DocumentContent> {
  const data = await feishuFetch<DocumentContent>(`/docx/v1/documents/${documentId}`);
  return data;
}

interface BlocksResponse {
  items: DocBlock[];
  has_more: boolean;
  page_token?: string;
}

export async function getDocumentBlocks(documentId: string): Promise<DocBlock[]> {
  const allBlocks: DocBlock[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({ document_revision_id: '-1', page_size: '500' });
    if (pageToken) {
      params.set('page_token', pageToken);
    }

    const data = await feishuFetch<BlocksResponse>(
      `/docx/v1/documents/${documentId}/blocks?${params.toString()}`
    );

    allBlocks.push(...(data.items || []));
    pageToken = data.has_more ? data.page_token : undefined;
  } while (pageToken);

  return allBlocks;
}

interface CreateBlockResult {
  blocks: DocBlock[];
}

export async function appendBlocks(
  documentId: string,
  parentBlockId: string,
  blocks: Partial<DocBlock>[]
): Promise<DocBlock[]> {
  const data = await feishuFetch<CreateBlockResult>(
    `/docx/v1/documents/${documentId}/blocks/${parentBlockId}/children?document_revision_id=-1`,
    {
      method: 'POST',
      body: JSON.stringify({
        children: blocks,
        index: -1, // 追加到末尾
      }),
    }
  );
  return data.blocks;
}

export async function updateBlock(
  documentId: string,
  blockId: string,
  block: Partial<DocBlock>
): Promise<DocBlock> {
  const data = await feishuFetch<{ block: DocBlock }>(
    `/docx/v1/documents/${documentId}/blocks/${blockId}?document_revision_id=-1`,
    {
      method: 'PATCH',
      body: JSON.stringify(block),
    }
  );
  return data.block;
}

export async function deleteBlock(
  documentId: string,
  parentBlockId: string,
  blockId: string
): Promise<void> {
  await feishuFetch(
    `/docx/v1/documents/${documentId}/blocks/${parentBlockId}/children/${blockId}?document_revision_id=-1`,
    { method: 'DELETE' }
  );
}

// ==================== 图片上传 ====================

/**
 * 上传图片到飞书素材库
 * 返回 file_token 用于创建图片 block
 */
async function uploadImageToMedia(imageData: string, fileName: string): Promise<string> {
  const userToken = await getAccessToken();

  const response = await fetch('/api/feishu/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      imageData,
      file_name: fileName,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload image: ${error}`);
  }

  const result = await response.json();
  console.log('[uploadImageToMedia] Response:', JSON.stringify(result));

  if (result.code !== 0) {
    throw new Error(`Upload failed: ${result.msg}`);
  }

  // 返回 file_token
  const fileToken = result.data?.file_token;
  if (!fileToken) {
    throw new Error('No file_token in response');
  }

  return fileToken;
}

/**
 * 上传图片到飞书文档
 * 步骤：
 * 1. 先上传图片到素材库，获取 file_token
 * 2. 然后创建包含 file_token 的 image block
 */
export async function uploadImageToDocument(
  documentId: string,
  parentBlockId: string,
  imageData: string, // base64 data URL
  fileName: string
): Promise<string> {
  // 1. 上传图片到素材库，获取 file_token
  console.log('[uploadImageToDocument] Uploading image to media...');
  const fileToken = await uploadImageToMedia(imageData, fileName);
  console.log('[uploadImageToDocument] Got file_token:', fileToken);

  // 2. 创建包含 file_token 的 image block
  console.log('[uploadImageToDocument] Creating image block with token...');
  const createResult = await appendBlocks(documentId, parentBlockId, [
    {
      block_type: 27, // image block
      image: {
        token: fileToken,
      },
    },
  ]);

  const imageBlockId = createResult[0]?.block_id;
  if (!imageBlockId) {
    throw new Error('Failed to create image block');
  }

  console.log('[uploadImageToDocument] Image block created:', imageBlockId);
  return imageBlockId;
}
