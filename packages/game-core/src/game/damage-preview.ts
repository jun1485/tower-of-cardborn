// 카드 설명 데미지 미리보기 계산 유틸

import type { CardDefinition } from '../types/card';
import type { Enemy, StatusEffect } from '../types/character';

function hasActiveStatus(statusEffects: readonly StatusEffect[], type: StatusEffect['type']): boolean {
  return statusEffects.some((status) => status.type === type && status.duration > 0);
}

function getStatusAmount(statusEffects: readonly StatusEffect[], type: StatusEffect['type']): number {
  const status = statusEffects.find((item) => item.type === type);
  return status ? status.duration : 0;
}

function calculatePreviewDamage(
  baseDamage: number,
  strength: number,
  attackerWeak: boolean,
  targetVulnerable: boolean,
): number {
  let totalDamage = baseDamage + strength;
  if (attackerWeak) totalDamage = Math.floor(totalDamage * 0.75);
  if (targetVulnerable) totalDamage = Math.floor(totalDamage * 1.5);
  return Math.max(0, totalDamage);
}

function resolveTargetEnemy(
  enemies: readonly Enemy[],
  targetEnemyId: string | undefined,
): Enemy | null {
  if (enemies.length === 0) return null;
  if (!targetEnemyId) return enemies[0];
  const targetEnemy = enemies.find((enemy) => enemy.id === targetEnemyId);
  return targetEnemy ?? enemies[0];
}

export function getPreviewDescription(
  definition: CardDefinition,
  playerStatusEffects: readonly StatusEffect[],
  enemies: readonly Enemy[],
  targetEnemyId?: string,
): string {
  const damageEffects = definition.effects.filter((effect) => effect.type === 'damage');
  if (damageEffects.length === 0) return definition.description;

  const strength = getStatusAmount(playerStatusEffects, 'strength');
  const attackerWeak = hasActiveStatus(playerStatusEffects, 'weak');
  let damageEffectIndex = 0;

  return definition.description.replace(/(\d+)(\s*데미지)/g, (match) => {
    const damageEffect = damageEffects[damageEffectIndex];
    damageEffectIndex += 1;
    if (!damageEffect) return match;

    const targetEnemy = resolveTargetEnemy(enemies, targetEnemyId);
    if (!targetEnemy) return match;
    const targetVulnerable = hasActiveStatus(targetEnemy.statusEffects, 'vulnerable');
    const previewDamage = calculatePreviewDamage(damageEffect.value, strength, attackerWeak, targetVulnerable);

    if (previewDamage === damageEffect.value) return match;
    return match.replace(/\d+/, `${damageEffect.value}(${previewDamage})`);
  });
}

