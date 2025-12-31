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

async function getAccessToken(): Promise<string> {
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
export async function feishuFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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

// ==================== 文件夹操作 ====================

interface FolderMeta {
  token: string;
  name: string;
  type: string;
}

interface SearchResult {
  tokens: { obj_token: string; obj_type: string }[];
}

export async function getRootFolderToken(): Promise<string> {
  const data = await feishuFetch<{ token: string }>('/drive/explorer/v2/root_folder/meta');
  return data.token;
}

export async function searchFolder(
  folderToken: string,
  name: string
): Promise<string | null> {
  try {
    const data = await feishuFetch<SearchResult>(`/drive/v1/files/search`, {
      method: 'POST',
      body: JSON.stringify({
        search_key: name,
        folder_tokens: [folderToken],
        obj_types: ['folder'],
        count: 10,
      }),
    });

    if (data.tokens && data.tokens.length > 0) {
      return data.tokens[0].obj_token;
    }
    return null;
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

export async function listFolderFiles(folderToken: string): Promise<FileListItem[]> {
  const allFiles: FileListItem[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({ folder_token: folderToken });
    if (pageToken) {
      params.set('page_token', pageToken);
    }

    const data = await feishuFetch<FileListResult>(`/drive/v1/files?${params.toString()}`);

    allFiles.push(...data.files);
    pageToken = data.has_more ? data.next_page_token : undefined;
  } while (pageToken);

  return allFiles;
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
  const data = await feishuFetch<DocumentContent>(
    `/docx/v1/documents/${documentId}?with_blocks=true`
  );
  return data;
}

export async function getDocumentBlocks(documentId: string): Promise<DocBlock[]> {
  const content = await getDocumentContent(documentId);
  return content.blocks || [];
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
    `/docx/v1/documents/${documentId}/blocks/${parentBlockId}/children`,
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
    `/docx/v1/documents/${documentId}/blocks/${blockId}`,
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
    `/docx/v1/documents/${documentId}/blocks/${parentBlockId}/children/${blockId}`,
    { method: 'DELETE' }
  );
}
