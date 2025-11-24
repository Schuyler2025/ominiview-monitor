<!--
 * @Author: Schuyler schuylerhu@gmail.com
 * @Date: 2025-11-23 16:27:00
 * @LastEditors: Schuyler schuylerhu@gmail.com
 * @LastEditTime: 2025-11-24 18:21:21
 * @FilePath: \ominiview-monitor\README.md
 * @Description:
 *
 * Copyright (c) 2025 by Schuyler, All Rights Reserved.
-->

<div align="center">
<img width="800" height="317" alt="Ominiviewer" src="./ominiviewer.gif" />
</div>

# Ominiview Monitor

一个现代化的多流监控应用，支持虎牙和斗鱼直播平台的实时流媒体播放


## ✨ 特性

- 🎥 **多流监控** - 同时监控多个直播流，支持灵活的网格布局
- 🎮 **平台支持** - 原生支持虎牙(HuYa)和斗鱼(DouYu)直播平台
- 📱 **响应式设计** - 自适应不同屏幕尺寸和布局模式
- 🔄 **智能解析** - 自动解析直播链接，支持FLV和HLS格式
- 🎛️ **交互控制** - 支持静音、刷新、移除等操作
- 🎨 **现代化UI** - 基于Tailwind CSS的暗色主题界面

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run start
```


### 构建生产版本

```bash
npm run build
```

## 📖 使用指南

### 添加直播流

1. 点击侧边栏的 **"Add Custom URL"** 按钮
2. 输入直播间URL（如：`https://www.huya.com/123456`）
3. 点击 **"Add Stream"** 添加流

### 布局模式

支持多种网格布局模式：
- **Single** - 单流全屏显示
- **Dual** - 双流并排显示
- **Triple** - 三流布局
- **Quad** - 四流网格布局
- **Hex** - 六流蜂窝布局

### 流控制

- 🔇 **静音/取消静音** - 点击流卡片上的音量图标
- 🔄 **刷新** - 点击刷新按钮重新加载流
- ❌ **移除** - 点击移除按钮删除流


## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

MIT License

---

**注意**: 本项目仅供学习和开发使用，请遵守相关平台的使用条款