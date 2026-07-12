// 게임 효과음 시스템

import { loadSettings } from './settings';

let ctx: AudioContext | undefined;
let noiseBuffer: AudioBuffer | undefined;
let musicTimer: ReturnType<typeof setInterval> | undefined;
let musicScene: MusicScene = 'title';
let currentMusicVolume = 0;

export type MusicScene = 'title' | 'map' | 'combat' | 'result';

export type SfxName =
  | 'card_attack' | 'card_skill' | 'card_power'
  | 'enemy_hit' | 'player_hit' | 'block'
  | 'turn_end' | 'card_draw'
  | 'heal' | 'upgrade' | 'reward_pick' | 'map_select'
  | 'button_click' | 'victory' | 'defeat';

interface ToneOptions {
  readonly frequency: number;
  readonly endFrequency?: number;
  readonly duration: number;
  readonly volume: number;
  readonly offset?: number;
  readonly type?: OscillatorType;
}

interface NoiseOptions {
  readonly duration: number;
  readonly volume: number;
  readonly frequency: number;
  readonly offset?: number;
  readonly type?: BiquadFilterType;
}

/** AudioContext 지연 생성 */
function getCtx(): AudioContext {
  ctx = ctx || new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  return ctx;
}

/** 재사용 노이즈 버퍼 생성 */
function getNoiseBuffer(context: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < channel.length; index += 1) channel[index] = Math.random() * 2 - 1;
  noiseBuffer = buffer;
  return buffer;
}

/** 짧은 음색 레이어 재생 */
function playTone(context: AudioContext, masterVolume: number, options: ToneOptions): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime + (options.offset ?? 0);
  const end = start + options.duration;
  oscillator.type = options.type ?? 'sine';
  oscillator.frequency.setValueAtTime(options.frequency, start);
  if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, end);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(options.volume * masterVolume, 0.0001), start + Math.min(0.012, options.duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.addEventListener('ended', () => {
    oscillator.disconnect();
    gain.disconnect();
  }, { once: true });
  oscillator.start(start);
  oscillator.stop(end);
}

interface MusicNote {
  readonly frequency: number;
  readonly offset: number;
  readonly duration: number;
  readonly volume: number;
}

const MUSIC_PATTERNS: Readonly<Record<MusicScene, readonly MusicNote[]>> = {
  title: [
    { frequency: 110, offset: 0, duration: 5.8, volume: 0.038 },
    { frequency: 164.81, offset: 0.2, duration: 5.4, volume: 0.024 },
    { frequency: 220, offset: 3.1, duration: 2.6, volume: 0.018 },
  ],
  map: [
    { frequency: 130.81, offset: 0, duration: 4.8, volume: 0.03 },
    { frequency: 196, offset: 1.2, duration: 3.6, volume: 0.021 },
    { frequency: 261.63, offset: 4.2, duration: 2.1, volume: 0.016 },
  ],
  combat: [
    { frequency: 73.42, offset: 0, duration: 2.8, volume: 0.042 },
    { frequency: 110, offset: 1.5, duration: 2.2, volume: 0.026 },
    { frequency: 146.83, offset: 3.6, duration: 2.4, volume: 0.024 },
    { frequency: 82.41, offset: 5.4, duration: 1.8, volume: 0.036 },
  ],
  result: [
    { frequency: 130.81, offset: 0, duration: 5.6, volume: 0.034 },
    { frequency: 196, offset: 0.3, duration: 5.2, volume: 0.022 },
    { frequency: 261.63, offset: 1.1, duration: 4.2, volume: 0.018 },
  ],
};

/** 배경음악 음표 레이어 재생 */
function playMusicNote(context: AudioContext, note: MusicNote, volume: number): void {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const start = context.currentTime + note.offset;
  const end = start + note.duration;
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(note.frequency, start);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(720, start);
  filter.Q.value = 0.7;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(note.volume * volume, 0.0001), start + Math.min(0.9, note.duration / 3));
  gain.gain.setValueAtTime(Math.max(note.volume * volume, 0.0001), Math.max(start + 0.01, end - 1.2));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  oscillator.addEventListener('ended', () => {
    oscillator.disconnect();
    filter.disconnect();
    gain.disconnect();
  }, { once: true });
  oscillator.start(start);
  oscillator.stop(end);
}

