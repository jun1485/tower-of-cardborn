// 릴리스 이미지 WebP 파생본 생성 (원본보다 오래된 파생본만 갱신, --force 시 전량)

import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const ASSET_ROOT = path.join(ROOT, 'public', 'assets');
const FORCE = process.argv.includes('--force');
let skipped = 0;

/** PNG 목록 조회 */
async function getPngFiles(directory) {
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.png'))
    .map((entry) => path.join(directory, entry.name));
}

/** 파생본 최신 여부 확인 (원본 수정 시각 이후 생성) */
async function isUpToDate(source, target) {
  if (FORCE) return false;
  try {
    const [sourceStat, targetStat] = await Promise.all([stat(source), stat(target)]);
    return targetStat.mtimeMs >= sourceStat.mtimeMs;
  } catch {
    return false;
  }
}

/** 원본 변경분만 파생본 생성 */
async function convert(source, target, build) {
  if (await isUpToDate(source, target)) {
    skipped += 1;
    return;
  }
  await build(source).toFile(target);
}

/** 카드 이미지 최적화 */
async function optimizeCards() {
  const files = await getPngFiles(path.join(ASSET_ROOT, 'cards'));
  for (const source of files) {
    await convert(source, source.replace(/\.png$/i, '.webp'), (input) => sharp(input)
      .resize(448, 600, { fit: 'cover' })
      .webp({ quality: 82, effort: 6 }));
  }
  return files.length;
}

/** 캐릭터 이미지 최적화 */
async function optimizeClasses() {
  const files = await getPngFiles(path.join(ASSET_ROOT, 'classes'));
  for (const source of files) {
    await convert(source, source.replace(/\.png$/i, '.webp'), (input) => sharp(input)
      .resize({ height: 720, withoutEnlargement: true })
      .webp({ quality: 84, effort: 6 }));
  }
  return files.length;
}

/** 몬스터 이미지 최적화 */
async function optimizeMonsters() {
  const files = (await getPngFiles(path.join(ASSET_ROOT, 'monsters')))
    .filter((source) => source.endsWith('_hd.png'));
  for (const source of files) {
    await convert(source, source.replace(/\.png$/i, '.webp'), (input) => sharp(input)
      .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84, alphaQuality: 90, effort: 6 }));
  }
  return files.length;
}

/** 배경 이미지 최적화 */
async function optimizeBackgrounds() {
  const uiDirectory = path.join(ASSET_ROOT, 'ui');
  const names = ['bg_combat_hd.svg', 'bg_map_1.svg', 'bg_map_2.svg', 'bg_map_3.svg'];
  await mkdir(uiDirectory, { recursive: true });
  for (const name of names) {
    const source = path.join(uiDirectory, name);
    await convert(source, path.join(uiDirectory, name.replace(/\.svg$/i, '.webp')), (input) => sharp(input, { density: 144 })
      .resize({ width: 1280 })
      .webp({ quality: 80, effort: 6 }));
  }
  return names.length;
}

/** 앱 아이콘 최적화 */
async function optimizeAppIcons() {
  const uiDirectory = path.join(ASSET_ROOT, 'ui');
  const source = path.join(uiDirectory, 'app_icon.png');
  const sizes = [180, 192, 512];
  for (const size of sizes) {
    await convert(source, path.join(uiDirectory, `app_icon_${size}.png`), (input) => sharp(input)
      .resize(size, size)
      .png({ compressionLevel: 9, palette: true, quality: 90 }));
  }
  return sizes.length;
}

/** 전체 이미지 최적화 실행 */
async function main() {
  const counts = await Promise.all([
    optimizeCards(),
    optimizeClasses(),
    optimizeMonsters(),
    optimizeBackgrounds(),
    optimizeAppIcons(),
  ]);
  const total = counts.reduce((sum, count) => sum + count, 0);
  console.log(`이미지 최적화 완료: 대상 ${total}개 중 갱신 ${total - skipped}개, 최신 유지 ${skipped}개`);
}

main().catch((error) => {
  console.error('이미지 최적화에 실패했습니다.', error);
  process.exitCode = 1;
});
