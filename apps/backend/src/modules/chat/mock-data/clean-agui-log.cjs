#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TARGET_TYPES = new Set([
  'THINKING_TEXT_MESSAGE_START',
  'THINKING_TEXT_MESSAGE_CONTENT',
  'THINKING_TEXT_MESSAGE_END'
]);

function processLine(line) {
  if (!line.startsWith('data:')) return line;

  const jsonStr = line.slice(5);

  try {
    const obj = JSON.parse(jsonStr);

    if (TARGET_TYPES.has(obj.type)) {
      delete obj.message_id;
    }

    return 'data:' + JSON.stringify(obj);
  } catch (err) {
    // 解析失败就原样返回（防止破坏数据）
    return line;
  }
}

function main() {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];

  if (!inputFile) {
    console.error('用法: node clean-agui-log.js input.txt [output.txt]');
    process.exit(1);
  }

  const input = fs.readFileSync(inputFile, 'utf-8');

  const lines = input.split('\n');
  const result = lines.map(processLine).join('\n');

  if (outputFile) {
    fs.writeFileSync(outputFile, result, 'utf-8');
    console.log(`已输出到: ${outputFile}`);
  } else {
    console.log(result);
  }
}

main();