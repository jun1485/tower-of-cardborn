// 게임 효과음 시스템

import { loadSettings } from './settings';

let ctx: AudioContext | undefined;
let noiseBuffer: AudioBuffer | undefined;
let musicTimer: ReturnType<typeof setInterval> | undefined;
let musicScene: MusicScene = 'title';
let currentMusicVolume = 0;
let musicMasterGain: GainNode | undefined;
const activeMusicSources = new Set<OscillatorNode>();
const MUSIC_PHRASE_INTERVAL_MS = 8_000;
const sfxBuffers = new Map<string, AudioBuffer>();
const sfxLoading = new Map<string, Promise<AudioBuffer | null>>();
const sfxFailed = new Set<string>();
// 앱 백그라운드 전환으로 일시정지된 상태
let lifecycleSuspended = false;
// 효과음 볼륨 캐시 (재생마다 설정 재조회 방지)
let sfxVolumeCache: number | null = null;

export type MusicScene = 'title' | 'map' | 'combat' | 'result';

export type SfxName =
  | 'card_attack' | 'card_skill' | 'card_power'
  | 'card_reject'
  | 'enemy_hit' | 'enemy_defeat' | 'player_hit' | 'block'
  | 'turn_end' | 'card_draw'
  | 'heal' | 'upgrade' | 'reward_pick' | 'map_select'
  | 'button_click' | 'victory' | 'defeat';

const SFX_ASSET_FILES: Readonly<Partial<Record<SfxName, string>>> = {
  block: 'block.mp3',
  button_click: 'button_click.mp3',
  card_power: 'card_power.mp3',
  enemy_hit: 'enemy_hit.mp3',
  heal: 'heal.mp3',
  player_hit: 'player_hit.mp3',
  reward_pick: 'reward_pick.mp3',
  upgrade: 'reward_pick.mp3',
  victory: 'victory.mp3',
};

const SFX_ASSET_NAMES: readonly SfxName[] = [
  'block', 'button_click', 'card_power', 'enemy_hit', 'heal',
  'player_hit', 'reward_pick', 'upgrade', 'victory',
];

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

