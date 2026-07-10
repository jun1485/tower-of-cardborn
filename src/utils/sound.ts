// 게임 효과음 시스템 (MP3 캐시와 합성음 보완)

import { loadSettings } from './settings';

let ctx: AudioContext | undefined;
const audioCache = new Map<string, AudioBuffer>();
const failedFiles = new Set<string>();

/** AudioContext 지연 생성 */
function getCtx(): AudioContext {
  ctx = ctx || new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  return ctx;
}

/** AudioContext 활성화 (사용자 제스처 시 호출) */
export function resumeAudioContext(): void {
  try {
    const context = getCtx();
    if (context.state === 'suspended') void context.resume().catch(() => undefined);
  } catch {
    // 오디오 미지원 환경 무음 처리
  }
}

/** AudioContext 일시 중지 */
export function suspendAudioContext(): void {
  if (ctx?.state === 'running') void ctx.suspend().catch(() => undefined);
}

// #region 효과음 이름 정의
export type SfxName =
  | 'card_attack' | 'card_skill' | 'card_power'
  | 'enemy_hit' | 'player_hit' | 'block'
  | 'turn_end' | 'card_draw'
  | 'heal' | 'upgrade' | 'reward_pick' | 'map_select'
  | 'button_click' | 'victory' | 'defeat';

/** 실제 .mp3 파일이 존재하는 효과음 목록 */
const AVAILABLE_SFX = new Set<SfxName>([
  'card_power', 'enemy_hit', 'player_hit', 'block',
  'heal', 'reward_pick', 'button_click', 'victory',
]);

const SYNTH_SFX: Partial<Record<SfxName, { frequency: number; duration: number; type: OscillatorType }>> = {
  card_attack: { frequency: 180, duration: 0.08, type: 'sawtooth' },
  card_skill: { frequency: 420, duration: 0.1, type: 'sine' },
  turn_end: { frequency: 260, duration: 0.12, type: 'triangle' },
  card_draw: { frequency: 520, duration: 0.06, type: 'sine' },
  upgrade: { frequency: 720, duration: 0.16, type: 'triangle' },
  map_select: { frequency: 380, duration: 0.08, type: 'sine' },
  defeat: { frequency: 110, duration: 0.35, type: 'sawtooth' },
};
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
  src.addEventListener('ended', () => {
    src.disconnect();
    gain.disconnect();
  }, { once: true });
  src.start();
}

/** 누락 효과음 보완 재생 */
function playSynthSfx(name: SfxName, vol: number): void {
  const preset = SYNTH_SFX[name];
  if (!preset) return;
  const c = getCtx();
  const gain = c.createGain();
  const oscillator = c.createOscillator();
  const now = c.currentTime;
  oscillator.type = preset.type;
  oscillator.frequency.setValueAtTime(preset.frequency, now);
  gain.gain.setValueAtTime(vol * 0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + preset.duration);
  oscillator.connect(gain);
  gain.connect(c.destination);
  oscillator.addEventListener('ended', () => {
    oscillator.disconnect();
    gain.disconnect();
  }, { once: true });
  oscillator.start(now);
  oscillator.stop(now + preset.duration);
}
// #endregion

// #region 공개 API
/** 설정 볼륨 기준 효과음 재생 */
export function playSfx(name: SfxName): void {
  const { sfxVolume } = loadSettings();
  if (sfxVolume <= 0) return;
  const vol = sfxVolume / 100;

  try {
    getCtx();
    if (!AVAILABLE_SFX.has(name)) {
      playSynthSfx(name, vol);
      return;
    }
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
