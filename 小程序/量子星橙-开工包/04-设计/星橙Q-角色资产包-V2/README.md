# 星橙Q 角色资产包 V2.0

本包以原 Bloub SVG 动画引擎为唯一角色源。轮廓、眼睛、星橙渐变、左上星芒、连续形变、遮挡与缓动均直接来自项目引擎；静态资产也从引擎 SVG 或动画关键帧提取。

## 目录

- `assets/standard`：标准头像，32–1024 px、SVG、米白背景 JPG。
- `assets/emotions`：11 个基础情绪，每个含 PNG 与 SVG。
- `assets/semantic`：14 个产品语义状态，每个含 GIF、MP4、PNG、WebP。
- `assets/scene-actions`：执笔填写、招手邀请、托举成果 3 个克制配件动作。
- `assets/core-motion`：待机眨眼、开心跳跃两套高频核心动态。
- `assets/stickers`：8 张传播表情图与总览。
- `assets/share-cards`：4 张 1200×630 分享卡。
- `assets/posters`：1:1、3:4、9:16、16:9 海报。
- `assets/guidelines`：主体与配件边界示意。
- `docs`：角色、动效、小程序调用、品牌和禁用规范。
- `manifest.json`：所有文件的体积与 SHA-256。

## 使用顺序

1. 小程序常规界面优先调用 `semantic/static/*.webp`。
2. 关键反馈调用 `semantic/gif/*.gif`；对包体敏感时从 CDN 加载。
3. 分享视频、启动页或大屏使用 `semantic/mp4/*.mp4`。
4. 只有“正在书写、主动邀请、展示成果”允许使用 `scene-actions`。
5. 任何页面都不得用带配件版本代替标准头像。

## 质量基准

- GIF：320×320，20 fps，米白背景。
- MP4：512×512，30 fps，米白背景，H.264。
- PNG：1024×1024；SVG 可无损缩放。
- 小于 128 px 时隐藏复杂轨道与粒子，使用静态 WebP。

本地开发环境打开 `/#roles` 可审阅并重新导出引擎文件。