/** 현재 화면 배경음악 구간 예약 */
function scheduleMusicPhrase(): void {
  const context = ctx;
  if (!context || context.state !== 'running' || currentMusicVolume <= 0) return;
  MUSIC_PATTERNS[musicScene].forEach((note) => playMusicNote(context, note, currentMusicVolume));
}

/** 배경음악 반복 예약 갱신 */
function restartMusicScheduler(): void {
  if (musicTimer) clearInterval(musicTimer);
  currentMusicVolume = loadSettings().musicVolume / 100;
  scheduleMusicPhrase();
  musicTimer = setInterval(scheduleMusicPhrase, 7_200);
}

/** 타격 질감 노이즈 레이어 재생 */
function playNoise(context: AudioContext, masterVolume: number, options: NoiseOptions): void {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const start = context.currentTime + (options.offset ?? 0);
  const end = start + options.duration;
  source.buffer = getNoiseBuffer(context);
  filter.type = options.type ?? 'bandpass';
  filter.frequency.value = options.frequency;
  filter.Q.value = 0.8;
  gain.gain.setValueAtTime(Math.max(options.volume * masterVolume, 0.0001), start);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.addEventListener('ended', () => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  }, { once: true });
  source.start(start);
  source.stop(end);
}

/** 카드 공격 효과음 구성 */
function playCardAttack(context: AudioContext, volume: number): void {
  playNoise(context, volume, { duration: 0.12, volume: 0.22, frequency: 920, type: 'highpass' });
  playTone(context, volume, { frequency: 280, endFrequency: 82, duration: 0.15, volume: 0.2, type: 'sawtooth' });
  playTone(context, volume, { frequency: 96, duration: 0.1, volume: 0.16, offset: 0.035, type: 'triangle' });
}

/** 카드 기술 효과음 구성 */
function playCardSkill(context: AudioContext, volume: number): void {
  playTone(context, volume, { frequency: 420, endFrequency: 760, duration: 0.14, volume: 0.12, type: 'sine' });
  playTone(context, volume, { frequency: 630, endFrequency: 1040, duration: 0.18, volume: 0.08, offset: 0.025, type: 'triangle' });
  playNoise(context, volume, { duration: 0.1, volume: 0.055, frequency: 2600, offset: 0.04, type: 'highpass' });
}

/** 카드 파워 효과음 구성 */
function playCardPower(context: AudioContext, volume: number): void {
  [330, 440, 660].forEach((frequency, index) => {
    playTone(context, volume, { frequency, duration: 0.26, volume: 0.075, offset: index * 0.035, type: 'triangle' });
  });
}

/** 적 피격 효과음 구성 */
function playEnemyHit(context: AudioContext, volume: number): void {
  playNoise(context, volume, { duration: 0.105, volume: 0.24, frequency: 420, type: 'lowpass' });
  playTone(context, volume, { frequency: 135, endFrequency: 72, duration: 0.13, volume: 0.19, type: 'triangle' });
}

/** 플레이어 피격 효과음 구성 */
function playPlayerHit(context: AudioContext, volume: number): void {
  playNoise(context, volume, { duration: 0.16, volume: 0.26, frequency: 310, type: 'lowpass' });
  playTone(context, volume, { frequency: 108, endFrequency: 48, duration: 0.2, volume: 0.21, type: 'sawtooth' });
  playTone(context, volume, { frequency: 62, duration: 0.16, volume: 0.14, offset: 0.03, type: 'sine' });
}

/** 방어 효과음 구성 */
function playBlock(context: AudioContext, volume: number): void {
  playNoise(context, volume, { duration: 0.08, volume: 0.16, frequency: 2400, type: 'highpass' });
  playTone(context, volume, { frequency: 760, endFrequency: 520, duration: 0.18, volume: 0.14, type: 'square' });
  playTone(context, volume, { frequency: 1140, endFrequency: 810, duration: 0.14, volume: 0.07, offset: 0.012, type: 'sine' });
}

/** 카드 드로우 효과음 구성 */
function playCardDraw(context: AudioContext, volume: number): void {
  playNoise(context, volume, { duration: 0.075, volume: 0.075, frequency: 1800, type: 'highpass' });
  playTone(context, volume, { frequency: 610, endFrequency: 920, duration: 0.08, volume: 0.055, type: 'triangle' });
}

