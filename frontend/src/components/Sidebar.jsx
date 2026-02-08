import { useState, useEffect } from 'react';
import './Sidebar.css';

const categories = [
  { id: 'all', name: '全部', icon: '📝' },
  { id: 'diary', name: '日记', icon: '📖' },
  { id: 'tech', name: '技术', icon: '💻' },
  { id: 'life', name: '生活经验', icon: '🌱' }
];

export default function Sidebar({ currentCategory, onCategoryChange, postCounts }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleCategoryClick = (categoryId) => {
    onCategoryChange(categoryId);
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* 移动端菜单按钮 */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <span className="hamburger-icon">
          {isOpen ? '✕' : '☰'}
        </span>
      </button>

      {/* 遮罩层 */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* 侧边栏 */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">分类</h2>
        </div>

        <nav className="sidebar-nav">
          {categories.map((cat) => {
            const count = postCounts[cat.id] || 0;
            const isActive = currentCategory === cat.id;

            return (
              <button
                key={cat.id}
                className={`category-item ${isActive ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.id)}
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.name}</span>
                <span className="category-count">{count}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-info">
            共 {postCounts.all || 0} 篇文章
          </p>
        </div>
      </aside>
    </>
  );
}
