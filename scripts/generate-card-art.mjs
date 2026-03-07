import { constants as fsConstants } from 'node:fs';
import { accessSync, existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const cardsSourcePath = path.join(projectRoot, 'src', 'data', 'cards.ts');
const outputDirectory = path.join(projectRoot, 'public', 'assets', 'cards');
const defaultModel = 'gemini-3.1-flash-image-preview';
const defaultDelayMs = 1200;
const defaultStylePreset = 'cute-pixel';
const supportedClasses = ['warrior', 'archer', 'mage', 'assassin'];

const stylePresets = {
  'cute-pixel': {
    label: '귀여운 도트',
    lines: [
      'STRICT PIXEL ART ONLY. Cute chibi fantasy card illustration for a deckbuilding roguelike game.',
      'Retro 16-bit JRPG feel, hard-edged pixel clusters, low-resolution game sprite aesthetic.',
      'Adorable expression, rounded silhouette, playful action posing, readable at small card size.',
      'Full-bleed composition required: fill entire canvas edge-to-edge with environment and action.',
      'No empty margins, no blank padding, no letterbox bars, no isolated sprite on plain backdrop.',
      'No anti-aliasing, no painterly brush, no realistic texture, no photoreal detail, no cinematic blur.',
      'No UI frame, no border, no text, no letters, no numbers, no watermark.',
      'Portrait composition suitable for card artwork.',
    ],
  },
  'painterly-dark': {
    label: '다크 페인터리',
    lines: [
      'Fantasy deckbuilding game illustration, detailed digital painting.',
      'Single clear focal action, dynamic motion, dramatic lighting.',
      'No UI frame, no border, no text, no letters, no numbers, no watermark.',
      'Portrait composition suitable for card artwork.',
    ],
  },
};

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
    const stylePreset = options.style ?? process.env.CARD_ART_STYLE ?? defaultStylePreset;
    assertStylePreset(stylePreset, 'CARD_ART_STYLE');
    const delayMs = options.delayMs ?? parseNonNegativeNumber(process.env.CARD_ART_DELAY_MS) ?? defaultDelayMs;
    const aspectRatio = process.env.CARD_ART_ASPECT_RATIO ?? '3:4';
    const imageSize = process.env.CARD_ART_IMAGE_SIZE ?? null;

    const source = await readFile(cardsSourcePath, 'utf8');
    const cards = parseCards(source);
    const cardClassMap = parseCardClassMap(source);
    const targetCards = selectCards(cards, options, cardClassMap);

    if (targetCards.length === 0) {
      console.log('생성 대상 카드가 없습니다. 옵션을 확인해 주세요.');
      return;
    }

    await mkdir(outputDirectory, { recursive: true });

    console.log(`카드 아트 생성 시작: 총 ${targetCards.length}장`);
    console.log(`모델: ${model}`);
    console.log(`스타일: ${stylePresets[stylePreset].label} (${stylePreset})`);
    if (options.classes && options.classes.size > 0) {
      console.log(`클래스 필터: ${Array.from(options.classes).join(', ')}`);
    }
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
        const cardClass = resolveCardClass(card.id, cardClassMap);
        const prompt = createPrompt(card, stylePreset, cardClass);
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
    style: null,
    classes: null,
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
    if (arg.startsWith('--style=')) {
      const style = arg.slice('--style='.length).trim();
      assertStylePreset(style, '--style');
      parsed.style = style;
      continue;
    }
    if (arg.startsWith('--class=')) {
      const classes = arg
        .slice('--class='.length)
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      if (classes.length === 0) {
        throw new Error('오류: --class 값이 비어 있습니다.');
      }
      for (const className of classes) {
        assertSupportedClass(className, '--class');
      }
      parsed.classes = new Set(classes);
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
  console.log(`--class=클래스     : 특정 클래스만 생성 (${supportedClasses.join(', ')})`);
  console.log(`--style=스타일     : 스타일 프리셋 (${Object.keys(stylePresets).join(', ')})`);
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

function selectCards(cards, cliOptions, cardClassMap) {
  let selected = cards.filter((card) => cliOptions.includeUpgraded || !card.id.endsWith('+'));

  if (cliOptions.classes && cliOptions.classes.size > 0) {
    selected = selected.filter((card) => {
      const className = resolveCardClass(card.id, cardClassMap);
      return className !== null && cliOptions.classes.has(className);
    });
  }

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

function createPrompt(card, stylePreset, cardClass) {
  const actionTone = mapCardTypeToTone(card.type, stylePreset);
  const heroIdentity = resolveHeroIdentity(cardClass, stylePreset);
  const preset = stylePresets[stylePreset];
  return [
    ...preset.lines,
    `Character continuity rule: ${heroIdentity}`,
    'If a humanoid hero appears, always use this exact protagonist with identical face, hair, outfit, and signature weapon.',
    'Do not swap to a different hero, gender, costume, or hair color in this card.',
    `Card name: ${card.name}`,
    `Card type intent: ${actionTone}`,
    `Effect summary: ${card.description}`,
  ].join('\n');
}

function mapCardTypeToTone(type, stylePreset) {
  if (stylePreset === 'cute-pixel') {
    if (type === 'attack') return 'cute energetic strike with playful impact effect';
    if (type === 'skill') return 'cute tactical move with clear defensive motion';
    return 'cute magical empowerment aura with sparkly charm';
  }
  if (type === 'attack') return 'aggressive combat moment';
  if (type === 'skill') return 'defensive or tactical action';
  return 'mystic empowerment aura';
}

function assertStylePreset(stylePreset, sourceLabel) {
  if (Object.prototype.hasOwnProperty.call(stylePresets, stylePreset)) {
    return;
  }
  throw new Error(`오류: ${sourceLabel} 값은 ${Object.keys(stylePresets).join('/')} 중 하나여야 합니다.`);
}

function assertSupportedClass(className, sourceLabel) {
  if (supportedClasses.includes(className)) {
    return;
  }
  throw new Error(`오류: ${sourceLabel} 값은 ${supportedClasses.join('/')} 중 하나여야 합니다.`);
}

function parseCardClassMap(sourceText) {
  const classMap = new Map();

  registerCardIds(classMap, 'warrior', parseCardIdArray(sourceText, 'STARTER_DECK'));
  registerCardIds(classMap, 'archer', parseCardIdArray(sourceText, 'ARCHER_STARTER_DECK'));
  registerCardIds(classMap, 'mage', parseCardIdArray(sourceText, 'MAGE_STARTER_DECK'));
  registerCardIds(classMap, 'assassin', parseCardIdArray(sourceText, 'ASSASSIN_STARTER_DECK'));

  registerCardIds(classMap, 'warrior', parseCardIdArray(sourceText, 'WARRIOR_REWARD_POOL'));
  registerCardIds(classMap, 'archer', parseCardIdArray(sourceText, 'ARCHER_REWARD_POOL'));
  registerCardIds(classMap, 'mage', parseCardIdArray(sourceText, 'MAGE_REWARD_POOL'));
  registerCardIds(classMap, 'assassin', parseCardIdArray(sourceText, 'ASSASSIN_REWARD_POOL'));

  return classMap;
}

function parseCardIdArray(sourceText, constName) {
  const expression = new RegExp(
    `const\\s+${constName}\\s*:\\s*readonly\\s+string\\[\\]\\s*=\\s*\\[(?<body>[\\s\\S]*?)\\];`,
    'm',
  );
  const matched = sourceText.match(expression);
  const body = matched?.groups?.body;
  if (!body) {
    return [];
  }
  const ids = [];
  const idExpression = /'([^']+)'/g;
  let idMatch = idExpression.exec(body);
  while (idMatch) {
    ids.push(idMatch[1]);
    idMatch = idExpression.exec(body);
  }
  return ids;
}

function registerCardIds(classMap, className, ids) {
  for (const cardId of ids) {
    classMap.set(cardId, className);
  }
}

function resolveCardClass(cardId, cardClassMap) {
  const baseId = resolveBaseCardId(cardId);
  return cardClassMap.get(baseId) ?? null;
}

function resolveBaseCardId(cardId) {
  return cardId.endsWith('+') ? cardId.slice(0, -1) : cardId;
}

function resolveHeroIdentity(cardClass, stylePreset) {
  const className = cardClass ?? 'warrior';
  if (stylePreset === 'cute-pixel') {
    if (className === 'archer') {
      return 'same chibi archer heroine across all archer cards: short light-brown hair, green hooded cloak, leather tunic, wooden bow, warm brown eyes.';
    }
    if (className === 'mage') {
      return 'same chibi mage heroine across all mage cards: silver-blue bob hair, navy robe with cyan rune trims, glowing staff with blue crystal.';
    }
    if (className === 'assassin') {
      return 'same chibi assassin heroine across all assassin cards: dark violet short hair, black hooded outfit, twin daggers, crimson sash accents.';
    }
    return 'same chibi warrior heroine across all warrior cards: short dark-brown hair, red scarf, steel armor, round shield, broad sword.';
  }

  if (className === 'archer') return 'same archer protagonist with green hood and wooden bow.';
  if (className === 'mage') return 'same mage protagonist with rune robe and crystal staff.';
  if (className === 'assassin') return 'same assassin protagonist with hood and twin daggers.';
  return 'same warrior protagonist with heavy armor, shield, and sword.';
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