/** 회복 효과음 구성 */
function playHeal(context: AudioContext, volume: number): void {
  [440, 554, 659, 880].forEach((frequency, index) => {
    playTone(context, volume, { frequency, duration: 0.28, volume: 0.07, offset: index * 0.07, type: 'sine' });
  });
}

/** 보상 획득 효과음 구성 */
function playReward(context: AudioContext, volume: number): void {
  [880, 1320, 1760].forEach((frequency, index) => {
    playTone(context, volume, { frequency, duration: 0.13, volume: 0.06, offset: index * 0.055, type: 'sine' });
  });
}

/** 승리 팡파르 효과음 구성 */
function playVictory(context: AudioContext, volume: number): void {
  const notes = [392, 523, 659, 784, 1047];
  notes.forEach((frequency, index) => {
    playTone(context, volume, { frequency, duration: index === notes.length - 1 ? 0.55 : 0.22, volume: 0.09, offset: index * 0.11, type: 'triangle' });
    if (index >= 2) playTone(context, volume, { frequency: frequency / 2, duration: 0.34, volume: 0.045, offset: index * 0.11, type: 'sine' });
  });
}

/** 패배 하강 효과음 구성 */
function playDefeat(context: AudioContext, volume: number): void {
  [220, 185, 147, 110].forEach((frequency, index) => {
    playTone(context, volume, { frequency, endFrequency: frequency * 0.82, duration: 0.32, volume: 0.085, offset: index * 0.14, type: 'sawtooth' });
  });
  playNoise(context, volume, { duration: 0.65, volume: 0.07, frequency: 220, offset: 0.18, type: 'lowpass' });
}

/** AudioContext 활성화 */
export function resumeAudioContext(): void {
  try {
    const context = getCtx();
    if (context.state === 'suspended') void context.resume().catch(() => undefined);
    if (!musicTimer) restartMusicScheduler();
  } catch {
    // 오디오 미지원 환경 무음 처리
  }
}

/** 화면별 배경음악 전환 */
export function setMusicScene(scene: MusicScene): void {
  if (musicScene === scene && musicTimer) return;
  musicScene = scene;
  if (ctx) restartMusicScheduler();
}

/** 배경음악 볼륨 즉시 갱신 */
export function refreshMusicVolume(volume = loadSettings().musicVolume): void {
  currentMusicVolume = Math.max(0, Math.min(100, volume)) / 100;
  if (!musicTimer && ctx) restartMusicScheduler();
}

/** AudioContext 일시 중지 */
export function suspendAudioContext(): void {
  if (ctx?.state === 'running') void ctx.suspend().catch(() => undefined);
}

/** 설정 볼륨 기준 효과음 재생 */
export function playSfx(name: SfxName): void {
  const { sfxVolume } = loadSettings();
  if (sfxVolume <= 0) return;
  const volume = sfxVolume / 100;

  try {
    const context = getCtx();
    switch (name) {
      case 'card_attack': playCardAttack(context, volume); break;
      case 'card_skill': playCardSkill(context, volume); break;
      case 'card_power': playCardPower(context, volume); break;
      case 'enemy_hit': playEnemyHit(context, volume); break;
      case 'player_hit': playPlayerHit(context, volume); break;
      case 'block': playBlock(context, volume); break;
      case 'card_draw': playCardDraw(context, volume); break;
      case 'heal': playHeal(context, volume); break;
      case 'upgrade':
      case 'reward_pick': playReward(context, volume); break;
      case 'victory': playVictory(context, volume); break;
      case 'defeat': playDefeat(context, volume); break;
      case 'turn_end':
        playTone(context, volume, { frequency: 330, endFrequency: 210, duration: 0.16, volume: 0.09, type: 'triangle' });
        break;
      case 'map_select':
        playTone(context, volume, { frequency: 360, endFrequency: 540, duration: 0.11, volume: 0.075, type: 'sine' });
        break;
      case 'button_click':
        playTone(context, volume, { frequency: 520, endFrequency: 720, duration: 0.045, volume: 0.055, type: 'square' });
        break;
    }
  } catch {
    // 오디오 미지원 환경 무음 처리
  }
}
