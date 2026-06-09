# Videocut Skills

> 用 Claude / Codex Skills 自动剪口播视频：转录、识别口误、自动剪辑、剪后重转录、最终字幕校对。

## 致谢

这个仓库基于原始开源项目 [Ceeon/videocut-skills](https://github.com/Ceeon/videocut-skills) 改造而来。

感谢 Ceeon 提供了用 Claude Code Skills 做视频剪辑 Agent 的原始思路、目录结构和 MIT 开源实现。本仓库保留并延续这个方向，在此基础上强化了：

- 全自动剪口播流程
- 剪后成片音频重新转录
- 最终字幕只改文字、不改时间戳的 AI 校对流程
- 更适合个人口播习惯的静音、重复、残句规则
- 安装后首次配置检查和小白 API Key 引导

## 这个 Skill 能做什么

当前仓库主要发布 `剪口播` skill。它适合处理口播视频，目标是把原片里的长静音、重复句、说错重来、残句等内容自动剪掉，并输出可直接交付的成片和字幕。

流程大致是：

1. 从 MP4 里提取音频
2. 上传音频并调用火山引擎 / 豆包语音识别
3. 生成字级时间轴和静音标记
4. 根据静音、重复、残句等规则生成删除清单
5. 用 FFmpeg 自动剪辑视频
6. 对剪后 MP4 的音频重新转录
7. 生成 `*_raw_final.srt`
8. 由 AI 只校对字幕文字，生成 `*_final.srt`
9. 校验字幕编号、时间戳、cue 数完全不变

默认是**全自动模式**，不会打开人工审核网页。只有你明确说“我要审核”“打开审核页”“人工确认”时，才走网页审核。

## 安装

把仓库克隆到你的 skills 目录：

```bash
git clone https://github.com/Backtthefuture/videocut-skills.git ~/.codex/skills/videocut-skills
```

创建本地配置文件：

```bash
cd ~/.codex/skills/videocut-skills
cp .env.example .env
```

然后打开 `.env`，填入火山引擎 / 豆包语音识别 API Key：

```bash
VOLCENGINE_API_KEY=你的_key
```

如果你不知道怎么获取 API Key，看这份小白教程：

[如何获取 API Key](docs/API_KEY_SETUP.md)

## 安装后首次检查

安装完成后，建议先跑一次配置检查：

```bash
bash ~/.codex/skills/videocut-skills/剪口播/scripts/check_setup.sh
```

如果你还没有配置 `.env` 或 API Key，脚本会用中文告诉你下一步怎么做，并给出火山引擎控制台入口。

## 使用方式

在 Codex / Claude 里调用：

```text
/videocut:剪口播 /path/to/video.mp4
```

也可以直接说：

```text
帮我剪这个口播视频 /path/to/video.mp4
处理一下这个视频 /path/to/video.mp4
```

## 输出文件

假设原视频叫 `example.mp4`，输出目录大致如下：

```text
output/YYYY-MM-DD_example/
├── 剪口播/
│   ├── 1_转录/
│   ├── 2_分析/
│   ├── 3_审核/
│   └── 4_成片字幕/
└── 字幕/
    └── 3_输出/
```

主要交付文件：

- `*_auto_cut.mp4`：剪后成片
- `*_raw_final.srt`：剪后音频重新识别的 ASR 原始字幕
- `*_final.srt`：AI 校对后的最终字幕
- `*_字幕校对报告.md`：字幕校对报告

## 依赖

- Node.js 18+
- FFmpeg / ffprobe
- Python 3
- 火山引擎 / 豆包语音识别 API Key
- 可访问外网的网络环境，用于临时上传音频并调用转录接口

## API Key 说明

这个 skill 需要的是**语音识别 / ASR Key**，不是随便一个火山方舟大模型 Key。

如果第一次使用，建议按这个顺序走：

1. 打开火山引擎控制台：https://console.volcengine.com/
2. 搜索 `语音识别` / `智能语音` / `豆包语音` / `Speech`
3. 开通语音识别服务
4. 创建或复制 API Key
5. 填入 `.env`：`VOLCENGINE_API_KEY=你的_key`

详细步骤见：[如何获取 API Key](docs/API_KEY_SETUP.md)

## 目录结构

```text
videocut-skills/
├── README.md
├── LICENSE
├── .env.example
├── docs/
│   └── API_KEY_SETUP.md
└── 剪口播/
    ├── SKILL.md
    ├── scripts/
    └── 用户习惯/
```

## 许可证

MIT。见 [LICENSE](LICENSE)。
