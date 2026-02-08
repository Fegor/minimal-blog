/**
 * Cloudflare Worker for Minimal Blog
 * 
 * 功能：
 * 1. 处理用户认证（简单的邮箱验证）
 * 2. 代理 GitHub API 调用
 * 3. 保护 GitHub Token 不被前端暴露
 */

// ============ 环境变量 ============
// GITHUB_TOKEN: GitHub Personal Access Token
// AUTH_SECRET: JWT 签名密钥
// ALLOWED_EMAILS: 允许登录的邮箱列表（逗号分隔）
// GITHUB_REPO: GitHub 仓库名称（格式: username/repo）

// ============ CORS 配置 ============
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ============ 主处理函数 ============
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // 处理 OPTIONS 请求（CORS 预检）
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // 路由分发
    if (path === '/auth/login') {
      return handleLogin(request);
    } else if (path === '/posts') {
      return handlePosts(request);
    } else if (path.startsWith('/posts/')) {
      return handlePost(request, path);
    } else if (path === '/images') {
      return handleImageUpload(request);
    } else {
      return jsonResponse({ error: 'Not Found' }, 404);
    }
  } catch (error) {
    console.error('Error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

// ============ 认证处理 ============

async function handleLogin(request) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const { email, password } = await request.json();

  // 简单的邮箱验证（生产环境应使用更安全的方式）
  const allowedEmails = ALLOWED_EMAILS.split(',').map(e => e.trim());
  
  if (!allowedEmails.includes(email)) {
    return jsonResponse({ error: '未授权的邮箱' }, 401);
  }

  // 生成 JWT token（简化版本，生产环境应使用正式的 JWT 库）
  const token = await generateToken(email);

  return jsonResponse({ token, email });
}

async function generateToken(email) {
  const payload = {
    email,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天过期
  };
  
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const base64Payload = btoa(JSON.stringify(payload));
  
  return `${base64Payload}.${base64Signature}`;
}

async function verifyToken(token) {
  if (!token) return null;

  try {
    const [payloadB64, signatureB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64));
    
    // 检查过期时间
    if (payload.exp < Date.now()) {
      return null;
    }

    // 验证签名
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(AUTH_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, signature, data);
    
    return valid ? payload : null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

function requireAuth(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('未授权');
  }

  const token = authHeader.replace('Bearer ', '');
  return verifyToken(token);
}

// ============ GitHub API 代理 ============

async function handlePosts(request) {
  if (request.method === 'GET') {
    // 获取所有文章列表（不需要认证）
    return await getPostsList();
  } else if (request.method === 'POST') {
    // 创建文章（需要认证）
    await requireAuth(request);
    return await createNewPost(request);
  }
  
  return jsonResponse({ error: 'Method not allowed' }, 405);
}

async function handlePost(request, path) {
  // 路径格式: /posts/{category}/{filename}
  const parts = path.split('/').filter(Boolean);
  if (parts.length !== 3) {
    return jsonResponse({ error: 'Invalid path' }, 400);
  }

  const category = parts[1];
  const filename = parts[2];

  if (request.method === 'GET') {
    // 获取单篇文章（不需要认证）
    return await getPost(category, filename);
  } else if (request.method === 'PUT') {
    // 更新文章（需要认证）
    await requireAuth(request);
    return await updatePost(request, category, filename);
  } else if (request.method === 'DELETE') {
    // 删除文章（需要认证）
    await requireAuth(request);
    return await deletePost(category, filename);
  }
  
  return jsonResponse({ error: 'Method not allowed' }, 405);
}

// 获取文章列表
async function getPostsList() {
  const categories = ['diary', 'tech', 'life'];
  const allPosts = [];

  for (const category of categories) {
    try {
      const files = await githubRequest(`/repos/${GITHUB_REPO}/contents/posts/${category}`);
      
      for (const file of files) {
        if (file.name.endsWith('.md')) {
          // 解析文件名获取日期
          const dateMatch = file.name.match(/^(\d{4}-\d{2}-\d{2})/);
          const date = dateMatch ? dateMatch[1] : '';
          
          allPosts.push({
            id: file.sha,
            filename: file.name,
            category,
            date,
            path: file.path,
            downloadUrl: file.download_url
          });
        }
      }
    } catch (error) {
      console.error(`Error loading ${category}:`, error);
    }
  }

  // 获取每篇文章的详细内容
  const postsWithContent = await Promise.all(
    allPosts.map(async (post) => {
      try {
        const content = await fetch(post.downloadUrl).then(r => r.text());
        const parsed = parseMarkdown(content);
        
        return {
          id: post.id,
          filename: post.filename,
          category: post.category,
          date: parsed.metadata.date || post.date,
          title: parsed.metadata.title || post.filename.replace('.md', ''),
          content: parsed.content,
          ...parsed.metadata
        };
      } catch (error) {
        console.error('Error fetching post content:', error);
        return null;
      }
    })
  );

  return jsonResponse({
    posts: postsWithContent.filter(Boolean)
  });
}

// 获取单篇文章
async function getPost(category, filename) {
  const file = await githubRequest(`/repos/${GITHUB_REPO}/contents/posts/${category}/${filename}`);
  const content = atob(file.content);
  const parsed = parseMarkdown(content);

  return jsonResponse({
    post: {
      id: file.sha,
      filename,
      category,
      ...parsed.metadata,
      content: parsed.content
    }
  });
}

// 创建文章
async function createNewPost(request) {
  const { category, filename, content } = await request.json();

  const result = await githubRequest(`/repos/${GITHUB_REPO}/contents/posts/${category}/${filename}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Create post: ${filename}`,
      content: btoa(unescape(encodeURIComponent(content)))
    })
  });

  return jsonResponse({ success: true, file: result });
}

