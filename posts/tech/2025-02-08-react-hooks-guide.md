---
title: React Hooks 使用指南
date: 2025-02-08
category: tech
tags: [React, JavaScript, 前端开发]
---

React Hooks 是 React 16.8 引入的新特性，让我们可以在函数组件中使用状态和其他 React 特性。

## 常用 Hooks

### 1. useState

用于在函数组件中添加状态管理：

```javascript
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### 2. useEffect

用于处理副作用，如数据获取、订阅等：

```javascript
import { useEffect, useState } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]); // 依赖数组
  
  return <div>{user?.name}</div>;
}
```

### 3. useContext

用于跨组件共享数据：

```javascript
import { useContext } from 'react';

const ThemeContext = React.createContext('light');

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Button</button>;
}
```

## 自定义 Hooks

我们可以创建自定义 Hook 来复用逻辑：

```javascript
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });
  
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  
  return [value, setValue];
}

// 使用
function App() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  return <div>Current theme: {theme}</div>;
}
```

## 最佳实践

1. **遵循 Hooks 规则**
   - 只在顶层调用 Hooks
   - 只在 React 函数中调用 Hooks

2. **优化性能**
   - 使用 `useMemo` 缓存计算结果
   - 使用 `useCallback` 缓存函数引用
   - 正确设置 `useEffect` 的依赖数组

3. **保持组件纯净**
   - 避免在渲染过程中修改状态
   - 将副作用放在 `useEffect` 中

4. **合理拆分自定义 Hooks**
   - 一个 Hook 只做一件事
   - 使用清晰的命名
   - 提供完整的类型定义（TypeScript）

## 总结

React Hooks 让函数组件变得更加强大和灵活。掌握好 Hooks 的使用，能够让我们写出更简洁、更易维护的 React 代码。
