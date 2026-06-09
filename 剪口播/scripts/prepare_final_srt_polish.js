#!/usr/bin/env node
/**
 * Prepare artifacts for the mandatory AI text-only polish of final SRT.
 *
 * Usage:
 *   node prepare_final_srt_polish.js <raw_final.srt> <final.srt>
 *
 * This script does not call an LLM. The Codex agent must use the generated
 * prompt to edit final.srt text-only, then validate against raw_final.srt.
 */

const fs = require('fs');
const path = require('path');

const [rawSrt, finalSrt] = process.argv.slice(2);

if (!rawSrt || !finalSrt) {
  console.error('Usage: node prepare_final_srt_polish.js <raw_final.srt> <final.srt>');
  process.exit(1);
}

if (!fs.existsSync(rawSrt)) {
  console.error('Missing raw SRT:', rawSrt);
  process.exit(1);
}

if (!fs.existsSync(finalSrt)) {
  console.error('Missing final SRT:', finalSrt);
  process.exit(1);
}

function parseSrt(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').trim();
  if (!text) return [];
  return text.split(/\n\s*\n/).map((block, index) => {
    const lines = block.split('\n');
    return {
      index: index + 1,
      number: lines[0] || '',
      timestamp: lines[1] || '',
      text: lines.slice(2).join('\n'),
    };
  });
}

const rows = parseSrt(rawSrt);
const finalDir = path.dirname(finalSrt);
const finalBase = path.basename(finalSrt, '.srt');
const artifactBase = finalBase.endsWith('_final') ? finalBase.slice(0, -'_final'.length) : finalBase;
const promptFile = path.join(finalDir, `${artifactBase}_ai_polish_prompt.md`);
const reportFile = path.join(finalDir, `${artifactBase}_字幕校对报告.md`);

const suspiciousTerms = [
  'Agentt',
  '皇叔',
  'a i',
  'AJ',
  '一卷',
  '批准',
  '尾系',
  'walkbody',
  '爱马仕',
  'A卷',
  'a卷',
  'a准',
  '隐不隐',
  '结群',
];

const prompt = `# AI 字幕文字校对任务

输入文件:
- ASR 原始字幕: ${rawSrt}
- 待写回校正版: ${finalSrt}

你必须把 ${finalSrt} 改成校正版字幕。

## 硬规则

1. 只改字幕文字，不改编号、时间戳、cue 数量、cue 顺序。
2. 不合并、不拆分、不新增、不删除任何字幕块。
3. 不重写口播，只修正 ASR 错词、术语、英文大小写、明显语义错误和必要标点。
4. 以当前 SRT 的时间段语义为准，不把后面内容提前，也不把前面内容挪后。
5. 校对完成后，必须用结构校验比较 ${rawSrt} 和 ${finalSrt}。

## 主题背景

这是一条黄叔口播视频，主题大概率围绕 AI Agent、微信、腾讯、元宝、小程序、Codex、Hermes、Skill、MCP、API、GUI、WeChat、网络效应。

## 常见错词优先修正

- Agentt / AJ / a卷 / a准 / 批准 / 一卷 -> Agent
- 皇叔 -> 黄叔
- a i -> AI
- 尾系 -> 维系
- walkbody -> Work Party
- 爱马仕 -> Hermes
- APP/app -> App
- Wechat -> WeChat
- 隐不隐 -> 赢不赢
- 结群聊 -> 总结群聊

## 校验命令

\`\`\`bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
python3 "$SCRIPT_DIR/srt_guard.py" validate "${rawSrt}" "${finalSrt}"
python3 "$SCRIPT_DIR/srt_guard.py" scan "${finalSrt}" ${suspiciousTerms.map(s => JSON.stringify(s)).join(' ')}
\`\`\`

## 输出要求

- 把校正版直接写回 ${finalSrt}。
- 生成或更新校对报告: ${reportFile}
- 报告里写明 cue 数、结构校验结果、主要修正词。

## SRT 摘要

- cue 数: ${rows.length}
- 首条: ${rows[0] ? `${rows[0].number} ${rows[0].timestamp} ${rows[0].text}` : 'N/A'}
- 末条: ${rows.length ? `${rows[rows.length - 1].number} ${rows[rows.length - 1].timestamp} ${rows[rows.length - 1].text}` : 'N/A'}
`;

const report = `# 字幕校对报告

- ASR 原始字幕: ${rawSrt}
- 校正版字幕: ${finalSrt}
- cue 数: ${rows.length}
- 状态: 待 AI 校对

## 待执行

1. AI 只改字幕文字。
2. 校验 cue 数、编号、时间戳不变。
3. 扫描常见 ASR 错词残留。
`;

fs.writeFileSync(promptFile, prompt, 'utf8');
if (!fs.existsSync(reportFile)) {
  fs.writeFileSync(reportFile, report, 'utf8');
}

console.log(JSON.stringify({
  rawSrt,
  finalSrt,
  promptFile,
  reportFile,
  cues: rows.length,
  next: 'Codex must perform AI text-only SRT polish before final delivery.',
}, null, 2));
