#!/usr/bin/env node
/**
 * Generate final SRT from the transcribed audio of the already-cut video.
 *
 * Usage:
 *   node generate_final_srt.js <volcengine_result.json> <cut_video.mp4> <output.srt>
 */

const fs = require('fs');
const { execSync } = require('child_process');

const [resultFile, videoFile, outputFile] = process.argv.slice(2);

if (!resultFile || !videoFile || !outputFile) {
  console.error('Usage: node generate_final_srt.js <volcengine_result.json> <cut_video.mp4> <output.srt>');
  process.exit(1);
}

if (!fs.existsSync(resultFile)) {
  console.error('Missing result file:', resultFile);
  process.exit(1);
}

if (!fs.existsSync(videoFile)) {
  console.error('Missing video file:', videoFile);
  process.exit(1);
}

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

function formatTime(sec) {
  sec = Math.max(0, sec);
  let total = Math.floor(sec);
  let ms = Math.round((sec - total) * 1000);
  if (ms === 1000) {
    total += 1;
    ms = 0;
  }
  const h = Math.floor(total / 3600);
  total %= 3600;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function fixTerms(text) {
  return text
    .replace(/a准/g, 'Agent')
    .replace(/a卷/g, 'Agent')
    .replace(/A准/g, 'Agent')
    .replace(/Agentt/g, 'Agent')
    .replace(/Agent准/g, 'Agent')
    .replace(/Asian/g, 'Agent')
    .replace(/agen/gi, 'Agent')
    .replace(/agent/gi, 'Agent')
    .replace(/scale/gi, 'Skill')
    .replace(/skill/g, 'Skill')
    .replace(/SQ/g, 'Skill')
    .replace(/SCU/g, 'Skill')
    .replace(/APP/g, 'App')
    .replace(/app/g, 'App')
    .replace(/cloud\s*GBT/gi, 'Claude、GPT')
    .replace(/cloud/gi, 'Claude')
    .replace(/GBT/g, 'GPT')
    .replace(/爱马仕/g, 'Hermes')
    .replace(/龙虾/g, '扣子')
    .replace(/guitarbred\s*Skill\s*UMAC/gi, 'GitHub、RedSkill、YouMind')
    .replace(/某音/g, '抖音')
    .replace(/丛林训练/g, '从零训练')
    .replace(/封锁好/g, '封装好')
    .replace(/AI产品皇叔/g, 'AI产品黄叔')
    .replace(/Skill\s*是\s*Agent/g, 'Skill 是 Agent')
    .replace(/Agent时代/g, 'Agent 时代')
    .replace(/App时代/g, 'App 时代')
    .replace(/Agent本身/g, 'Agent 本身')
    .replace(/Agent生态/g, 'Agent 生态')
    .replace(/Skill的/g, 'Skill 的');
}

function detectTailSilenceStarts(videoPath, videoDuration) {
  try {
    const cmd = `ffmpeg -hide_banner -i ${shellQuote(videoPath)} -af silencedetect=noise=-35dB:d=0.5 -f null - 2>&1`;
    const output = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const starts = [...output.matchAll(/silence_start: ([0-9.]+)/g)].map(m => Number(m[1]));
    return starts.filter(t => Number.isFinite(t) && videoDuration - t <= 10);
  } catch {
    return [];
  }
}

const result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
const utterances = (result.utterances || [])
  .map(u => ({
    start: Number(u.start_time) / 1000,
    end: Number(u.end_time) / 1000,
    text: fixTerms(String(u.text || '').trim()),
  }))
  .filter(u => u.text && Number.isFinite(u.start) && Number.isFinite(u.end));

if (utterances.length === 0) {
  console.error('No utterances in result file:', resultFile);
  process.exit(1);
}

const videoDuration = Number(sh(`ffprobe -v error -show_entries format=duration -of csv=p=0 ${shellQuote(videoFile)}`));
const lastAsrEnd = utterances[utterances.length - 1].end;
const tailSilenceStarts = detectTailSilenceStarts(videoFile, videoDuration);
const lastSpeechEnd = tailSilenceStarts.find(t => t >= lastAsrEnd - 1) || null;

let ratio = 1;
if (lastSpeechEnd && lastSpeechEnd > 0 && lastAsrEnd > 0) {
  const candidate = lastSpeechEnd / lastAsrEnd;
  if (candidate > 0.97 && candidate < 1.04) {
    ratio = candidate;
  }
}

let srt = '';
utterances.forEach((u, i) => {
  srt += `${i + 1}\n`;
  srt += `${formatTime(u.start * ratio)} --> ${formatTime(u.end * ratio)}\n`;
  srt += `${u.text}\n\n`;
});

fs.writeFileSync(outputFile, srt);

console.log(JSON.stringify({
  output: outputFile,
  cues: utterances.length,
  videoDuration,
  lastAsrEnd,
  lastSpeechEnd,
  ratio,
  lastCueEnd: utterances[utterances.length - 1].end * ratio,
}, null, 2));
