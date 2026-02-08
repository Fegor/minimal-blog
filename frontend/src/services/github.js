// GitHub API 服务
// 通过 Cloudflare Worker 代理调用 GitHub API

const WORKER_URL = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;
const REPO = import.meta.env.VITE_GITHUB_REPO;

// 获取认证 token
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

// 设置认证 token
export function setAuthToken(token) {
  localStorage.setItem('auth_token', token);
}

// 清除认证 token
export function clearAuthToken() {
  localStorage.removeItem('auth_token');
}

// 检查是否已认证
export function isAuthenticated() {
  return !!getAuthToken();
}

// 通用请求方法
async function request(endpoint, options = {}) {
  const token = getAuthToken();
  
  const response = await fetch(`${WORKER_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
      throw new Error('未授权，请重新登录');
    }
    const error = await response.json();
    throw new Error(error.message || '请求失败');
  }

  return response.json();
}

// ============ 认证相关 ============

// 登录
export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  setAuthToken(data.token);
  return data;
}

// 登出
export function logout() {
  clearAuthToken();
}

// ============ 文章相关 ============

// 获取所有文章列表
export async function getPosts() {
  try {
    const data = await request('/posts');
    return data.posts || [];
  } catch (error) {
    console.error('获取文章列表失败:', error);
    return [];
  }
}

// 获取单篇文章
export async function getPost(category, filename) {
  const data = await request(`/posts/${category}/${filename}`);
  return data.post;
}

// 创建文章
export async function createPost(post) {
  const { title, content, category, date } = post;
  
  // 生成文件名
  const filename = `${date}-${sanitizeFilename(title)}.md`;
  
  // 组装 Markdown 内容（带 YAML front matter）
  const markdown = formatMarkdown({
    title,
    date,
    category,
    content
  });

  const data = await request('/posts', {
    method: 'POST',
    body: JSON.stringify({
      category,
      filename,
      content: markdown
    })
  });

  return data;
}

// 更新文章
export async function updatePost(post) {
  const { id, title, content, category, date, filename } = post;
  
  const markdown = formatMarkdown({
    title,
    date,
    category,
    content
  });

  const data = await request(`/posts/${category}/${filename}`, {
    method: 'PUT',
    body: JSON.stringify({
      content: markdown
    })
  });

  return data;
}

// 删除文章
export async function deletePost(post) {
  const { category, filename } = post;
  
  const data = await request(`/posts/${category}/${filename}`, {
    method: 'DELETE'
  });

  return data;
}

// ============ 图片相关 ============

// 上传图片
export async function uploadImage(file, postDate) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('date', postDate);

  const token = getAuthToken();
  
  const response = await fetch(`${WORKER_URL}/images`, {
    method: 'POST',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('图片上传失败');
  }

  const data = await response.json();
  return data.url; // 返回图片的相对路径
}

// ============ 工具函数 ============

// 清理文件名（移除特殊字符）
function sanitizeFilename(title) {
  return title
    .trim()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, '') // 只保留字母、数字、中文、连字符
    .replace(/\s+/g, '-') // 空格替换为连字符
    .toLowerCase();
}

// 格式化 Markdown 内容
function formatMarkdown({ title, date, category, content }) {
  return `---
title: ${title}
date: ${date}
category: ${category}
---

${content}`;
}

// 解析 Markdown front matter
export function parseMarkdown(markdown) {
  const frontMatterRegex = /^---\n([\s\S]+?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontMatterRegex);

  if (!match) {
    return {
      metadata: {},
      content: markdown
    };
  }

  const frontMatter = match[1];
  const content = match[2];

  const metadata = {};
  frontMatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      metadata[key.trim()] = valueParts.join(':').trim();
    }
  });

  return {
    metadata,
    content: content.trim()
  };
}
