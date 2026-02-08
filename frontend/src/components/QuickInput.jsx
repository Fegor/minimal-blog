import { useState } from 'react';
import './QuickInput.css';

export default function QuickInput({ onPublish, isAuthenticated }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('diary');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTitleClick = () => {
    if (isAuthenticated) {
      setIsExpanded(true);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    setIsSubmitting(true);
    try {
      await onPublish({
        title: title.trim(),
        content: content.trim(),
        category,
        date: new Date().toISOString().split('T')[0]
      });
      
      // 清空表单
      setTitle('');
      setContent('');
      setCategory('diary');
      setIsExpanded(false);
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (title || content) {
      if (confirm('确定要放弃当前内容吗？')) {
        setTitle('');
        setContent('');
        setIsExpanded(false);
      }
    } else {
      setIsExpanded(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`quick-input ${isExpanded ? 'expanded' : ''}`}>
      {!isExpanded ? (
        <div className="quick-input-collapsed" onClick={handleTitleClick}>
          <input
            type="text"
            placeholder="记录此刻的想法..."
            readOnly
            className="quick-input-placeholder"
          />
        </div>
      ) : (
        <div className="quick-input-expanded fade-in">
          <div className="quick-input-header">
            <input
              type="text"
              placeholder="标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="quick-input-title"
              autoFocus
            />
          </div>

          <div className="quick-input-body">
            <textarea
              placeholder="开始写作... (支持 Markdown 格式)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="quick-input-textarea"
            />
          </div>

          <div className="quick-input-footer">
            <div className="quick-input-category">
              <label>分类：</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="category-select"
              >
                <option value="diary">日记</option>
                <option value="tech">技术</option>
                <option value="life">生活经验</option>
              </select>
            </div>

            <div className="quick-input-actions">
              <button
                onClick={handleCancel}
                className="secondary"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                onClick={handlePublish}
                disabled={isSubmitting}
              >
                {isSubmitting ? '发布中...' : '发布'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
