export const LEVELS = [
  0,
 100,
 250,
 450,
 700,
 1000,
 1400,
 1850,
 2350,
 2900,
];

export function getLevel(xp: number) {
  let level = 1;

  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i]) {
      level = i + 1;
    }
  }

  return level;
}

export function getCurrentLevelXP(level: number) {
  return LEVELS[level - 1] ?? 0;
}

export function getNextLevelXP(level: number) {
  return LEVELS[level] ?? LEVELS[LEVELS.length - 1];
}

export function getXPProgress(xp: number) {
  const level = getLevel(xp);

  const current = getCurrentLevelXP(level);

  const next = getNextLevelXP(level);

  const progress = (xp - current) / (next - current);

  return Math.min(progress, 1);
}