import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEAPOT_VERTICES, TEAPOT_PATCHES } from './teapot-data.js';
import {
  evaluatePatch, tessellateTeapot, makeCone, multiply, identity, perspective,
  translation, rotationY, normalMatrix, hexToRgb,
} from './geometry.js';

const close = (a, b, eps = 1e-5) => assert.ok(Math.abs(a - b) < eps, `${a} is not close to ${b}`);

test('teapot data has 306 control points and 32 patches of 16', () => {
  assert.equal(TEAPOT_VERTICES.length, 306 * 3);
  assert.equal(TEAPOT_PATCHES.length, 32 * 16);
  assert.ok(Math.max(...TEAPOT_PATCHES) < 306);
});

test('a Bezier patch passes through its corner control points', () => {
  for (const [u, v, k] of [[0, 0, 0], [0, 1, 3], [1, 0, 12], [1, 1, 15]]) {
    const { pos } = evaluatePatch(5, u, v);
    const idx = TEAPOT_PATCHES[5 * 16 + k] * 3;
    for (let a = 0; a < 3; a++) close(pos[a], TEAPOT_VERTICES[idx + a]);
  }
});

test('tessellation produces the expected counts, unit normals and in-range indices', () => {
  const n = 6;
  const mesh = tessellateTeapot(n);
  const verts = 32 * (n + 1) * (n + 1);
  assert.equal(mesh.positions.length, verts * 3);
  assert.equal(mesh.triangles.length, 32 * n * n * 6);
  assert.equal(mesh.lines.length, 32 * n * (n + 1) * 4);
  assert.ok(mesh.triangles.every((i) => i < verts));
  assert.ok(mesh.lines.every((i) => i < verts));
  for (let i = 0; i < verts; i++) {
    close(Math.hypot(mesh.normals[i * 3], mesh.normals[i * 3 + 1], mesh.normals[i * 3 + 2]), 1, 1e-4);
  }
});

test('the teapot fits its known bounding box', () => {
  const { positions } = tessellateTeapot(8);
  let minY = Infinity, maxY = -Infinity, maxX = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    minY = Math.min(minY, positions[i + 1]);
    maxY = Math.max(maxY, positions[i + 1]);
    maxX = Math.max(maxX, positions[i]);
  }
  close(minY, 0, 1e-4);
  close(maxY, 3.15, 1e-4);
  assert.ok(maxX > 3 && maxX <= 3.5, `spout reaches x=${maxX}`);
});

test('rejects bad subdivision counts', () => {
  assert.throws(() => tessellateTeapot(0), RangeError);
  assert.throws(() => tessellateTeapot(2.5), RangeError);
});

test('cone normals are unit length and its tip is at the given height', () => {
  const cone = makeCone(0.3, 0.6, 12);
  assert.equal(cone.positions.length / 3, 26);
  close(cone.positions[4], 0.6);
  for (let i = 0; i < cone.normals.length; i += 3) {
    close(Math.hypot(cone.normals[i], cone.normals[i + 1], cone.normals[i + 2]), 1);
  }
});

test('matrix multiply composes transforms in the right order', () => {
  const m = multiply(translation(1, 2, 3), rotationY(Math.PI / 2));
  // (1,0,0) rotated 90 degrees about y goes to (0,0,-1), then is moved by (1,2,3).
  const x = [1, 0, 0, 1];
  const out = [0, 1, 2].map((r) => x.reduce((s, xv, c) => s + m[c * 4 + r] * xv, 0));
  out.forEach((v, i) => close(v, [1, 2, 2][i]));
  assert.deepEqual(Array.from(multiply(identity(), m)), Array.from(m));
});

test('perspective maps the near and far planes to -1 and 1', () => {
  const p = perspective(Math.PI / 3, 1.5, 1, 10);
  const depth = (z) => (p[10] * z + p[14]) / (p[11] * z);
  close(depth(-1), -1);
  close(depth(-10), 1);
});

test('normal matrix is the upper-left 3x3', () => {
  const r = rotationY(0.7);
  assert.deepEqual(Array.from(normalMatrix(r)), [r[0], r[1], r[2], r[4], r[5], r[6], r[8], r[9], r[10]]);
});

test('hex colours convert to 0..1 RGB', () => {
  assert.deepEqual(hexToRgb('#ff0080').map((v) => Math.round(v * 255)), [255, 0, 128]);
  assert.throws(() => hexToRgb('red'), TypeError);
});
