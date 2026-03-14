// 앱 아이콘 생성 스크립트 (Google AI Studio API - Nano Banana 2)

import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const outputDirectory = path.join(projectRoot, 'public', 'assets', 'ui');
const defaultModel = 'gemini-3.1-flash-image-preview';

const ICON_PROMPT = [
  'STRICT PIXEL ART ONLY. App icon for a turn-based card roguelike game called "Tower of Cardborn".',
  'A cute chibi warrior heroine holding a glowing card in one hand and a sword in the other, standing in front of a mystical stone tower.',
  'Super-deformed chibi proportion, visible hard-edged pixel clusters, limited palette, retro 16-bit JRPG vibe.',
  'Adorable facial expression, confident heroic pose.',
  'Rich warm fantasy color palette: deep purple tower background, golden card glow, steel armor highlights.',
  'Icon-friendly composition: character centered, fills most of the frame, simple gradient background.',
  'No anti-aliasing, no painterly brush, no realistic shading, no photorealistic detail.',
  'No text, no logo, no watermark, no border, no rounded corners.',
  'Must be instantly recognizable at very small sizes (48x48 pixels).',
].join('\n');

void main();

async function main() {
  try {
    loadEnvFile(path.join(projectRoot, '.env.local'));
    loadEnvFile(path.join(projectRoot, '.env'));

    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('오류: GOOGLE_AI_STUDIO_API_KEY(또는 GOOGLE_API_KEY) 환경 변수가 필요합니다.');
      process.exitCode = 1;
      return;
    }

    const model = process.env.GOOGLE_IMAGE_MODEL ?? defaultModel;
    await mkdir(outputDirectory, { recursive: true });

    console.log('앱 아이콘 생성 시작');
    console.log(`모델: ${model}`);
    console.log(`저장 경로: ${path.relative(projectRoot, outputDirectory)}`);

    const filePath = path.join(outputDirectory, 'app_icon.png');

    const base64Data = await generateImage({
      apiKey,
      model,
      prompt: ICON_PROMPT,
      aspectRatio: '1:1',
      imageSize: '1K',
    });

    await writeFile(filePath, Buffer.from(base64Data, 'base64'));
    console.log(`완료: ${path.relative(projectRoot, filePath)}`);
    console.log('');
    console.log('Android 아이콘 적용 방법:');
    console.log('1. Android Studio에서 android 프로젝트 열기');
    console.log('2. app > res > mipmap 우클릭 > New > Image Asset');
    console.log(`3. Source Asset > Path에 생성된 이미지 선택`);
    console.log('4. Foreground/Background 조절 후 Finish');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error(`오류: ${errorMessage}`);
    process.exitCode = 1;
  }
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/u);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) continue;
    const delimiterIndex = line.indexOf('=');
    if (delimiterIndex < 0) continue;

    const key = line.slice(0, delimiterIndex).trim();
    if (key.length === 0 || process.env[key]) continue;

    const rawValue = line.slice(delimiterIndex + 1).trim();
    const value = rawValue.replace(/^"(.*)"$/u, '$1').replace(/^'(.*)'$/u, '$1');
    process.env[key] = value;
  }
}

async function generateImage({ apiKey, model, prompt, aspectRatio, imageSize }) {
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}` +
    `:generateContent?key=${encodeURIComponent(apiKey)}`;

  const generationConfig = {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: { aspectRatio },
  };
  if (imageSize) {
    generationConfig.imageConfig.imageSize = imageSize;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message ?? JSON.stringify(payload);
    throw new Error(`API 요청 실패 (${response.status}): ${message}`);
  }

  const imageBase64 = extractInlineImageData(payload);
  if (!imageBase64) {
    throw new Error('이미지 데이터 응답 누락');
  }

  return imageBase64;
}

function extractInlineImageData(payload) {
  const candidates = payload?.candidates;
  if (!Array.isArray(candidates)) return null;

  for (const candidate of candidates) {
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) continue;

    for (const part of parts) {
      const inlineData = part?.inlineData ?? part?.inline_data;
      if (!inlineData) continue;

      const mimeType = inlineData.mimeType ?? inlineData.mime_type;
      const data = inlineData.data;
      if (typeof mimeType === 'string' && mimeType.startsWith('image/') && typeof data === 'string') {
        return data;
      }
    }
  }

  return null;
}
