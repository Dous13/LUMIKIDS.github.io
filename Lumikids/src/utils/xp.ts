export const LEVELS = [
  0,
 25,
 50,
 75,
 100,
 125,
 150,
 175,
 200,
 225,
 250,
 275,
 300,
 325,
 350,
 375,
 400,
 425,
 450,
 475,
 500,
 525,
 550,
 575,
 600,
 625,
 650,
 675,
 700,
 725,
 750,
 775,
 800,
 825,
 850,
 875,
 900,
 925,
 950,
 975,
 1000,
 1025,
 1050,
 1075,
 1100,
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