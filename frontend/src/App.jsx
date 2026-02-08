import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ThemeToggle from './components/ThemeToggle';
import QuickInput from './components/QuickInput';
import PostList from './components/PostList';
import {
  isAuthenticated,
  getPosts,
  createPost,
  updatePost,
  deletePost,
  login,
  logout
} from './services/github';
import './styles/global.css';
import './styles/markdown.css';
import './App.css';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [postCounts, setPostCounts] = useState({ all: 0 });
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [loading, setLoading] = useState(true);

  // 加载文章
  useEffect(() => {
    loadPosts();
  }, []);

  // 过滤文章
  useEffect(() => {
    if (currentCategory === 'all') {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(posts.filter(post => post.category === currentCategory));
    }
  }, [posts, currentCategory]);

  // 计算文章数量
  useEffect(() => {
    const counts = {
      all: posts.length,
      diary: posts.filter(p => p.category === 'diary').length,
      tech: posts.filter(p => p.category === 'tech').length,
      life: posts.filter(p => p.category === 'life').length
    };
    setPostCounts(counts);
  }, [posts]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const postsData = await getPosts();
      // 按日期倒序排序
      const sortedPosts = postsData.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      setPosts(sortedPosts);
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (postData) => {
    try {
      await createPost(postData);
      await loadPosts();
    } catch (error) {
      console.error('发布失败:', error);
      throw error;
    }
  };

  const handleEdit = async (post) => {
    // TODO: 打开编辑器模态框
    console.log('编辑文章:', post);
  };

  const handleDelete = async (post) => {
    try {
      await deletePost(post);
      await loadPosts();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
      setAuthenticated(true);
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
  };

  return (
    <div className="app">
      <Sidebar
        currentCategory={currentCategory}
        onCategoryChange={setCurrentCategory}
        postCounts={postCounts}
      />

      <main className="main-content">
        <ThemeToggle />

        <div className="content-wrapper">
          <header className="app-header">
            <h1 className="app-title">极简博客</h1>
            {authenticated && (
              <button onClick={handleLogout} className="secondary logout-btn">
                登出
              </button>
            )}
          </header>

          <QuickInput
            onPublish={handlePublish}
            isAuthenticated={authenticated}
          />

          {loading ? (
            <div className="loading-state">
              <p>加载中...</p>
            </div>
          ) : (
            <PostList
              posts={filteredPosts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isAuthenticated={authenticated}
            />
          )}
        </div>
      </main>
    </div>
  );
}
