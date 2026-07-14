import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import type { Plugin, ResolvedConfig } from 'vite';

const RELEASE_FILES = [
  'manifest.webmanifest',
  'sw.js',
  'assets/cards/placeholder.svg',
  'assets/ui/app_icon_180.png',
  'assets/ui/app_icon_192.png',
  'assets/ui/app_icon_512.png',
  'assets/ui/cursor-hero.svg',
  'assets/ui/deck.png',
  'assets/ui/bg_combat_tower-v2.webp',
  'assets/ui/bg_map_1.webp',
  'assets/ui/bg_map_2.webp',
  'assets/ui/bg_map_3.webp',
] as const;

// 릴리스 산출물 포함 확장자 (미포함 시 경고 대상)
const RELEASE_EXTENSIONS = ['.webp', '.ogg', '.mp3', '.wav', '.woff2', '.webmanifest'] as const;
const BUILD_ASSET_MARKER = '/* __BUILD_ASSETS__ */';
const BUILD_CACHE_VERSION_MARKER = '__BUILD_CACHE_VERSION__';

// 레거시 캐릭터·몬스터 자산 판별
function isLegacyRuntimeAsset(file: string): boolean {
  const isRuntimeCharacter = file.startsWith('assets/classes/') || file.startsWith('assets/monsters/');
  return file === 'assets/ui/bg_combat_hd.webp'
    || (isRuntimeCharacter && file.endsWith('.webp') && !file.endsWith('-v2.webp'));
}

// 릴리스 단일 자산 복사
async function copyReleaseFile(publicDirectory: string, outputDirectory: string, relativePath: string) {
  const target = path.join(outputDirectory, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(publicDirectory, relativePath), target);
}

// public 하위 미포함 릴리스 자산 경고 (신규 자산 목록 누락 감지)
async function warnUncopiedAssets(publicDirectory: string, copied: ReadonlySet<string>) {
  const entries = await readdir(publicDirectory, { recursive: true, withFileTypes: true });
  const missing = entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(publicDirectory, path.join(entry.parentPath, entry.name)).replaceAll('\\', '/'))
    .filter((file) => (
      RELEASE_EXTENSIONS.some((ext) => file.endsWith(ext))
      && !copied.has(file)
      && !isLegacyRuntimeAsset(file)
    ));
  if (missing.length > 0) {
    console.warn(`[release-assets] 릴리스 목록에 없는 자산 ${missing.length}건 미포함:`, missing.join(', '));
  }
}

// 릴리스 디렉터리 자산 복사
async function copyReleaseDirectory(
  publicDirectory: string,
  outputDirectory: string,
  relativePath: string,
  extension?: string,
): Promise<string[]> {
  const source = path.join(publicDirectory, relativePath);
  const files = (await readdir(source, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && (!extension || entry.name.endsWith(extension)))
    .map((entry) => path.join(relativePath, entry.name).replaceAll('\\', '/'));
  await Promise.all(files.map((file) => copyReleaseFile(publicDirectory, outputDirectory, file)));
  return files;
}

// 릴리스 자산 기반 캐시 버전 생성
async function createBuildCacheVersion(outputDirectory: string, assets: readonly string[]): Promise<string> {
  const hash = createHash('sha256');
  for (const file of [...assets].sort()) {
    hash.update(file);
    hash.update(await readFile(path.join(outputDirectory, file)));
  }
  return hash.digest('hex').slice(0, 12);
}

// 앱 셸 사전 캐시 정보 갱신
async function injectBuildAssets(
  outputDirectory: string,
  buildAssets: readonly string[],
  cacheVersion: string,
): Promise<void> {
  const serviceWorkerPath = path.join(outputDirectory, 'sw.js');
  const source = await readFile(serviceWorkerPath, 'utf8');
  const entries = buildAssets.map((file) => `  '/${file}',`).join('\n');
  await writeFile(serviceWorkerPath, source
    .replace(BUILD_ASSET_MARKER, entries)
    .replace(BUILD_CACHE_VERSION_MARKER, cacheVersion));
}

// 릴리스 필수 자산 선별 복사
function createReleaseAssetsPlugin(): Plugin {
  let config: ResolvedConfig;

  return {
    name: 'release-assets',
    apply: 'build',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    async writeBundle(_options, bundle) {
      const publicDirectory = path.resolve(config.root, 'public');
      const outputDirectory = path.resolve(config.root, config.build.outDir);
      await Promise.all(RELEASE_FILES.map((file) => copyReleaseFile(publicDirectory, outputDirectory, file)));
      const copiedDirectories = await Promise.all([
        copyReleaseDirectory(publicDirectory, outputDirectory, 'assets/cards', '.webp'),
        copyReleaseDirectory(publicDirectory, outputDirectory, 'assets/classes', '-v2.webp'),
        copyReleaseDirectory(publicDirectory, outputDirectory, 'assets/monsters', '-v2.webp'),
        copyReleaseDirectory(publicDirectory, outputDirectory, 'assets/audio'),
        copyReleaseDirectory(publicDirectory, outputDirectory, 'assets/fonts'),
      ]);
      const copied = new Set<string>([...RELEASE_FILES, ...copiedDirectories.flat()]);
      const buildAssets = [...new Set([
        ...Object.values(bundle).map((output) => output.fileName),
        ...copied,
      ])].filter((file) => file !== 'sw.js');
      const cacheVersion = await createBuildCacheVersion(outputDirectory, buildAssets);
      await injectBuildAssets(outputDirectory, buildAssets, cacheVersion);
      await warnUncopiedAssets(publicDirectory, copied);
    },
  };
}

export default defineConfig(({ command }) => ({
  publicDir: command === 'build' ? false : 'public',
  plugins: [react(), createReleaseAssetsPlugin()],
  build: {
    rollupOptions: {
      output: {
        // 벤더 청크 분리 (앱 코드 변경 시 캐시 재사용)
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },
}));
