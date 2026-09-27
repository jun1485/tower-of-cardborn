// ElevenLabs API 기반 게임 효과음 생성 스크립트
// 사용법: ELEVENLABS_API_KEY=키 node scripts/generate-sfx.mjs [이름...]

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const API_URL = 'https://api.elevenlabs.io/v1/sound-generation';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'assets', 'audio');
const DELAY_MS = 1500;

// #region 효과음 프롬프트 정의
const SFX_PROMPTS = {
  card_attack: {
    text: 'Short sharp sword slash impact, metallic blade cutting through air, fantasy melee attack, punchy and satisfying, game sound effect',
    duration_seconds: 0.6,
    prompt_influence: 0.5,
  },
  card_skill: {
    text: 'Magical spell cast with shimmering energy, arcane power activation, fantasy skill ability, mystical whoosh with sparkles, game sound effect',
    duration_seconds: 0.7,
    prompt_influence: 0.5,
  },
  card_power: {
    text: 'Power-up activation sound, deep resonant energy surge building up, fantasy buff ability, glowing aura ignition, game sound effect',
    duration_seconds: 0.8,
    prompt_influence: 0.5,
  },
  enemy_hit: {
    text: 'Enemy taking damage impact, fleshy hit with slight crunch, fantasy combat hit, satisfying strike landing, game sound effect',
    duration_seconds: 0.5,
    prompt_influence: 0.5,
  },
  player_hit: {
    text: 'Player receiving damage, heavy painful impact, body hit with grunt undertone, fantasy damage taken, alarming game sound effect',
    duration_seconds: 0.5,
    prompt_influence: 0.5,
  },
  block: {
    text: 'Shield block deflection, metallic defensive clang, fantasy armor absorbing blow, crisp protective ting, game sound effect',
    duration_seconds: 0.5,
    prompt_influence: 0.5,
  },
  turn_end: {
    text: 'Soft subtle turn transition whoosh, gentle page turn or wind sweep, calm transition sound, game UI sound effect',
    duration_seconds: 0.5,
    prompt_influence: 0.4,
  },
  card_draw: {
    text: 'Quick card draw from deck, crisp paper slide, playing card being dealt, clean and short, game sound effect',
    duration_seconds: 0.5,
    prompt_influence: 0.5,
  },
  heal: {
    text: 'Magical healing restoration, warm sparkling chime with gentle ascending notes, soothing recovery, fantasy heal spell, game sound effect',
    duration_seconds: 0.8,
    prompt_influence: 0.5,
  },
  upgrade: {
    text: 'Item upgrade enhancement, ascending magical tones with crystalline shimmer, power forging, fantasy card upgrade, game sound effect',
    duration_seconds: 0.8,
    prompt_influence: 0.5,
  },
  reward_pick: {
    text: 'Reward pickup collection, satisfying two-note ascending chime, treasure acquired, positive feedback jingle, game sound effect',
    duration_seconds: 0.5,
    prompt_influence: 0.5,
  },
  map_select: {
    text: 'UI selection confirm, soft pleasant click with subtle chime, gentle button press, clean game interface sound effect',
    duration_seconds: 0.5,
    prompt_influence: 0.4,
  },
  button_click: {
    text: 'Minimal UI click, very short soft tap, clean digital button press, subtle game interface sound',
    duration_seconds: 0.5,
    prompt_influence: 0.4,
  },
  victory: {
    text: 'Victory fanfare, triumphant ascending brass melody with orchestral hit, glorious win celebration, heroic short jingle, fantasy game sound effect',
    duration_seconds: 1.5,
    prompt_influence: 0.5,
  },
  defeat: {
    text: 'Game over defeat, somber descending low tones, melancholic loss, dark fading sound, sad short melody, fantasy game sound effect',
    duration_seconds: 1.5,
    prompt_influence: 0.5,
  },
};
// #endregion

// 로컬 환경 파일 키 로드 (기존 환경 변수 우선)
for (const envFile of ['.env.local', '.env']) {
  const envPath = path.join(process.cwd(), envFile);
  if (existsSync(envPath)) process.loadEnvFile(envPath);
}

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error('ELEVENLABS_API_KEY 환경변수가 필요합니다.');
  console.error('사용법: ELEVENLABS_API_KEY=키 node scripts/generate-sfx.mjs [이름...]');
  console.error(`\n생성 가능 효과음: ${Object.keys(SFX_PROMPTS).join(', ')}`);
  process.exit(1);
}

// 인자로 특정 효과음만 생성 가능
const targetNames = process.argv.slice(2);
const entries = targetNames.length > 0
  ? Object.entries(SFX_PROMPTS).filter(([name]) => targetNames.includes(name))
  : Object.entries(SFX_PROMPTS);

if (entries.length === 0) {
  console.error('유효한 효과음 이름이 없습니다.');
  console.error(`생성 가능: ${Object.keys(SFX_PROMPTS).join(', ')}`);
  process.exit(1);
}

await mkdir(OUTPUT_DIR, { recursive: true });

/** ElevenLabs API 호출로 효과음 생성 */
async function generateSfx(name, config) {
  const outPath = path.join(OUTPUT_DIR, `${name}.mp3`);

  if (existsSync(outPath) && !targetNames.includes(name)) {
    console.log(`  [건너뜀] ${name}.mp3 (이미 존재)`);
    return true;
  }

  console.log(`  [생성중] ${name}.mp3 — "${config.text.slice(0, 60)}..."`);

  const body = {
    text: config.text,
    duration_seconds: config.duration_seconds,
    prompt_influence: config.prompt_influence,
    model_id: 'eleven_text_to_sound_v2',
  };

  const res = await fetch(API_URL + '?output_format=mp3_44100_128', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error(`  [실패] ${name} — ${res.status} ${res.statusText}: ${errText.slice(0, 200)}`);
    return false;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buffer);
  console.log(`  [완료] ${name}.mp3 (${(buffer.length / 1024).toFixed(1)}KB)`);
  return true;
}

// 순차 실행 (API 레이트 리밋 대응)
console.log(`\n효과음 생성 시작 (${entries.length}개)...\n`);
let success = 0;
let fail = 0;

for (const [index, [name, config]] of entries.entries()) {
  const ok = await generateSfx(name, config);
  if (ok) success++; else fail++;

  // 마지막이 아니면 딜레이
  if (index < entries.length - 1) {
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
}

console.log(`\n완료: 성공 ${success}개, 실패 ${fail}개`);
console.log(`출력: ${OUTPUT_DIR}`);
if (fail > 0) process.exit(1);
