// 릴리스 이미지 WebP 파생본 생성

import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const ASSET_ROOT = path.join(ROOT, 'public', 'assets');

/** PNG 목록 조회 */
async function getPngFiles(directory) {
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.png'))
    .map((entry) => path.join(directory, entry.name));
}

/** 카드 이미지 최적화 */
async function optimizeCards() {
  const files = await getPngFiles(path.join(ASSET_ROOT, 'cards'));
  for (const source of files) {
    const target = source.replace(/\.png$/i, '.webp');
    await sharp(source).resize(448, 600, { fit: 'cover' }).webp({ quality: 82, effort: 6 }).toFile(target);
  }
  return files.length;
}

/** 캐릭터 이미지 최적화 */
async function optimizeClasses() {
  const files = await getPngFiles(path.join(ASSET_ROOT, 'classes'));
  for (const source of files) {
    const target = source.replace(/\.png$/i, '.webp');
    await sharp(source).resize({ height: 720, withoutEnlargement: true }).webp({ quality: 84, effort: 6 }).toFile(target);
  }
  return files.length;
}

/** 몬스터 이미지 최적화 */
async function optimizeMonsters() {
  const files = (await getPngFiles(path.join(ASSET_ROOT, 'monsters')))
    .filter((source) => source.endsWith('_hd.png'));
  for (const source of files) {
    const target = source.replace(/\.png$/i, '.webp');
    await sharp(source)
      .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84, alphaQuality: 90, effort: 6 })
      .toFile(target);
  }
  return files.length;
}

/** 배경 이미지 최적화 */
async function optimizeBackgrounds() {
  const uiDirectory = path.join(ASSET_ROOT, 'ui');
  const names = ['bg_combat_hd.svg', 'bg_map_1.svg', 'bg_map_2.svg', 'bg_map_3.svg'];
  await mkdir(uiDirectory, { recursive: true });
  for (const name of names) {
    await sharp(path.join(uiDirectory, name), { density: 144 })
      .resize({ width: 1280 })
      .webp({ quality: 80, effort: 6 })
      .toFile(path.join(uiDirectory, name.replace(/\.svg$/i, '.webp')));
  }
  return names.length;
}

/** 앱 아이콘 최적화 */
async function optimizeAppIcons() {
  const uiDirectory = path.join(ASSET_ROOT, 'ui');
  const source = path.join(uiDirectory, 'app_icon.png');
  const sizes = [180, 192, 512];
  for (const size of sizes) {
    await sharp(source)
      .resize(size, size)
      .png({ compressionLevel: 9, palette: true, quality: 90 })
      .toFile(path.join(uiDirectory, `app_icon_${size}.png`));
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
  console.log(`이미지 최적화 완료: ${counts.reduce((sum, count) => sum + count, 0)}개`);
}

main().catch((error) => {
  console.error('이미지 최적화에 실패했습니다.', error);
  process.exitCode = 1;
});
