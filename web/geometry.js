// Geometry and matrix helpers for the teapot viewer. Pure functions, no WebGL, so they are unit-tested.

import { TEAPOT_VERTICES, TEAPOT_PATCHES } from './teapot-data.js';

const bernstein = (t) => {
  const s = 1 - t;
  return [s * s * s, 3 * t * s * s, 3 * t * t * s, t * t * t];
};

const bernsteinDerivative = (t) => {
  const s = 1 - t;
  return [-3 * s * s, 3 * s * s - 6 * t * s, 6 * t * s - 3 * t * t, 3 * t * t];
};

/** Control point k (0..15) of patch p as [x, y, z]. */
function controlPoint(p, k) {
  const i = TEAPOT_PATCHES[p * 16 + k] * 3;
  return [TEAPOT_VERTICES[i], TEAPOT_VERTICES[i + 1], TEAPOT_VERTICES[i + 2]];
}

/** Point and partial derivatives of patch p at (u, v), u and v in [0, 1]. */
export function evaluatePatch(p, u, v) {
  const bu = bernstein(u), bv = bernstein(v), du = bernsteinDerivative(u), dv = bernsteinDerivative(v);
  const pos = [0, 0, 0], tu = [0, 0, 0], tv = [0, 0, 0];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const c = controlPoint(p, i * 4 + j);
      for (let a = 0; a < 3; a++) {
        pos[a] += bu[i] * bv[j] * c[a];
        tu[a] += du[i] * bv[j] * c[a];
        tv[a] += bu[i] * dv[j] * c[a];
      }
    }
  }
  return { pos, tu, tv };
}

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const length = (a) => Math.hypot(a[0], a[1], a[2]);

/**
 * Normal of patch p at (u, v). Where a patch collapses to a point (the lid knob and the base),
 * one tangent is zero; the normal is then taken a small step inside the patch.
 */
function patchNormal(p, u, v) {
  const eps = 1e-3;
  for (const [uu, vv] of [[u, v], [Math.min(Math.max(u, eps), 1 - eps), Math.min(Math.max(v, eps), 1 - eps)]]) {
    const { tu, tv } = evaluatePatch(p, uu, vv);
    const n = cross(tu, tv);
    const len = length(n);
    if (len > 1e-6) {
      return [n[0] / len, n[1] / len, n[2] / len];
    }
  }
  return [0, 1, 0];
}

/**
 * Tessellates all 32 patches into an (n+1) x (n+1) grid each.
 * Returns interleaved positions and normals, triangle indices and wireframe line indices.
 */
export function tessellateTeapot(n) {
  if (!Number.isInteger(n) || n < 1 || n > 64) {
    throw new RangeError('subdivisions must be an integer from 1 to 64');
  }
  const perPatch = (n + 1) * (n + 1);
  const positions = new Float32Array(32 * perPatch * 3);
  const normals = new Float32Array(32 * perPatch * 3);
  const triangles = new Uint32Array(32 * n * n * 6);
  const lines = new Uint32Array(32 * n * (n + 1) * 4);
  let t = 0, l = 0;
  for (let p = 0; p < 32; p++) {
    const base = p * perPatch;
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= n; j++) {
        const k = (base + i * (n + 1) + j) * 3;
        const { pos } = evaluatePatch(p, i / n, j / n);
        const nrm = patchNormal(p, i / n, j / n);
        positions.set(pos, k);
        normals.set(nrm, k);
      }
    }
    const at = (i, j) => base + i * (n + 1) + j;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        triangles.set([at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j), at(i + 1, j + 1), at(i, j + 1)], t);
        t += 6;
      }
    }
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j < n; j++) {
        lines.set([at(i, j), at(i, j + 1), at(j, i), at(j + 1, i)], l);
        l += 4;
      }
    }
  }
  return { positions, normals, triangles, lines };
}

/** A cone with its base on y = 0 and its tip at y = height, with texture coordinates. */
export function makeCone(radius, height, segments) {
  const positions = [], normals = [], uvs = [], triangles = [];
  const slant = Math.hypot(radius, height);
  for (let s = 0; s <= segments; s++) {
    const a = (s / segments) * Math.PI * 2;
    const x = Math.cos(a), z = Math.sin(a);
    const n = [(x * height) / slant, radius / slant, (z * height) / slant];
    positions.push(x * radius, 0, z * radius, 0, height, 0);
    normals.push(...n, ...n);
    uvs.push(s / segments, 0, s / segments, 1);
  }
  for (let s = 0; s < segments; s++) {
    const b = s * 2;
    triangles.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
  }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    triangles: new Uint32Array(triangles),
  };
}

// --- 4x4 column-major matrices (as WebGL expects) ---

export function identity() {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

export function multiply(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[k * 4 + r] * b[c * 4 + k];
      }
      out[c * 4 + r] = sum;
    }
  }
  return out;
}

export function perspective(fovYRadians, aspect, near, far) {
  const f = 1 / Math.tan(fovYRadians / 2);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

export function translation(x, y, z) {
  const m = identity();
  m[12] = x;
  m[13] = y;
  m[14] = z;
  return m;
}

export function rotationX(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
}

export function rotationY(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
}

export function scale(k) {
  return new Float32Array([k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, 0, 0, 0, 1]);
}

/**
 * Matrix for transforming normals. The viewer only combines rotations, translations and uniform
 * scaling, for which the upper-left 3x3 is a valid normal matrix (the shader renormalises).
 */
export function normalMatrix(m) {
  return new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]);
}

/** Converts "#rrggbb" to [r, g, b] in 0..1. */
export function hexToRgb(hex) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) {
    throw new TypeError(`not a #rrggbb colour: ${hex}`);
  }
  return [1, 2, 3].map((k) => parseInt(m[k], 16) / 255);
}
