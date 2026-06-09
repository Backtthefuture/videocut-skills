#!/usr/bin/env node
/**
 * Convert selected word/gap indexes to delete_segments.json.
 *
 * Usage:
 *   node selected_to_delete_segments.js <subtitles_words.json> <auto_selected.json> <delete_segments.json>
 */

const fs = require('fs');

const [wordsFile, selectedFile, outputFile] = process.argv.slice(2);

if (!wordsFile || !selectedFile || !outputFile) {
  console.error('Usage: node selected_to_delete_segments.js <subtitles_words.json> <auto_selected.json> <delete_segments.json>');
  process.exit(1);
}

if (!fs.existsSync(wordsFile)) {
  console.error('Missing subtitles file:', wordsFile);
  process.exit(1);
}

if (!fs.existsSync(selectedFile)) {
  console.error('Missing selected file:', selectedFile);
  process.exit(1);
}

const words = JSON.parse(fs.readFileSync(wordsFile, 'utf8'));
const selected = JSON.parse(fs.readFileSync(selectedFile, 'utf8'));

if (!Array.isArray(words) || !Array.isArray(selected)) {
  console.error('Invalid input: words and selected files must both contain arrays.');
  process.exit(1);
}

const segments = [];
for (const idx of [...new Set(selected)].sort((a, b) => a - b)) {
  const word = words[idx];
  if (!word || !Number.isFinite(word.start) || !Number.isFinite(word.end)) continue;
  if (word.end <= word.start) continue;
  segments.push({ start: word.start, end: word.end });
}

fs.writeFileSync(outputFile, JSON.stringify(segments, null, 2));

let merged = [];
for (const seg of segments) {
  if (merged.length === 0 || Math.abs(seg.start - merged[merged.length - 1].end) >= 0.05) {
    merged.push({ ...seg });
  } else {
    merged[merged.length - 1].end = seg.end;
  }
}

const deletedSeconds = merged.reduce((sum, seg) => sum + seg.end - seg.start, 0);
console.log(JSON.stringify({
  output: outputFile,
  selected: selected.length,
  segments: segments.length,
  previewMergedSegments: merged.length,
  previewDeletedSeconds: Number(deletedSeconds.toFixed(3)),
}, null, 2));
