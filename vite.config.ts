import { copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import type { Plugin, ResolvedConfig } from 'vite';

const RELEASE_FILES = [
  'manifest.webmanifest',
  'assets/cards/placeholder.svg',
  'assets/ui/app_icon_180.png',
  'assets/ui/app_icon_192.png',
  'assets/ui/app_icon_512.png',
  'assets/ui/cursor-hero.svg',
  'assets/ui/deck.png',
  'assets/ui/bg_combat_hd.webp',
  'assets/ui/bg_map_1.webp',
  'assets/ui/bg_map_2.webp',
  'assets/ui/bg_map_3.webp',
] as const;

// 릴리스 단일 자산 복사
async function copyReleaseFile(publicDirectory: string, outputDirectory: string, relativePath: string) {
  const target = path.join(outputDirectory, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(publicDirectory, relativePath), target);
}

// 릴리스 디렉터리 자산 복사
async function copyReleaseDirectory(
  publicDirectory: string,
  outputDirectory: string,
  relativePath: string,
  extension?: string,
) {
  const source = path.join(publicDirectory, relativePath);
  const files = (await readdir(source, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && (!extension || entry.name.endsWith(extension)))
    .map((entry) => path.join(relativePath, entry.name));
  await Promise.all(files.map((file) => copyReleaseFile(publicDirectory, outputDirectory, file)));
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
    async writeBundle() {
      const publicDirectory = path.resolve(config.root, 'public');
      const outputDirectory = path.resolve(config.root, config.build.outDir);
      await Promise.all(RELEASE_FILES.map((file) => copyReleaseFile(publicDirectory, outputDirectory, file)));
      await Promise.all([
        copyReleaseDirectory(publicDirectory, outputDirectory, 'assets/cards', '.webp'),
        copyReleaseDirectory(publicDirectory, outputDirectory, 'assets/classes', '.webp'),
        copyReleaseDirectory(publicDirectory, outputDirectory, 'assets/monsters', '.webp'),
        copyReleaseDirectory(publicDirectory, outputDirectory, 'assets/audio'),
        copyReleaseDirectory(publicDirectory, outputDirectory, 'assets/fonts'),
      ]);
    },
  };
}

export default defineConfig(({ command }) => ({
  publicDir: command === 'build' ? false : 'public',
  plugins: [react(), createReleaseAssetsPlugin()],
}));
