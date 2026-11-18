// WebGL 2 viewer for the three teapot projects: wireframe patches, Blinn-Phong lighting and sphere-mapped textures.

import {
  tessellateTeapot, makeCone, multiply, perspective, translation, rotationX, rotationY, scale,
  normalMatrix, hexToRgb,
} from './geometry.js';

const WIRE_VS = `#version 300 es
in vec3 aPosition;
uniform mat4 uModelView, uProjection;
void main() { gl_Position = uProjection * uModelView * vec4(aPosition, 1.0); }`;

const WIRE_FS = `#version 300 es
precision mediump float;
uniform vec3 uColor;
out vec4 fragColor;
void main() { fragColor = vec4(uColor, 1.0); }`;

// Ported from Project 2's vshader_teapot.glsl / fshader_teapot.glsl (GLSL 1.50 -> GLSL ES 3.00).
const PHONG_VS = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
out vec3 fN, fE, fL;
uniform mat4 uModelView, uProjection, uView;
uniform mat3 uNormalMatrix;
uniform vec4 uLightPosition;   // world space; w = 0 means a distant light
void main() {
  vec3 pos = (uModelView * vec4(aPosition, 1.0)).xyz;
  fN = uNormalMatrix * aNormal;
  fE = -pos;
  vec4 light = uView * uLightPosition;
  fL = uLightPosition.w != 0.0 ? light.xyz - pos : light.xyz;
  gl_Position = uProjection * vec4(pos, 1.0);
}`;

const PHONG_FS = `#version 300 es
precision mediump float;
in vec3 fN, fE, fL;
uniform vec4 uAmbientProduct, uDiffuseProduct, uSpecularProduct;
uniform float uShininess;
out vec4 fragColor;
void main() {
  vec3 N = normalize(fN);
  vec3 E = normalize(fE);
  vec3 L = normalize(fL);
  if (dot(N, E) < 0.0) N = -N;   // light both sides: some Bezier patches face inwards
  vec3 H = normalize(L + E);
  vec4 ambient = uAmbientProduct;
  vec4 diffuse = max(dot(L, N), 0.0) * uDiffuseProduct;
  vec4 specular = pow(max(dot(N, H), 0.0), uShininess) * uSpecularProduct;
  if (dot(L, N) < 0.0) specular = vec4(0.0);
  fragColor = vec4((ambient + diffuse + specular).rgb, 1.0);
}`;

// Project 3 used OpenGL's sphere-map texture generation; this computes the same coordinates.
const SPHERE_VS = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
out vec2 vUv;
out float vShade;
uniform mat4 uModelView, uProjection;
uniform mat3 uNormalMatrix;
void main() {
  vec4 eye = uModelView * vec4(aPosition, 1.0);
  vec3 N = normalize(uNormalMatrix * aNormal);
  vec3 U = normalize(eye.xyz);
  if (dot(N, U) > 0.0) N = -N;
  vec3 R = reflect(U, N);
  float m = 2.0 * sqrt(R.x * R.x + R.y * R.y + (R.z + 1.0) * (R.z + 1.0));
  vUv = R.xy / m + 0.5;
  vShade = 0.55 + 0.45 * max(N.z, 0.0);
  gl_Position = uProjection * eye;
}`;

const SPHERE_FS = `#version 300 es
precision mediump float;
in vec2 vUv;
in float vShade;
uniform sampler2D uTexture;
out vec4 fragColor;
void main() { fragColor = vec4(texture(uTexture, vUv).rgb * vShade, 1.0); }`;

const TEXTURES = {
  marbles: 'textures/marbles.jpg',
  chess: 'textures/chess.jpg',
  chrome: 'textures/chrome.jpg',
  diamond: 'textures/blue_diamond.jpg',
  default: 'textures/default.jpg',
};

