import { constants as fsConstants } from 'node:fs';
import { accessSync, existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const cardsSourcePath = path.join(projectRoot, 'src', 'data', 'cards.ts');
const outputDirectory = path.join(projectRoot, 'public', 'assets', 'cards');
const defaultModel = 'gemini-2.5-flash-image';
const defaultDelayMs = 1200;

const cardPattern =
  /id:\s*'(?<id>[^']+)',\s*name:\s*'(?<name>[^']+)',\s*description:\s*'(?<description>[^']+)',\s*type:\s*'(?<type>attack|skill|power)'/gms;

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
    const delayMs = options.delayMs ?? parseNonNegativeNumber(process.env.CARD_ART_DELAY_MS) ?? defaultDelayMs;
    const aspectRatio = process.env.CARD_ART_ASPECT_RATIO ?? '3:4';
    const imageSize = process.env.CARD_ART_IMAGE_SIZE ?? null;

    const source = await readFile(cardsSourcePath, 'utf8');
    const cards = parseCards(source);
    const targetCards = selectCards(cards, options);

    if (targetCards.length === 0) {
      console.log('생성 대상 카드가 없습니다. 옵션을 확인해 주세요.');
      return;
    }

    await mkdir(outputDirectory, { recursive: true });

    console.log(`카드 아트 생성 시작: 총 ${targetCards.length}장`);
    console.log(`모델: ${model}`);
    console.log(`비율: ${aspectRatio}`);
    console.log(`저장 경로: ${path.relative(projectRoot, outputDirectory)}`);

    let createdCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (let index = 0; index < targetCards.length; index += 1) {
      const card = targetCards[index];
      const filePath = path.join(outputDirectory, `${card.id}.png`);

      if (!options.force && fileExists(filePath)) {
        skippedCount += 1;
        console.log(`[${index + 1}/${targetCards.length}] 건너뜀: ${card.id} (기존 파일 유지)`);
        continue;
      }

      console.log(`[${index + 1}/${targetCards.length}] 생성 중: ${card.id} (${card.name})`);

      try {
        const prompt = createPrompt(card);
        const base64Data = await generateImage({
          apiKey,
          model,
          prompt,
          aspectRatio,
          imageSize,
        });
        await writeFile(filePath, Buffer.from(base64Data, 'base64'));
        createdCount += 1;
        console.log(`완료: ${card.id} -> ${path.relative(projectRoot, filePath)}`);
      } catch (error) {
        failedCount += 1;
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        console.error(`실패: ${card.id} -> ${errorMessage}`);
      }

      if (index < targetCards.length - 1 && delayMs > 0) {
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
    includeUpgraded: false,
    force: false,
    help: false,
    limit: null,
    ids: null,
    delayMs: null,
  };

  for (const arg of args) {
    if (arg === '--include-upgraded') {
      parsed.includeUpgraded = true;
      continue;
    }
    if (arg === '--force') {
      parsed.force = true;
      continue;
    }
    if (arg === '--help') {
      parsed.help = true;
      continue;
    }
    if (arg.startsWith('--limit=')) {
      parsed.limit = parsePositiveNumber(arg.slice('--limit='.length));
      if (parsed.limit === null) {
        throw new Error('오류: --limit 값은 1 이상의 숫자여야 합니다.');
      }
      continue;
    }
    if (arg.startsWith('--delay=')) {
      parsed.delayMs = parseNonNegativeNumber(arg.slice('--delay='.length));
      if (parsed.delayMs === null) {
        throw new Error('오류: --delay 값은 0 이상의 숫자여야 합니다.');
      }
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
    throw new Error(`오류: 지원하지 않는 옵션입니다. (${arg})`);
  }

  return parsed;
}

function printHelp() {
  console.log('카드 아트 생성 스크립트');
  console.log('사용법: npm run generate:card-art -- [옵션]');
  console.log('필수 환경 변수: GOOGLE_AI_STUDIO_API_KEY');
  console.log('--include-upgraded : + 카드 포함 생성');
  console.log('--force            : 기존 파일 덮어쓰기');
  console.log('--limit=숫자       : 앞에서부터 생성 개수 제한');
  console.log('--delay=밀리초     : 요청 간 대기 시간 조정');
  console.log('--ids=a,b,c        : 특정 카드 ID만 생성');
  console.log('--help             : 도움말 출력');
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

function parseCards(sourceText) {
  const cards = [];
  const foundIds = new Set();
  cardPattern.lastIndex = 0;
  let match = cardPattern.exec(sourceText);

  while (match) {
    const id = match.groups?.id;
    const name = match.groups?.name;
    const description = match.groups?.description;
    const type = match.groups?.type;

    if (!id || !name || !description || !type) {
      match = cardPattern.exec(sourceText);
      continue;
    }

    if (!foundIds.has(id)) {
      foundIds.add(id);
      cards.push({ id, name, description, type });
    }

    match = cardPattern.exec(sourceText);
  }

  return cards;
}

function selectCards(cards, cliOptions) {
  let selected = cards.filter((card) => cliOptions.includeUpgraded || !card.id.endsWith('+'));

  if (cliOptions.ids && cliOptions.ids.size > 0) {
    selected = selected.filter((card) => cliOptions.ids.has(card.id));
  }

  if (cliOptions.limit !== null) {
    selected = selected.slice(0, cliOptions.limit);
  }

  return selected;
}

function parsePositiveNumber(value) {
  if (!value) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) return null;
  return number;
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

function createPrompt(card) {
  const actionTone = mapCardTypeToTone(card.type);
  return [
    'Fantasy deckbuilding game illustration, detailed digital painting.',
    `Card name: ${card.name}`,
    `Card type intent: ${actionTone}`,
    `Effect summary: ${card.description}`,
    'Single clear focal action, dynamic motion, dramatic lighting.',
    'No UI frame, no border, no text, no letters, no numbers, no watermark.',
    'Portrait composition suitable for card artwork.',
  ].join('\n');
}

function mapCardTypeToTone(type) {
  if (type === 'attack') return 'aggressive combat moment';
  if (type === 'skill') return 'defensive or tactical action';
  return 'mystic empowerment aura';
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
