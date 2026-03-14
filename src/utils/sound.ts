// 게임 효과음 시스템 (AI 생성 .mp3 파일 기반, 파일 없으면 무음)

import { loadSettings } from './settings';

let ctx: AudioContext | undefined;
const audioCache = new Map<string, AudioBuffer>();
const failedFiles = new Set<string>();

/** AudioContext 지연 생성 */
function getCtx(): AudioContext {
  ctx = ctx || new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** AudioContext 활성화 (사용자 제스처 시 호출) */
export function resumeAudioContext(): void {
  if (ctx?.state === 'suspended') ctx.resume();
}

// #region 효과음 이름 정의
const SFX_NAMES = [
  'card_attack', 'card_skill', 'card_power',
  'enemy_hit', 'player_hit', 'block',
  'turn_end', 'card_draw',
  'heal', 'upgrade', 'reward_pick', 'map_select',
  'button_click', 'victory', 'defeat',
] as const;

export type SfxName = (typeof SFX_NAMES)[number];

/** 실제 .mp3 파일이 존재하는 효과음 목록 */
const AVAILABLE_SFX = new Set<SfxName>([
  'card_power', 'enemy_hit', 'player_hit', 'block',
  'heal', 'reward_pick', 'button_click', 'victory',
]);
// #endregion

// #region 파일 기반 재생
/** mp3 파일 비동기 로드 + 캐싱 */
async function loadAudioFile(name: string): Promise<AudioBuffer | null> {
  if (failedFiles.has(name)) return null;
  const cached = audioCache.get(name);
  if (cached) return cached;

  try {
    const res = await fetch(`/assets/audio/${name}.mp3`);
    if (!res.ok) throw new Error(res.statusText);
    const arrayBuf = await res.arrayBuffer();
    const c = getCtx();
    const audioBuf = await c.decodeAudioData(arrayBuf);
    audioCache.set(name, audioBuf);
    return audioBuf;
  } catch {
    failedFiles.add(name);
    return null;
  }
}

/** 캐시된 AudioBuffer 재생 */
function playBuffer(buf: AudioBuffer, vol: number): void {
  const c = getCtx();
  const gain = c.createGain();
  gain.gain.value = vol;
  gain.connect(c.destination);
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(gain);
  src.start();
}
// #endregion

// #region 공개 API
/** 효과음 재생 (파일 존재 시에만 재생, 없으면 무음) */
export function playSfx(name: SfxName): void {
  if (!AVAILABLE_SFX.has(name)) return;

  const { sfxVolume } = loadSettings();
  if (sfxVolume <= 0) return;
  const vol = sfxVolume / 100;

  try {
    const cached = audioCache.get(name);
    if (cached) {
      playBuffer(cached, vol);
      return;
    }

    // 첫 호출: 백그라운드 파일 캐싱 (다음 호출부터 재생)
    loadAudioFile(name).then((buf) => {
      if (buf) playBuffer(buf, vol);
    });
  } catch {
    // AudioContext 생성 실패 시 무음
  }
}
// #endregion