export const PRESETS = {
  gold: { la: '#333333', ld: '#ffffff', ls: '#ffffff', ma: '#40301a', md: '#d4a017', ms: '#fff2c4', shininess: 60 },
  plastic: { la: '#333333', ld: '#ffffff', ls: '#ffffff', ma: '#1a1a40', md: '#3355dd', ms: '#ffffff', shininess: 25 },
  clay: { la: '#404040', ld: '#ffffff', ls: '#222222', ma: '#3a2418', md: '#b5653a', ms: '#202020', shininess: 5 },
  pearl: { la: '#555555', ld: '#ffffff', ls: '#ffffff', ma: '#4a4848', md: '#f0e6e0', ms: '#c0c0c0', shininess: 90 },
};

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'aPosition');
  gl.bindAttribLocation(p, 1, 'aNormal');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p));
  }
  const uniforms = {};
  for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
    const name = gl.getActiveUniform(p, i).name;
    uniforms[name] = gl.getUniformLocation(p, name);
  }
  return { p, u: uniforms };
}

function buffer(gl, target, data) {
  const b = gl.createBuffer();
  gl.bindBuffer(target, b);
  gl.bufferData(target, data, gl.STATIC_DRAW);
  return b;
}

function meshVao(gl, mesh) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  buffer(gl, gl.ARRAY_BUFFER, mesh.positions);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  buffer(gl, gl.ARRAY_BUFFER, mesh.normals);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  const tri = buffer(gl, gl.ELEMENT_ARRAY_BUFFER, mesh.triangles);
  gl.bindVertexArray(null);
  const lines = mesh.lines ? buffer(gl, gl.ELEMENT_ARRAY_BUFFER, mesh.lines) : null;
  return { vao, tri, lines, triCount: mesh.triangles.length, lineCount: mesh.lines ? mesh.lines.length : 0 };
}

function loadTexture(gl, url, onReady) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 128, 255]));
  const img = new Image();
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    onReady();
  };
  img.src = url;
  return tex;
}