// 更新文章
async function updatePost(request, category, filename) {
  const { content } = await request.json();

  // 获取当前文件的 SHA
  const file = await githubRequest(`/repos/${GITHUB_REPO}/contents/posts/${category}/${filename}`);

  const result = await githubRequest(`/repos/${GITHUB_REPO}/contents/posts/${category}/${filename}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Update post: ${filename}`,
      content: btoa(unescape(encodeURIComponent(content))),
      sha: file.sha
    })
  });

  return jsonResponse({ success: true, file: result });
}

// 删除文章
async function deletePost(category, filename) {
  // 获取当前文件的 SHA
  const file = await githubRequest(`/repos/${GITHUB_REPO}/contents/posts/${category}/${filename}`);

  const result = await githubRequest(`/repos/${GITHUB_REPO}/contents/posts/${category}/${filename}`, {
    method: 'DELETE',
    body: JSON.stringify({
      message: `Delete post: ${filename}`,
      sha: file.sha
    })
  });

  return jsonResponse({ success: true });
}

// ============ 图片上传 ============

async function handleImageUpload(request) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  await requireAuth(request);

  const formData = await request.formData();
  const file = formData.get('file');
  const date = formData.get('date') || new Date().toISOString().split('T')[0];

  if (!file) {
    return jsonResponse({ error: 'No file provided' }, 400);
  }

  // 生成文件名
  const ext = file.name.split('.').pop();
  const filename = `${date}-${Date.now()}.${ext}`;

  // 读取文件内容
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

  // 上传到 GitHub
  const result = await githubRequest(`/repos/${GITHUB_REPO}/contents/images/${filename}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Upload image: ${filename}`,
      content: base64
    })
  });

  return jsonResponse({
    success: true,
    url: `../images/${filename}`,
    downloadUrl: result.content.download_url
  });
}

// ============ GitHub API 请求 ============

async function githubRequest(path, options = {}) {
  const url = `https://api.github.com${path}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Minimal-Blog-Worker',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${error}`);
  }

  return response.json();
}

// ============ 工具函数 ============

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  });
}

function parseMarkdown(markdown) {
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
