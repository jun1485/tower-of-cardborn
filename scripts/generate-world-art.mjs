import { constants as fsConstants } from 'node:fs';
import { accessSync, existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const uiOutputDirectory = path.join(projectRoot, 'public', 'assets', 'ui');
const monsterOutputDirectory = path.join(projectRoot, 'public', 'assets', 'monsters');
const defaultModel = 'gemini-3.1-flash-image-preview';
const defaultDelayMs = 1200;
const defaultStylePreset = 'cute-pixel';

const stylePresets = {
  'cute-pixel': {
    label: '귀여운 도트',
    backgroundLines: [
      'STRICT PIXEL ART ONLY. Cute fantasy pixel-art environment for a turn-based card battle game.',
      'Retro 16-bit JRPG background, hard-edged pixel blocks, low-resolution sprite-game look, limited palette.',
      'Charming cozy mood, whimsical fantasy vibe, slightly brighter scene readability.',
      'No anti-aliasing, no painterly brush, no realistic texture, no photorealism, no cinematic blur.',
      'Soft cozy lighting, clear foreground-midground-background separation for gameplay readability.',
      'No characters, no text, no logo, no watermark, no UI frame.',
      'Keep wide composition and clean shapes for unit visibility.',
    ],
    monsterLines: [
      'STRICT PIXEL ART ONLY. Cute pixel-art monster battle sprite for a turn-based roguelike card game.',
      'Single creature full body, centered composition, strong silhouette readability.',
      'Super-deformed chibi proportion, clean hard-edged pixel clusters, limited palette, retro console game feel.',
      'Adorable expression and playful body language, reduce horror feeling and gore details.',
      'No anti-aliasing, no painterly render, no realistic shading, no photoreal detail.',
      'Simple plain backdrop for easy cutout, no text, no logo, no watermark, no extra characters.',
    ],
  },
  'painterly-dark': {
    label: '다크 페인터리',
    backgroundLines: [
      'Dark fantasy deckbuilding game environment concept art.',
      'Painterly semi-realistic style, high detail textures, atmospheric depth.',
      'No characters, no text, no logo, no watermark, no UI frame.',
      'Readable composition suitable for game background layering.',
    ],
    monsterLines: [
      'Dark fantasy monster concept art for a card-battle roguelike game.',
      'Single creature full body, centered composition, strong silhouette readability.',
      'Painterly semi-realistic rendering, dramatic rim light, high contrast.',
      'Simple subtle background, no text, no logo, no watermark, no extra characters.',
    ],
  },
};

const backgroundConfigs = {
  bg_combat_hd: {
    label: '전투 배경',
    rawOutputFile: 'bg_combat_hd.png',
    runtimeOutputFile: 'bg_combat_hd.svg',
    scene:
      'lush forest ruin battlefield, wide flat grassy meadow with stone path, vibrant trees and bushes, wildflowers, ancient columns, clear ground plane for character footing, pixel-art fantasy overworld',
    colorMood:
      'fresh spring green foliage, warm sunlight, bright cyan sky, colorful but balanced palette, high readability',
  },
  bg_map_1: {
    label: '맵 배경 1',
    rawOutputFile: 'bg_map_1.png',
    runtimeOutputFile: 'bg_map_1.svg',
    scene: 'ancient mountain pass with colossal ruins, low fog, moonlit clouds, epic wide landscape',
    colorMood: 'teal sky, mossy green terrain, gentle moonlight, bright readable palette',
  },
  bg_map_2: {
    label: '맵 배경 2',
    rawOutputFile: 'bg_map_2.png',
    runtimeOutputFile: 'bg_map_2.svg',
    scene: 'volcanic canyon crossing, cracked obsidian ground, lava glow, drifting ash, dramatic perspective',
    colorMood: 'deep plum rock with lively magma orange highlights, stylized colorful contrast',
  },
  bg_map_3: {
    label: '맵 배경 3',
    rawOutputFile: 'bg_map_3.png',
    runtimeOutputFile: 'bg_map_3.svg',
    scene: 'frozen necropolis plaza, broken statues, blue moonlight, drifting snow, ominous silence',
    colorMood: 'icy cyan with lavender shadow and bright snow sparkle, clean storybook look',
  },
};

const monsterConfigs = {
  jaw_worm: {
    label: 'Jaw Worm',
    rawOutputFile: 'jaw_worm_hd.png',
    runtimeOutputFile: 'jaw_worm_hd.svg',
    subject: 'massive armored sand-worm beast with plated jaws and serrated teeth',
    mood: 'predatory stance, aggressive profile',
  },
  cultist: {
    label: 'Cultist',
    rawOutputFile: 'cultist_hd.png',
    runtimeOutputFile: 'cultist_hd.svg',
    subject: 'fanatical hooded cultist with ritual dagger and tattered ceremonial robes',
    mood: 'manic posture, dark ritual aura',
  },
  louse_red: {
    label: 'Red Louse',
    rawOutputFile: 'louse_red_hd.png',
    runtimeOutputFile: 'louse_red_hd.svg',
    subject: 'crimson parasitic insect creature with spiked carapace and oversized maw',
    mood: 'skittering menace, compact silhouette',
  },
  fungi_beast: {
    label: 'Fungi Beast',
    rawOutputFile: 'fungi_beast_hd.png',
    runtimeOutputFile: 'fungi_beast_hd.svg',
    subject: 'hulking fungal monster with mossy hide, mushroom growths, and toxic spores',
    mood: 'slow heavy stance, corrupted nature energy',
  },
  gremlin_nob: {
    label: 'Gremlin Nob',
    rawOutputFile: 'gremlin_nob_hd.png',
    runtimeOutputFile: 'gremlin_nob_hd.svg',
    subject: 'towering gremlin warlord with heavy bone club, scarred skin, crude armor',
    mood: 'dominant roar pose, elite threat',
  },
  lagavulin: {
    label: 'Lagavulin',
    rawOutputFile: 'lagavulin_hd.png',
    runtimeOutputFile: 'lagavulin_hd.svg',
    subject: 'ancient stone guardian beast with glowing core and cracked monolith body',
    mood: 'dormant titan awakening, ominous pressure',
  },
  slime_boss: {
    label: 'Slime Boss',
    rawOutputFile: 'slime_boss_hd.png',
    runtimeOutputFile: 'slime_boss_hd.svg',
    subject: 'colossal acidic slime overlord with translucent body and trapped remains inside',
    mood: 'swelling mass, boss-level intimidation',
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

    const model =
      options.model ??
      process.env.GOOGLE_WORLD_ART_MODEL ??
      process.env.GOOGLE_IMAGE_MODEL ??
      defaultModel;
    const stylePreset = options.style ?? process.env.WORLD_ART_STYLE ?? defaultStylePreset;
    assertStylePreset(stylePreset, 'WORLD_ART_STYLE');
    const delayMs = options.delayMs ?? parseNonNegativeNumber(process.env.WORLD_ART_DELAY_MS) ?? defaultDelayMs;
    const backgroundAspectRatio = process.env.BACKGROUND_ART_ASPECT_RATIO ?? '16:9';
    const backgroundImageSize = process.env.BACKGROUND_ART_IMAGE_SIZE ?? '2K';
    const monsterAspectRatio = process.env.MONSTER_ART_ASPECT_RATIO ?? '1:1';
    const monsterImageSize = process.env.MONSTER_ART_IMAGE_SIZE ?? '1K';

    const tasks = resolveTasks({
      target: options.target,
      ids: options.ids,
      limit: options.limit,
      backgroundAspectRatio,
      backgroundImageSize,
      monsterAspectRatio,
      monsterImageSize,
      stylePreset,
    });

    if (tasks.length === 0) {
      console.log('생성 대상이 없습니다. 옵션을 확인해 주세요.');
      return;
    }

    if (options.dryRun) {
      console.log('드라이런 모드: 실제 API 요청 없이 생성 계획만 출력합니다.');
      console.log(`모델: ${model}`);
      console.log(`스타일: ${stylePresets[stylePreset].label} (${stylePreset})`);
      console.log(`SVG 래퍼 출력: ${options.emitSvg ? '활성' : '비활성'}`);
      console.log(`몬스터 누끼 처리: ${options.monsterCutout ? '활성' : '비활성'}`);
      console.log(`대상 개수: ${tasks.length}`);
      for (const task of tasks) {
        const targetPath = options.emitSvg ? task.runtimeOutputPath : task.rawOutputPath;
        console.log(`- ${task.kind}:${task.id} -> ${path.relative(projectRoot, targetPath)}`);
      }
      return;
    }

    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('오류: GOOGLE_AI_STUDIO_API_KEY(또는 GOOGLE_API_KEY) 환경 변수가 필요합니다.');
      process.exitCode = 1;
      return;
    }

    await mkdir(uiOutputDirectory, { recursive: true });
    await mkdir(monsterOutputDirectory, { recursive: true });

    console.log(`월드 아트 생성 시작: 총 ${tasks.length}개`);
    console.log(`모델: ${model}`);
    console.log(`스타일: ${stylePresets[stylePreset].label} (${stylePreset})`);
    console.log(`SVG 래퍼 출력: ${options.emitSvg ? '활성' : '비활성'}`);
    console.log(`몬스터 누끼 처리: ${options.monsterCutout ? '활성' : '비활성'}`);
    console.log(`저장 경로(UI): ${path.relative(projectRoot, uiOutputDirectory)}`);
    console.log(`저장 경로(몬스터): ${path.relative(projectRoot, monsterOutputDirectory)}`);

    let createdCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (let index = 0; index < tasks.length; index += 1) {
      const task = tasks[index];
      const primaryOutputPath = options.emitSvg ? task.runtimeOutputPath : task.rawOutputPath;

      if (!options.force && fileExists(primaryOutputPath)) {
        skippedCount += 1;
        console.log(`[${index + 1}/${tasks.length}] 건너뜀: ${task.id} (기존 파일 유지)`);
        continue;
      }

      console.log(`[${index + 1}/${tasks.length}] 생성 중: ${task.kind}:${task.id} (${task.label})`);

      try {
        const base64Data = await generateImage({
          apiKey,
          model,
          prompt: task.prompt,
          aspectRatio: task.aspectRatio,
          imageSize: task.imageSize,
        });
        await writeFile(task.rawOutputPath, Buffer.from(base64Data, 'base64'));
        if (task.kind === 'monster' && options.monsterCutout) {
          await applyCutout(task.rawOutputPath);
        }
        if (options.emitSvg) {
          const runtimeBuffer = await readFile(task.rawOutputPath);
          const svgContent = createEmbeddedSvg(task.aspectRatio, runtimeBuffer.toString('base64'));
          await writeFile(task.runtimeOutputPath, svgContent, 'utf8');
        }
        createdCount += 1;
        console.log(`완료: ${task.id} -> ${path.relative(projectRoot, primaryOutputPath)}`);
      } catch (error) {
        failedCount += 1;
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        console.error(`실패: ${task.id} -> ${errorMessage}`);
      }

      if (index < tasks.length - 1 && delayMs > 0) {
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
    target: 'all',
    ids: null,
    limit: null,
    delayMs: null,
    model: null,
    emitSvg: true,
    monsterCutout: true,
    force: false,
    dryRun: false,
    help: false,
    style: null,
  };

  for (const arg of args) {
    if (arg === '--force') {
      parsed.force = true;
      continue;
    }
    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }
    if (arg === '--svg') {
      parsed.emitSvg = true;
      continue;
    }
    if (arg === '--no-svg') {
      parsed.emitSvg = false;
      continue;
    }
    if (arg === '--monster-cutout') {
      parsed.monsterCutout = true;
      continue;
    }
    if (arg === '--no-monster-cutout') {
      parsed.monsterCutout = false;
      continue;
    }
    if (arg === '--help') {
      parsed.help = true;
      continue;
    }
    if (arg.startsWith('--target=')) {
      const target = arg.slice('--target='.length);
      if (target !== 'all' && target !== 'background' && target !== 'monster') {
        throw new Error('오류: --target 값은 all/background/monster 중 하나여야 합니다.');
      }
      parsed.target = target;
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
    if (arg.startsWith('--model=')) {
      const model = arg.slice('--model='.length).trim();
      if (model.length === 0) {
        throw new Error('오류: --model 값이 비어 있습니다.');
      }
      parsed.model = model;
      continue;
    }
    if (arg.startsWith('--style=')) {
      const style = arg.slice('--style='.length).trim();
      assertStylePreset(style, '--style');
      parsed.style = style;
      continue;
    }
    throw new Error(`오류: 지원하지 않는 옵션입니다. (${arg})`);
  }

  return parsed;
}

function printHelp() {
  console.log('월드 아트 생성 스크립트');
  console.log('사용법: npm run generate:world-art -- [옵션]');
  console.log('필수 환경 변수(실행 시): GOOGLE_AI_STUDIO_API_KEY');
  console.log('--target=all|background|monster : 생성 대상 분류 선택');
  console.log('--ids=a,b,c                     : 특정 ID만 생성');
  console.log('--limit=숫자                    : 앞에서부터 생성 개수 제한');
  console.log('--delay=밀리초                  : 요청 간 대기 시간 조정');
  console.log('--model=모델명                  : 모델 강제 지정');
  console.log(`--style=스타일                  : 스타일 프리셋 (${Object.keys(stylePresets).join(', ')})`);
  console.log('--force                         : 기존 파일 덮어쓰기');
  console.log('--svg / --no-svg                : SVG 래퍼 출력 여부 (기본: svg 출력)');
  console.log('--monster-cutout / --no-monster-cutout : 몬스터 누끼 처리 여부 (기본: 누끼 처리)');
  console.log('--dry-run                       : API 호출 없이 대상만 출력');
  console.log('--help                          : 도움말 출력');
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

function resolveTasks({
  target,
  ids,
  limit,
  backgroundAspectRatio,
  backgroundImageSize,
  monsterAspectRatio,
  monsterImageSize,
  stylePreset,
}) {
  const backgrounds =
    target === 'all' || target === 'background'
      ? Object.entries(backgroundConfigs).map(([id, config]) => ({
          kind: 'background',
          id,
          label: config.label,
          rawOutputPath: path.join(uiOutputDirectory, config.rawOutputFile),
          runtimeOutputPath: path.join(uiOutputDirectory, config.runtimeOutputFile),
          aspectRatio: backgroundAspectRatio,
          imageSize: backgroundImageSize,
          prompt: createBackgroundPrompt(config, stylePreset),
        }))
      : [];

  const monsters =
    target === 'all' || target === 'monster'
      ? Object.entries(monsterConfigs).map(([id, config]) => ({
          kind: 'monster',
          id,
          label: config.label,
          rawOutputPath: path.join(monsterOutputDirectory, config.rawOutputFile),
          runtimeOutputPath: path.join(monsterOutputDirectory, config.runtimeOutputFile),
          aspectRatio: monsterAspectRatio,
          imageSize: monsterImageSize,
          prompt: createMonsterPrompt(config, stylePreset),
        }))
      : [];

  let tasks = backgrounds.concat(monsters);

  if (ids && ids.size > 0) {
    tasks = tasks.filter((task) => ids.has(task.id));
  }
  if (limit !== null) {
    tasks = tasks.slice(0, limit);
  }

  return tasks;
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

function createBackgroundPrompt(config, stylePreset) {
  const preset = stylePresets[stylePreset];
  return [
    ...preset.backgroundLines,
    `Scene: ${config.scene}.`,
    `Color mood: ${config.colorMood}.`,
  ].join('\n');
}

function createMonsterPrompt(config, stylePreset) {
  const preset = stylePresets[stylePreset];
  return [
    ...preset.monsterLines,
    `Subject: ${config.subject}.`,
    `Mood direction: ${config.mood}.`,
  ].join('\n');
}

function assertStylePreset(stylePreset, sourceLabel) {
  if (Object.prototype.hasOwnProperty.call(stylePresets, stylePreset)) {
    return;
  }
  throw new Error(`오류: ${sourceLabel} 값은 ${Object.keys(stylePresets).join('/')} 중 하나여야 합니다.`);
}

function createEmbeddedSvg(aspectRatio, base64Data) {
  const { width, height } = resolveSvgViewBox(aspectRatio);
  return [
    '<svg xmlns="http://www.w3.org/2000/svg"',
    ` viewBox="0 0 ${width} ${height}"`,
    ` width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice">`,
    `<image href="data:image/png;base64,${base64Data}" width="${width}" height="${height}" />`,
    '</svg>',
  ].join('');
}

function resolveSvgViewBox(aspectRatio) {
  if (typeof aspectRatio !== 'string') {
    return { width: 1, height: 1 };
  }

  const [widthText, heightText] = aspectRatio.split(':');
  const width = Number(widthText);
  const height = Number(heightText);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { width: 1, height: 1 };
  }

  return { width, height };
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
