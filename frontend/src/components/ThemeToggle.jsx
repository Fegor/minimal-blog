import { useState, useEffect } from 'react';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    // 从 localStorage 读取保存的主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    // 检测系统主题偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    // 应用主题到 document
    document.documentElement.setAttribute('data-theme', theme);
    // 保存到 localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`切换到${theme === 'light' ? '夜间' : '日间'}模式`}
      title={`切换到${theme === 'light' ? '夜间' : '日间'}模式`}
    >
      <span className="theme-icon">
        {theme === 'light' ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