/** AudioContext 지연 생성 (백그라운드 일시정지 중에는 재개 금지) */
function getCtx(): AudioContext {
  ctx = ctx || new AudioContext();
  if (ctx.state === 'suspended' && !lifecycleSuspended) void ctx.resume().catch(() => undefined);
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

/** 효과음 파일 버퍼 로드 */
function loadSfxBuffer(context: AudioContext, name: SfxName): Promise<AudioBuffer | null> {
  const fileName = SFX_ASSET_FILES[name];
  if (!fileName) return Promise.resolve(null);
  const cached = sfxBuffers.get(fileName);
  if (cached) return Promise.resolve(cached);
  const loading = sfxLoading.get(fileName);
  if (loading) return loading;

  if (sfxFailed.has(fileName)) return Promise.resolve(null);

  const request = fetch(`/assets/audio/${fileName}`)
    .then((response) => {
      if (!response.ok) throw new Error(`효과음 파일을 불러오지 못했습니다. (${response.status})`);
      return response.arrayBuffer();
    })
    .then((data) => context.decodeAudioData(data))
    .then((buffer) => {
      sfxBuffers.set(fileName, buffer);
      return buffer;
    })
    // 실패 파일은 세션 동안 재요청하지 않고 합성음으로 대체
    .catch(() => {
      sfxFailed.add(fileName);
      return null;
    })
    .finally(() => sfxLoading.delete(fileName));
  sfxLoading.set(fileName, request);
  return request;
}

/** 효과음 파일 선로딩 */
function preloadSfxAssets(context: AudioContext): void {
  SFX_ASSET_NAMES.forEach((name) => void loadSfxBuffer(context, name));
}

/** 효과음 파일 재생 */
function playSfxBuffer(context: AudioContext, buffer: AudioBuffer, volume: number): void {
  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = buffer;
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(context.destination);
  source.addEventListener('ended', () => {
    source.disconnect();
    gain.disconnect();
  }, { once: true });
  source.start();
}

/** 로드 완료 효과음 파일 우선 재생 */
function playLoadedSfx(context: AudioContext, name: SfxName, volume: number): boolean {
  const fileName = SFX_ASSET_FILES[name];
  const buffer = fileName ? sfxBuffers.get(fileName) : undefined;
  if (!buffer) {
    void loadSfxBuffer(context, name);
    return false;
  }
  playSfxBuffer(context, buffer, volume);
  return true;
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
  readonly type?: OscillatorType;
  readonly filterFrequency?: number;
  readonly pan?: number;
}

const MUSIC_PATTERNS: Readonly<Record<MusicScene, readonly MusicNote[]>> = {
  title: [
    { frequency: 110, offset: 0, duration: 7.6, volume: 0.05, type: 'sine', filterFrequency: 320 },
    { frequency: 164.81, offset: 0.1, duration: 3.6, volume: 0.026, filterFrequency: 680, pan: -0.32 },
    { frequency: 261.63, offset: 0.2, duration: 3.4, volume: 0.018, type: 'sine', filterFrequency: 960, pan: 0.32 },
    { frequency: 220, offset: 0.55, duration: 0.72, volume: 0.014, filterFrequency: 1_600, pan: -0.5 },
    { frequency: 261.63, offset: 1.35, duration: 0.72, volume: 0.013, filterFrequency: 1_700, pan: 0.45 },
    { frequency: 329.63, offset: 2.15, duration: 0.9, volume: 0.012, filterFrequency: 1_800, pan: -0.2 },
    { frequency: 164.81, offset: 3.9, duration: 3.5, volume: 0.025, filterFrequency: 620, pan: 0.3 },
    { frequency: 246.94, offset: 4, duration: 3.3, volume: 0.017, type: 'sine', filterFrequency: 920, pan: -0.3 },
    { frequency: 220, offset: 4.45, duration: 0.72, volume: 0.013, filterFrequency: 1_500, pan: 0.5 },
    { frequency: 246.94, offset: 5.25, duration: 0.72, volume: 0.012, filterFrequency: 1_650, pan: -0.45 },
    { frequency: 329.63, offset: 6.05, duration: 1.05, volume: 0.013, filterFrequency: 1_750, pan: 0.15 },
  ],
  map: [
    { frequency: 146.83, offset: 0, duration: 3.8, volume: 0.036, type: 'sine', filterFrequency: 420, pan: -0.2 },
    { frequency: 220, offset: 0.15, duration: 3.4, volume: 0.021, filterFrequency: 820, pan: 0.25 },
    { frequency: 293.66, offset: 0.35, duration: 0.65, volume: 0.014, filterFrequency: 1_850, pan: -0.55 },
    { frequency: 349.23, offset: 1.15, duration: 0.65, volume: 0.013, filterFrequency: 1_950, pan: 0.5 },
    { frequency: 440, offset: 1.95, duration: 0.78, volume: 0.012, filterFrequency: 2_100, pan: -0.35 },
    { frequency: 392, offset: 2.85, duration: 0.8, volume: 0.012, filterFrequency: 1_900, pan: 0.35 },
    { frequency: 130.81, offset: 4, duration: 3.6, volume: 0.035, type: 'sine', filterFrequency: 390, pan: 0.2 },
    { frequency: 196, offset: 4.15, duration: 3.2, volume: 0.02, filterFrequency: 780, pan: -0.25 },
    { frequency: 261.63, offset: 4.35, duration: 0.65, volume: 0.014, filterFrequency: 1_800, pan: 0.55 },
    { frequency: 329.63, offset: 5.15, duration: 0.65, volume: 0.013, filterFrequency: 1_900, pan: -0.5 },
    { frequency: 392, offset: 5.95, duration: 0.78, volume: 0.012, filterFrequency: 2_050, pan: 0.35 },
    { frequency: 349.23, offset: 6.85, duration: 0.72, volume: 0.012, filterFrequency: 1_850, pan: -0.25 },
  ],
  combat: [
    { frequency: 73.42, offset: 0, duration: 1.25, volume: 0.05, type: 'sawtooth', filterFrequency: 260, pan: -0.2 },
    { frequency: 110, offset: 0.12, duration: 1.05, volume: 0.022, type: 'triangle', filterFrequency: 620, pan: 0.25 },
    { frequency: 293.66, offset: 0.45, duration: 0.42, volume: 0.014, type: 'square', filterFrequency: 1_400, pan: -0.55 },
    { frequency: 349.23, offset: 1.15, duration: 0.42, volume: 0.013, type: 'square', filterFrequency: 1_500, pan: 0.5 },
    { frequency: 82.41, offset: 1.85, duration: 1.25, volume: 0.05, type: 'sawtooth', filterFrequency: 280, pan: 0.2 },
    { frequency: 123.47, offset: 1.97, duration: 1.05, volume: 0.022, filterFrequency: 650, pan: -0.25 },
    { frequency: 329.63, offset: 2.3, duration: 0.42, volume: 0.014, type: 'square', filterFrequency: 1_450, pan: 0.55 },
    { frequency: 392, offset: 3, duration: 0.42, volume: 0.013, type: 'square', filterFrequency: 1_550, pan: -0.5 },
    { frequency: 73.42, offset: 3.7, duration: 1.25, volume: 0.052, type: 'sawtooth', filterFrequency: 260, pan: -0.2 },
    { frequency: 110, offset: 3.82, duration: 1.05, volume: 0.023, filterFrequency: 620, pan: 0.25 },
    { frequency: 440, offset: 4.15, duration: 0.42, volume: 0.013, type: 'square', filterFrequency: 1_650, pan: -0.55 },
    { frequency: 392, offset: 4.85, duration: 0.42, volume: 0.013, type: 'square', filterFrequency: 1_550, pan: 0.5 },
    { frequency: 65.41, offset: 5.55, duration: 1.75, volume: 0.055, type: 'sawtooth', filterFrequency: 240 },
    { frequency: 98, offset: 5.7, duration: 1.5, volume: 0.024, filterFrequency: 580, pan: -0.25 },
    { frequency: 293.66, offset: 6.15, duration: 0.5, volume: 0.015, type: 'square', filterFrequency: 1_450, pan: 0.45 },
    { frequency: 349.23, offset: 6.85, duration: 0.65, volume: 0.014, type: 'square', filterFrequency: 1_550, pan: -0.4 },
  ],
  result: [
    { frequency: 130.81, offset: 0, duration: 7.5, volume: 0.038, type: 'sine', filterFrequency: 440 },
    { frequency: 196, offset: 0.1, duration: 7.2, volume: 0.023, filterFrequency: 820, pan: -0.25 },
    { frequency: 261.63, offset: 0.2, duration: 7, volume: 0.017, type: 'sine', filterFrequency: 1_050, pan: 0.25 },
    { frequency: 261.63, offset: 0.35, duration: 0.75, volume: 0.014, filterFrequency: 1_800, pan: -0.55 },
    { frequency: 329.63, offset: 1.25, duration: 0.75, volume: 0.014, filterFrequency: 1_900, pan: 0.5 },
    { frequency: 392, offset: 2.15, duration: 0.85, volume: 0.015, filterFrequency: 2_000, pan: -0.35 },
    { frequency: 523.25, offset: 3.15, duration: 1.15, volume: 0.016, filterFrequency: 2_200, pan: 0.3 },
    { frequency: 392, offset: 4.55, duration: 0.75, volume: 0.013, filterFrequency: 1_900, pan: 0.5 },
    { frequency: 329.63, offset: 5.45, duration: 0.75, volume: 0.012, filterFrequency: 1_800, pan: -0.45 },
    { frequency: 261.63, offset: 6.35, duration: 1.1, volume: 0.013, filterFrequency: 1_750, pan: 0.15 },
  ],
};

/** 배경음악 마스터 출력 생성 */
function getMusicMasterGain(context: AudioContext): GainNode {
  if (musicMasterGain) return musicMasterGain;
  musicMasterGain = context.createGain();
  musicMasterGain.gain.value = currentMusicVolume;
  musicMasterGain.connect(context.destination);
  return musicMasterGain;
}

/** 이전 배경음악 음성 정지 */
function stopMusicVoices(context: AudioContext): void {
  const sources = [...activeMusicSources];
  activeMusicSources.clear();
  sources.forEach((source) => {
    try {
      source.stop(context.currentTime + 0.08);
    } catch { /* 이미 종료된 음원 무시 */ }
  });
}

/** 배경음악 음표 레이어 재생 */
function playMusicNote(context: AudioContext, note: MusicNote): void {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const panner = context.createStereoPanner();
  const gain = context.createGain();
  const master = getMusicMasterGain(context);
  const start = context.currentTime + note.offset;
  const end = start + note.duration;
  const attackEnd = start + Math.min(0.32, note.duration / 3);
  const releaseStart = Math.max(attackEnd, end - Math.min(0.55, note.duration / 3));
  oscillator.type = note.type ?? 'triangle';
  oscillator.frequency.setValueAtTime(note.frequency, start);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(note.filterFrequency ?? 900, start);
  filter.Q.value = 0.7;
  panner.pan.value = note.pan ?? 0;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(note.volume, attackEnd);
  gain.gain.setValueAtTime(note.volume, releaseStart);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(filter);
  filter.connect(panner);
  panner.connect(gain);
  gain.connect(master);
  activeMusicSources.add(oscillator);
  oscillator.addEventListener('ended', () => {
    activeMusicSources.delete(oscillator);
    oscillator.disconnect();
    filter.disconnect();
    panner.disconnect();
    gain.disconnect();
  }, { once: true });
  oscillator.start(start);
  oscillator.stop(end);
}

/** 현재 화면 배경음악 구간 예약 */
function scheduleMusicPhrase(): void {
  const context = ctx;
  if (!context || context.state !== 'running' || currentMusicVolume <= 0) return;
  MUSIC_PATTERNS[musicScene].forEach((note) => playMusicNote(context, note));
}

/** 배경음악 반복 예약 갱신 */
function restartMusicScheduler(): void {
  if (musicTimer) clearInterval(musicTimer);
  currentMusicVolume = loadSettings().musicVolume / 100;
  const context = ctx;
  if (context) {
    const master = getMusicMasterGain(context);
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(0, context.currentTime, 0.025);
    stopMusicVoices(context);
    master.gain.setTargetAtTime(currentMusicVolume, context.currentTime + 0.09, 0.08);
  }
  scheduleMusicPhrase();
  musicTimer = setInterval(scheduleMusicPhrase, MUSIC_PHRASE_INTERVAL_MS);
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

/** 적 처치 효과음 구성 */
function playEnemyDefeat(context: AudioContext, volume: number): void {
  playNoise(context, volume, { duration: 0.24, volume: 0.24, frequency: 310, type: 'lowpass' });
  playTone(context, volume, { frequency: 190, endFrequency: 52, duration: 0.28, volume: 0.2, type: 'sawtooth' });
  playTone(context, volume, { frequency: 96, endFrequency: 42, duration: 0.32, volume: 0.13, offset: 0.04, type: 'triangle' });
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

/** 카드 사용 불가 경고음 재생 */
function playCardReject(context: AudioContext, volume: number): void {
  playTone(context, volume, { frequency: 210, endFrequency: 135, duration: 0.11, volume: 0.07, type: 'square' });
  playTone(context, volume, { frequency: 155, endFrequency: 110, duration: 0.12, volume: 0.055, offset: 0.08, type: 'square' });
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
  lifecycleSuspended = false;
  try {
    const context = getCtx();
    if (context.state === 'suspended') void context.resume().catch(() => undefined);
    preloadSfxAssets(context);
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
  const previousVolume = currentMusicVolume;
  currentMusicVolume = Math.max(0, Math.min(100, volume)) / 100;
  const context = ctx;
  if (!context) return;
  const master = getMusicMasterGain(context);
  master.gain.cancelScheduledValues(context.currentTime);
  master.gain.setTargetAtTime(currentMusicVolume, context.currentTime, 0.04);
  if (!musicTimer) restartMusicScheduler();
  else if (previousVolume <= 0 && currentMusicVolume > 0) scheduleMusicPhrase();
}

/** AudioContext 일시 중지 */
export function suspendAudioContext(): void {
  lifecycleSuspended = true;
  if (ctx?.state === 'running') void ctx.suspend().catch(() => undefined);
}

/** 효과음 볼륨 캐시 갱신 */
export function refreshSfxVolume(volume = loadSettings().sfxVolume): void {
  sfxVolumeCache = volume;
}

/** 설정 볼륨 기준 효과음 재생 (백그라운드 중 지연 효과음 무시) */
export function playSfx(name: SfxName): void {
  if (lifecycleSuspended) return;
  sfxVolumeCache ??= loadSettings().sfxVolume;
  const sfxVolume = sfxVolumeCache;
  if (sfxVolume <= 0) return;
  const volume = sfxVolume / 100;

  try {
    const context = getCtx();
    if (playLoadedSfx(context, name, volume)) return;
    switch (name) {
      case 'card_attack': playCardAttack(context, volume); break;
      case 'card_skill': playCardSkill(context, volume); break;
      case 'card_power': playCardPower(context, volume); break;
      case 'enemy_hit': playEnemyHit(context, volume); break;
      case 'player_hit': playPlayerHit(context, volume); break;
      case 'block': playBlock(context, volume); break;
      case 'card_draw': playCardDraw(context, volume); break;
      case 'card_reject': playCardReject(context, volume); break;
      case 'heal': playHeal(context, volume); break;
      case 'enemy_defeat': playEnemyDefeat(context, volume); break;
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
