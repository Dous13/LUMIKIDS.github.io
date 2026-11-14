import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerHooks } from 'node:module';
// Metro resolves extensionless TypeScript imports; give Node the same resolution for these tests.
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) return next(specifier + '.ts', context);
  return next(specifier, context);
}});
const { UPPERCASE_A_STROKES, validateUppercaseA, validateUppercaseAStroke, validateTraceStroke } = await import('./tracingValidator.ts');
const { writingStrokeTemplates, writingTraceDefinitions } = await import('../../data/writingStrokeTemplates.ts');
const { writingLessons } = await import('../../data/writingLessons.ts');

const width = 320, height = 390;
const strokes = UPPERCASE_A_STROKES.map(([a, b]) => Array.from({ length: 41 }, (_, i) => ({
  x: (a.x + (b.x - a.x) * i / 40) * width,
  y: (a.y + (b.y - a.y) * i / 40) * height,
})));
const valid = value => validateUppercaseA(value, width, height);

test('requires all three strokes; empty/Clear, tap and missing crossbar stay locked', () => {
  for (const value of [[], [[strokes[0][0]]], strokes.slice(0, 1), strokes.slice(0, 2)]) {
    assert.equal(valid(value), false);
  }
  assert.equal(valid(strokes), true);
  assert.equal(valid([]), false);
});

test('rejects reversed direction, wrong order and partial coverage', () => {
  assert.equal(valid([[...strokes[0]].reverse(), ...strokes.slice(1)]), false);
  assert.equal(valid([strokes[1], strokes[0], strokes[2]]), false);
  assert.equal(valid([strokes[0].slice(0, 20), ...strokes.slice(1)]), false);
});

test('rejects excursions and backtracking even when the guide is covered', () => {
  const detour = [...strokes[0].slice(0, 20), { x: 0, y: 0 }, ...strokes[0].slice(20)];
  assert.equal(valid([detour, ...strokes.slice(1)]), false);
  const scribble = [...strokes[0], ...[...strokes[0]].reverse(), ...strokes[0]];
  assert.equal(valid([scribble, ...strokes.slice(1)]), false);
});

test('allows small motor variation and retries against the next required stroke', () => {
  const wobbly = strokes.map(stroke => stroke.map((p, i) => ({ x: p.x + Math.sin(i) * 3, y: p.y })));
  assert.equal(valid(wobbly), true);
  assert.equal(validateUppercaseAStroke(strokes[1], 0, width, height), false);
  strokes.forEach((stroke, i) => assert.equal(validateUppercaseAStroke(stroke, i, width, height), true));
});

test('rejects invalid dimensions, coordinates and indices', () => {
  assert.equal(validateUppercaseAStroke(strokes[0], 0, 0, height), false);
  assert.equal(validateUppercaseAStroke(strokes[0], 0, NaN, height), false);
  assert.equal(validateUppercaseAStroke([{ x: NaN, y: 0 }, strokes[0][40]], 0, width, height), false);
  assert.equal(validateUppercaseAStroke(strokes[0], 3, width, height), false);
});

for (const [letter, template] of Object.entries(writingStrokeTemplates)) {
  test(`template ${letter}: complete strokes pass; taps, partial strokes and reversals fail`, () => {
    template.forEach((stroke, index) => {
      const pixels = stroke.map(p => ({ x: p.x * width, y: p.y * height }));
      assert.equal(validateTraceStroke(letter, pixels, index, width, height), true, `valid stroke ${index}`);
      assert.equal(validateTraceStroke(letter, [pixels[0], pixels[0]], index, width, height), false, 'tap');
      assert.equal(validateTraceStroke(letter, [...pixels].reverse(), index, width, height), false, 'reverse');
      const partial = pixels.length === 2 ? [pixels[0], {
        x: (pixels[0].x + pixels[1].x) / 2, y: (pixels[0].y + pixels[1].y) / 2,
      }] : pixels.slice(0, Math.ceil(pixels.length / 2));
      assert.equal(validateTraceStroke(letter, partial, index, width, height), false, 'partial');
      assert.equal(validateTraceStroke(letter, [...pixels.slice(0, 1), { x: 0, y: 0 }, ...pixels.slice(1)], index, width, height), false, 'off-guide scribble');
      if (template.length > 1) {
        assert.equal(validateTraceStroke(letter, pixels, (index + 1) % template.length, width, height), false, 'wrong stroke order');
      }
      assert.equal(writingTraceDefinitions[letter].strokes[index].points, stroke, 'metadata uses rendered paths');
    });
  });
}

test('all lesson phases and word characters have local templates, including X-ray', () => {
  for (const lesson of writingLessons) {
    for (const c of lesson.letter + lesson.letter.toLowerCase() + lesson.word) {
      assert.ok(writingStrokeTemplates[c], `missing ${c}`);
    }
  }
  assert.equal(validateTraceStroke('?', strokes[0], 0, width, height), false);
});

test('all 52 letters have complete definitions and fit phone/tablet layouts', () => {
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz') {
    const template = writingStrokeTemplates[letter], definition = writingTraceDefinitions[letter];
    assert.equal(definition.letter, letter);
    assert.equal(definition.case, letter === letter.toUpperCase() ? 'uppercase' : 'lowercase');
    assert.ok(definition.validation.tolerance > 0);
    const points = template.flat();
    assert.ok(Math.abs(Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y)) - .70) < .001);
    template.forEach((stroke, index) => {
      assert.ok(stroke.length >= 2);
      assert.equal(definition.strokes[index].order, index + 1);
      for (const [w, h] of [[240, 390], [320, 390], [728, 390], [984, 390]]) {
        const pixels = stroke.map(p => ({ x: p.x * w, y: p.y * h }));
        for (const p of pixels) {
          assert.ok(p.x >= 18 && p.x <= w - 18 && p.y >= 30 && p.y <= h - 40, `${letter}: margin`);
        }
        assert.equal(validateTraceStroke(letter, pixels, index, w, h), true, `${letter}: scaled stroke ${index}`);
      }
    });
  }
});

test('enlarged A fills 70% of canvas height and leaves space for markers and instructions', () => {
  for (const [w, h] of [[240, 390], [320, 390], [390, 390], [728, 390], [984, 390]]) {
    const points = UPPERCASE_A_STROKES.flat().map(p => ({ x: p.x * w, y: p.y * h }));
    const top = Math.min(...points.map(p => p.y)), bottom = Math.max(...points.map(p => p.y));
    assert.ok(Math.abs((bottom - top) / h - .70) < .001);
    for (const point of points) {
      assert.ok(point.x - 18 >= 0 && point.x + 18 <= w, 'start marker fits horizontally');
      assert.ok(point.y - 18 >= 30 && point.y + 18 <= h - 40, 'header and feedback remain clear');
    }
    const pixels = UPPERCASE_A_STROKES.map(stroke => stroke.map(p => ({ x: p.x * w, y: p.y * h })));
    assert.equal(validateUppercaseA(pixels, w, h), true, 'resized guide matches validator');
    assert.equal(validateUppercaseA(pixels.slice(0, 1), w, h), false, 'one stroke stays locked');
    assert.equal(validateUppercaseA(pixels.slice(0, 2), w, h), false, 'crossbar is required');
  }
});
