# Videocut Skills

> Claude/Codex Skills for transcript-guided talking-head video cutting.

This repository currently publishes the `剪口播` skill: a workflow for
transcribing talking-head videos, detecting silence/repeats/stumbles, cutting
the video automatically, then regenerating final subtitles from the cut video
audio.

## What This Version Does

- Extracts audio from a source MP4 with FFmpeg.
- Uploads audio and transcribes it with Volcengine ASR.
- Generates word-level timestamps and silence markers.
- Builds an `auto_selected.json` deletion list from silence plus AI-reviewed
  repeated or unfinished speech.
- Cuts the source video with FFmpeg.
- Re-transcribes the cut MP4 audio to produce final delivery subtitles.
- Requires text-only AI subtitle polishing while preserving SRT structure.

## Install

Clone this repository into your skills directory:

```bash
git clone https://github.com/Backtthefuture/videocut-skills.git ~/.codex/skills/videocut-skills
```

Create a local environment file:

```bash
cd ~/.codex/skills/videocut-skills
cp .env.example .env
```

Then edit `.env` and fill in your Volcengine/Doubao Speech API key:

```bash
VOLCENGINE_API_KEY=your_key_here
```

If you have never used Volcengine/Doubao APIs before, follow the beginner guide:
[How to get the API key](docs/API_KEY_SETUP.md).

After installation, run the first-use check:

```bash
bash ~/.codex/skills/videocut-skills/剪口播/scripts/check_setup.sh
```

If the API key is missing, this command will show the next steps in Chinese and
point you to the Volcengine console.

## Usage

In Codex/Claude, run the skill with a video file:

```text
/videocut:剪口播 /path/to/video.mp4
```

The default workflow is full-auto: it does not open the review page unless you
explicitly ask for manual review.

## Output

For a video named `example.mp4`, the skill creates an output folder like:

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

The main delivery files are:

- `*_auto_cut.mp4`
- `*_raw_final.srt`
- `*_final.srt`
- `*_字幕校对报告.md`

## Requirements

- Node.js 18+
- FFmpeg / ffprobe
- Python 3
- Volcengine/Doubao Speech ASR API key
- Network access for temporary audio upload

## Acknowledgements

This skill is adapted from the original open-source project
[Ceeon/videocut-skills](https://github.com/Ceeon/videocut-skills), which
introduced the Claude Code Skills based video-cutting workflow. Thanks to Ceeon
for the original idea, structure, and MIT-licensed implementation.

This version adds and/or emphasizes the full-auto cut path, post-cut ASR,
text-only final subtitle polishing, and the local user-rule set included under
`剪口播/用户习惯/`.

## License

MIT. See [LICENSE](LICENSE).
