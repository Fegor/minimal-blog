import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import './PostList.css';

const categoryNames = {
  diary: '日记',
  tech: '技术',
  life: '生活经验'
};

const categoryColors = {
  diary: '#0369a1',
  tech: '#15803d',
  life: '#ca8a04'
};

export default function PostList({ posts, onEdit, onDelete, isAuthenticated }) {
  const [expandedPost, setExpandedPost] = useState(null);

  const togglePost = (postId) => {
    setExpandedPost(expandedPost === postId ? null : postId);
  };

  const handleDelete = async (post) => {
    if (confirm(`确定要删除《${post.title}》吗？`)) {
      await onDelete(post);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-icon">📝</p>
        <p className="empty-text">暂无文章</p>
        <p className="empty-hint">点击上方输入框开始写作</p>
      </div>
    );
  }

  return (
    <div className="post-list">
      {posts.map((post) => {
        const isExpanded = expandedPost === post.id;

        return (
          <article key={post.id} className="post-item fade-in">
            <div className="post-header" onClick={() => togglePost(post.id)}>
              <div className="post-meta">
                <time className="post-date">{post.date}</time>
                <span
                  className="post-category"
                  style={{ backgroundColor: categoryColors[post.category] }}
                >
                  {categoryNames[post.category]}
                </span>
              </div>

              <h3 className="post-title">{post.title}</h3>

              {!isExpanded && (
                <p className="post-excerpt">
                  {post.content.substring(0, 100)}
                  {post.content.length > 100 ? '...' : ''}
                </p>
              )}
            </div>

            {isExpanded && (
              <div className="post-content">
                <div className="markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>

                {isAuthenticated && (
                  <div className="post-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(post);
                      }}
                      className="secondary"
                    >
                      编辑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(post);
                      }}
                      className="secondary delete-btn"
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="post-footer">
              <button
                className="expand-btn"
                onClick={() => togglePost(post.id)}
              >
                {isExpanded ? '收起' : '展开阅读'}
                <span className="expand-icon">
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