export function startViewer(canvas, controls) {
  const gl = canvas.getContext('webgl2', { antialias: true });
  if (!gl) {
    return null;
  }
  const wire = program(gl, WIRE_VS, WIRE_FS);
  const phong = program(gl, PHONG_VS, PHONG_FS);
  const sphere = program(gl, SPHERE_VS, SPHERE_FS);
  const cone = meshVao(gl, makeCone(0.3, 0.6, 24));
  let teapot = null;
  let subdivisions = 0;

  let needsDraw = true;
  const request = () => { needsDraw = true; };
  const textures = Object.fromEntries(Object.entries(TEXTURES).map(([k, url]) => [k, loadTexture(gl, url, request)]));

  const view = { yaw: -0.6, pitch: 0.35, distance: 9, panX: 0, panY: 0 };
  const resetView = () => Object.assign(view, { yaw: -0.6, pitch: 0.35, distance: 9, panX: 0, panY: 0 });

  function setSubdivisions(n) {
    if (n === subdivisions) return;
    subdivisions = n;
    teapot = meshVao(gl, tessellateTeapot(n));
    request();
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      request();
    }
  }

  function draw() {
    const s = controls.state();
    setSubdivisions(s.subdivisions);
    resize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.06, 0.07, 0.09, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    const projection = perspective(Math.PI / 4, canvas.width / Math.max(canvas.height, 1), 0.1, 200);
    const aspect = canvas.width / Math.max(canvas.height, 1);
    const fit = Math.max(1, 1.1 / aspect);   // back away on portrait screens so the spout stays in view
    const viewM = multiply(translation(view.panX, view.panY, -view.distance * fit), multiply(rotationX(view.pitch), rotationY(view.yaw)));
    const teapotModel = translation(-0.2, -1.4, 0);
    const mv = multiply(viewM, teapotModel);

    if (s.mode === 'wire') {
      gl.useProgram(wire.p);
      gl.uniformMatrix4fv(wire.u.uProjection, false, projection);
      gl.uniformMatrix4fv(wire.u.uModelView, false, mv);
      gl.uniform3f(wire.u.uColor, 0.55, 0.78, 1.0);
      gl.bindVertexArray(teapot.vao);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapot.lines);
      gl.drawElements(gl.LINES, teapot.lineCount, gl.UNSIGNED_INT, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapot.tri);
    } else if (s.mode === 'phong') {
      gl.useProgram(phong.p);
      const la = hexToRgb(s.la), ld = hexToRgb(s.ld), ls = hexToRgb(s.ls);
      const ma = hexToRgb(s.ma), md = hexToRgb(s.md), ms = hexToRgb(s.ms);
      const product = (a, b) => [a[0] * b[0], a[1] * b[1], a[2] * b[2], 1];
      gl.uniformMatrix4fv(phong.u.uProjection, false, projection);
      gl.uniformMatrix4fv(phong.u.uModelView, false, mv);
      gl.uniformMatrix4fv(phong.u.uView, false, viewM);
      gl.uniformMatrix3fv(phong.u.uNormalMatrix, false, normalMatrix(mv));
      gl.uniform4fv(phong.u.uLightPosition, s.lightType === 'point' ? [4, 6, 6, 1] : [1, 1.5, 1, 0]);
      gl.uniform4fv(phong.u.uAmbientProduct, product(la, ma));
      gl.uniform4fv(phong.u.uDiffuseProduct, product(ld, md));
      gl.uniform4fv(phong.u.uSpecularProduct, product(ls, ms));
      gl.uniform1f(phong.u.uShininess, s.shininess);
      gl.bindVertexArray(teapot.vao);
      gl.drawElements(gl.TRIANGLES, teapot.triCount, gl.UNSIGNED_INT, 0);
    } else {
      gl.useProgram(sphere.p);
      gl.uniformMatrix4fv(sphere.u.uProjection, false, projection);
      gl.uniform1i(sphere.u.uTexture, 0);
      gl.activeTexture(gl.TEXTURE0);
      const drawWith = (mesh, model, tex) => {
        const m = multiply(viewM, model);
        gl.uniformMatrix4fv(sphere.u.uModelView, false, m);
        gl.uniformMatrix3fv(sphere.u.uNormalMatrix, false, normalMatrix(m));
        gl.bindTexture(gl.TEXTURE_2D, textures[tex]);
        gl.bindVertexArray(mesh.vao);
        gl.drawElements(gl.TRIANGLES, mesh.triCount, gl.UNSIGNED_INT, 0);
      };
      drawWith(teapot, teapotModel, s.texture);
      if (s.showCone) {
        drawWith(cone, multiply(translation(2.6, -1.4, 1.6), scale(1.8)), 'diamond');
      }
    }
    gl.bindVertexArray(null);
  }

  // --- interaction: drag to rotate, shift- or right-drag to pan, wheel or pinch to zoom, keys when focused ---
  let drag = null;
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, pan: e.shiftKey || e.button === 2 };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX;
    drag.y = e.clientY;
    if (drag.pan) {
      view.panX += dx * 0.01;
      view.panY -= dy * 0.01;
    } else {
      view.yaw += dx * 0.01;
      view.pitch = Math.max(-1.5, Math.min(1.5, view.pitch + dy * 0.01));
    }
    request();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    view.distance = Math.max(4, Math.min(30, view.distance * Math.exp(e.deltaY * 0.001)));
    request();
  }, { passive: false });
  canvas.addEventListener('keydown', (e) => {
    const step = 0.1;
    const actions = {
      ArrowLeft: () => { view.yaw -= step; }, ArrowRight: () => { view.yaw += step; },
      ArrowUp: () => { view.pitch = Math.max(-1.5, view.pitch - step); },
      ArrowDown: () => { view.pitch = Math.min(1.5, view.pitch + step); },
      '+': () => { view.distance = Math.max(4, view.distance * 0.9); },
      '=': () => { view.distance = Math.max(4, view.distance * 0.9); },
      '-': () => { view.distance = Math.min(30, view.distance * 1.1); },
      r: resetView,
    };
    if (actions[e.key]) {
      e.preventDefault();
      actions[e.key]();
      request();
    }
  });
  window.addEventListener('resize', request);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(now - last, 100) / 1000;
    last = now;
    if (controls.state().autoRotate && !drag) {
      view.yaw += dt * 0.5;
      needsDraw = true;
    }
    if (needsDraw) {
      needsDraw = false;
      draw();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return { redraw: request, resetView: () => { resetView(); request(); } };
}
