import { constants as fsConstants } from 'node:fs';
import { accessSync, existsSync, readFileSync } from 'node:fs';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const outputDirectory = path.join(projectRoot, 'public', 'assets', 'classes');
const defaultModel = 'gemini-3-pro-image-preview';
const defaultDelayMs = 1200;

const classConfigs = {
  warrior: {
    label: '전사',
    subject: 'battle-hardened knight with heavy armor, broad shoulders, massive sword',
    palette: 'steel gray, muted crimson accents',
  },
  archer: {
    label: '궁수',
    subject: 'swift ranger with layered leather armor, recurved bow, poised stance',
    palette: 'forest green, bronze accents',
  },
  mage: {
    label: '마법사',
    subject: 'arcane sorcerer with runic robes, glowing staff, mystical aura',
    palette: 'indigo blue, cyan magical highlights',
  },
  assassin: {
    label: '암살자',
    subject: 'shadow assassin with hooded cloak, dual daggers, silent lethal posture',
    palette: 'dark charcoal, deep violet accents',
  },
};

void main();

async function main() {
  try {
    const options = parseCliOptions(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return;
    }

    loadEnvFile(path.join(projectRoot, '.env.local'));
    loadEnvFile(path.join(projectRoot, '.env'));

    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('오류: GOOGLE_AI_STUDIO_API_KEY(또는 GOOGLE_API_KEY) 환경 변수가 필요합니다.');
      process.exitCode = 1;
      return;
    }

    const model = process.env.GOOGLE_IMAGE_MODEL ?? defaultModel;
    const delayMs = parseNonNegativeNumber(process.env.CLASS_ART_DELAY_MS) ?? defaultDelayMs;
    const aspectRatio = process.env.CLASS_ART_ASPECT_RATIO ?? '3:4';
    const imageSize = process.env.CLASS_ART_IMAGE_SIZE ?? process.env.CARD_ART_IMAGE_SIZE ?? '1K';

    const classIds = resolveClassIds(options.ids);
    if (classIds.length === 0) {
      console.log('생성 대상 클래스가 없습니다. 옵션을 확인해 주세요.');
      return;
    }

    await mkdir(outputDirectory, { recursive: true });

    console.log(`클래스 아트 생성 시작: 총 ${classIds.length}개`);
    console.log(`모델: ${model}`);
    console.log(`비율: ${aspectRatio}`);
    console.log(`누끼 처리: ${options.cutout ? '활성' : '비활성'}`);
    console.log(`저장 경로: ${path.relative(projectRoot, outputDirectory)}`);

    let createdCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (let index = 0; index < classIds.length; index += 1) {
      const classId = classIds[index];
      const config = classConfigs[classId];
      const filePath = path.join(outputDirectory, `${classId}.png`);

      if (!options.force && fileExists(filePath)) {
        skippedCount += 1;
        console.log(`[${index + 1}/${classIds.length}] 건너뜀: ${classId} (기존 파일 유지)`);
        continue;
      }

      console.log(`[${index + 1}/${classIds.length}] 생성 중: ${classId} (${config.label})`);

      try {
        const prompt = createPrompt(config);
        const base64Data = await generateImage({
          apiKey,
          model,
          prompt,
          aspectRatio,
          imageSize,
        });
        await writeFile(filePath, Buffer.from(base64Data, 'base64'));
        if (options.cutout) {
          await applyCutout(filePath);
        }
        createdCount += 1;
        console.log(`완료: ${classId} -> ${path.relative(projectRoot, filePath)}`);
      } catch (error) {
        failedCount += 1;
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        console.error(`실패: ${classId} -> ${errorMessage}`);
      }

      if (index < classIds.length - 1 && delayMs > 0) {
        await sleep(delayMs);
      }
    }

    console.log('---');
    console.log(`생성 완료: ${createdCount}`);
    console.log(`건너뜀: ${skippedCount}`);
    console.log(`실패: ${failedCount}`);

    if (failedCount > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error(`오류: ${errorMessage}`);
    process.exitCode = 1;
  }
}

function parseCliOptions(args) {
  const parsed = {
    force: false,
    help: false,
    ids: null,
    cutout: true,
  };

  for (const arg of args) {
    if (arg === '--force') {
      parsed.force = true;
      continue;
    }
    if (arg === '--help') {
      parsed.help = true;
      continue;
    }
    if (arg.startsWith('--ids=')) {
      parsed.ids = new Set(
        arg
          .slice('--ids='.length)
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id.length > 0),
      );
      continue;
    }
    if (arg === '--cutout') {
      parsed.cutout = true;
      continue;
    }
    if (arg === '--no-cutout') {
      parsed.cutout = false;
      continue;
    }
    throw new Error(`오류: 지원하지 않는 옵션입니다. (${arg})`);
  }

  return parsed;
}

function printHelp() {
  console.log('클래스 아트 생성 스크립트');
  console.log('사용법: npm run generate:class-art -- [옵션]');
  console.log('필수 환경 변수: GOOGLE_AI_STUDIO_API_KEY');
  console.log('--force         : 기존 파일 덮어쓰기');
  console.log('--ids=a,b,c     : 특정 클래스만 생성 (warrior, archer, mage, assassin)');
  console.log('--cutout        : 배경 제거 강제 활성');
  console.log('--no-cutout     : 배경 제거 비활성');
  console.log('--help          : 도움말 출력');
}

function resolveClassIds(selectedIds) {
  const available = Object.keys(classConfigs);
  if (!selectedIds || selectedIds.size === 0) return available;
  return available.filter((classId) => selectedIds.has(classId));
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

function parseNonNegativeNumber(value) {
  if (!value) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) return null;
  return number;
}

function fileExists(filePath) {
  try {
    accessSync(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function createPrompt(config) {
  return [
    'Stylized dark-fantasy character concept art for a deckbuilding roguelike game.',
    'One single hero character centered in frame, full body visible, dynamic but readable silhouette.',
    'Painterly brush strokes, strong contrast, rim lighting, dramatic mood.',
    `Character archetype: ${config.subject}.`,
    `Color direction: ${config.palette}.`,
    'Pose should feel iconic and recognizable at small thumbnail size.',
    'No text, no logo, no UI frame, no watermark, no extra characters.',
    'Simple subtle background, character readability prioritized.',
  ].join('\n');
}

async function applyCutout(filePath) {
  const tempPath = `${filePath}.cutout.png`;
  await runCommand('rembg', ['i', filePath, tempPath]);
  await rm(filePath, { force: true });
  await rename(tempPath, filePath);
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(new Error(`명령 실행 실패 (${command}): ${error.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      const message = stderr.trim().length > 0 ? stderr.trim() : `종료 코드 ${code}`;
      reject(new Error(`명령 실패 (${command}): ${message}`));
    });
  });
}

async function generateImage({ apiKey, model, prompt, aspectRatio, imageSize }) {
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}` +
    `:generateContent?key=${encodeURIComponent(apiKey)}`;

  const generationConfig = {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio,
    },
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
    const message = extractErrorMessage(payload);
    throw new Error(`API 요청 실패 (${response.status}): ${message}`);
  }

  const imageBase64 = extractInlineImageData(payload);
  if (!imageBase64) {
    throw new Error('이미지 데이터 응답 누락');
  }

  return imageBase64;
}

function extractErrorMessage(payload) {
  const message = payload?.error?.message;
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }
  try {
    return JSON.stringify(payload);
  } catch {
    return '오류 메시지 파싱 실패';
  }
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

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
