// The dream garden's 3D scene, from the Afterdream Garden v2 design (garden-scene-v2.js).
// Runs inside the garden's DOM component (a web view on phones), so it can use the DOM and WebGL.
// Growth is in nights: every item appears once growth reaches its night (`day`).

import * as THREE from 'three';

export function createGarden(host, cb = {}) {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const R = (a, b) => a + rnd() * (b - a);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const out = x => { x = clamp(x); return 1 - (1 - x) * (1 - x); };

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; // three r18x softens PCF itself (PCFSoftShadowMap was removed)
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const cv = renderer.domElement;
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab;display:block';
  host.appendChild(cv);
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  // ---------- canvas textures ----------
  const mk = (w, h, fn, srgb = true) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    fn(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso;
    return t;
  };
  const speck = (x, w, h, n, cols, r0, r1, a) => {
    for (let i = 0; i < n; i++) { x.globalAlpha = a * R(0.4, 1); x.fillStyle = cols[i % cols.length]; x.beginPath(); x.ellipse(R(0, w), R(0, h), R(r0, r1), R(r0, r1) * R(0.5, 1), R(0, 3), 0, 6.283); x.fill(); }
    x.globalAlpha = 1;
  };
  const soilTex = mk(512, 512, (x, w, h) => {
    x.fillStyle = '#7a6450'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const g = x.createRadialGradient(R(0, w), R(0, h), 0, R(0, w), R(0, h), R(40, 120)); const c = i % 2 ? '60,44,32' : '128,102,80'; g.addColorStop(0, `rgba(${c},.22)`); g.addColorStop(1, `rgba(${c},0)`); x.fillStyle = g; x.fillRect(0, 0, w, h); }
    speck(x, w, h, 14000, ['#57412f', '#7d6149', '#46342680', '#8b6e54', '#3a2b20'], 0.4, 2, 0.6);
    for (let i = 0; i < 90; i++) { const px = R(0, w), py = R(0, h), r = R(1.5, 4.5); x.fillStyle = 'rgba(30,20,12,.5)'; x.beginPath(); x.ellipse(px + 1, py + 1.2, r, r * 0.75, 0, 0, 6.283); x.fill(); x.fillStyle = ['#9d8c78', '#8a7864', '#b1a08a'][i % 3]; x.beginPath(); x.ellipse(px, py, r, r * 0.75, R(0, 3), 0, 6.283); x.fill(); }
    speck(x, w, h, 260, ['#5d7a3a', '#6f8a44'], 0.6, 1.6, 0.35);
  });
  soilTex.repeat.set(26, 26);
  const barkTex = mk(256, 512, (x, w, h) => {
    x.fillStyle = '#6d5645'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      x.strokeStyle = ['#3b2d23', '#4b3a2d', '#8a7260', '#56443a'][i % 4]; x.globalAlpha = R(0.3, 0.8); x.lineWidth = R(1, 5);
      let px = R(0, w), py = R(-40, h); x.beginPath(); x.moveTo(px, py);
      const L = R(40, 200); for (let k = 0; k < 8; k++) { px += R(-3, 3); py += L / 8; x.lineTo(px, py); } x.stroke();
    }
    x.globalAlpha = 1; speck(x, w, h, 120, ['#2f241b', '#9a8574'], 1, 3, 0.4);
  });
  barkTex.repeat.set(1, 1.5);
  const leafTex = mk(128, 256, (x) => {
    const leaf = () => { x.beginPath(); x.moveTo(64, 250); x.bezierCurveTo(4, 196, 6, 64, 64, 4); x.bezierCurveTo(122, 64, 124, 196, 64, 250); x.closePath(); };
    leaf(); const g = x.createLinearGradient(0, 256, 0, 0); g.addColorStop(0, '#b8cf98'); g.addColorStop(0.5, '#e4f0cf'); g.addColorStop(1, '#cddfae'); x.fillStyle = g; x.fill();
    x.save(); leaf(); x.clip(); const s = x.createLinearGradient(0, 0, 128, 0); s.addColorStop(0, 'rgba(40,60,20,.35)'); s.addColorStop(0.5, 'rgba(255,255,255,0)'); s.addColorStop(1, 'rgba(40,60,20,.25)'); x.fillStyle = s; x.fillRect(0, 0, 128, 256);
    x.strokeStyle = 'rgba(255,255,230,.7)'; x.lineWidth = 3; x.beginPath(); x.moveTo(64, 256); x.lineTo(64, 8); x.stroke();
    x.lineWidth = 1.4; x.strokeStyle = 'rgba(255,255,230,.45)';
    for (let i = 0; i < 9; i++) { const y = 220 - i * 22; [-1, 1].forEach(d => { x.beginPath(); x.moveTo(64, y); x.quadraticCurveTo(64 + d * 30, y - 16, 64 + d * 52, y - 34); x.stroke(); }); }
    x.restore(); leaf(); x.strokeStyle = 'rgba(40,60,20,.45)'; x.lineWidth = 2.5; x.stroke();
  });
  const petalTex = mk(64, 256, (x) => {
    const p = () => { x.beginPath(); x.moveTo(32, 256); x.bezierCurveTo(-4, 170, 2, 18, 22, 6); x.quadraticCurveTo(32, 14, 42, 6); x.bezierCurveTo(62, 18, 68, 170, 32, 256); x.closePath(); };
    p(); const g = x.createLinearGradient(0, 256, 0, 0); g.addColorStop(0, '#d9c3a8'); g.addColorStop(0.25, '#fff'); g.addColorStop(1, '#f6f2ef'); x.fillStyle = g; x.fill();
    x.save(); p(); x.clip(); x.strokeStyle = 'rgba(0,0,0,.07)'; x.lineWidth = 1; for (let i = 0; i < 7; i++) { x.beginPath(); x.moveTo(32, 256); x.quadraticCurveTo(12 + i * 7, 120, 10 + i * 7.5, 0); x.stroke(); } x.restore();
  });
  const blossomTex = mk(128, 128, (x) => {
    for (let i = 0; i < 5; i++) {
      x.save(); x.translate(64, 64); x.rotate(i * 1.2566); const g = x.createRadialGradient(0, -30, 2, 0, -26, 34); g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#fbe6ee'); g.addColorStop(1, '#f1bfd2'); x.fillStyle = g;
      x.beginPath(); x.ellipse(0, -30, 22, 30, 0, 0, 6.283); x.fill(); x.restore();
    }
    const c = x.createRadialGradient(64, 64, 0, 64, 64, 14); c.addColorStop(0, '#f7c65a'); c.addColorStop(1, 'rgba(230,120,140,.9)'); x.fillStyle = c; x.beginPath(); x.arc(64, 64, 12, 0, 6.283); x.fill();
    x.fillStyle = '#c9761e'; for (let i = 0; i < 12; i++) { const a = i * 0.52; x.beginPath(); x.arc(64 + Math.cos(a) * 15, 64 + Math.sin(a) * 15, 1.8, 0, 6.283); x.fill(); }
  });
  const centerTex = mk(64, 64, (x, w, h) => { x.fillStyle = '#e2a81f'; x.fillRect(0, 0, w, h); speck(x, w, h, 260, ['#8a5a0a', '#f5cf4a', '#b27812'], 0.6, 1.8, 0.9); });
  // The rock and moon textures aren't used, but drawing them keeps the seeded layout the same as the design's.
  mk(256, 256, (x, w, h) => { x.fillStyle = '#8f8a82'; x.fillRect(0, 0, w, h); speck(x, w, h, 5000, ['#6f6a63', '#a8a39a', '#7d776f', '#5e5a55'], 0.5, 2.5, 0.6); speck(x, w, h, 60, ['#8d9660', '#a3a06a'], 2, 7, 0.35); });
  const woodTex = mk(256, 64, (x, w, h) => { x.fillStyle = '#80583a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { x.strokeStyle = i % 2 ? 'rgba(60,36,20,.5)' : 'rgba(170,125,85,.35)'; x.lineWidth = R(0.5, 2); const y = R(0, h); x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(80, y + R(-4, 4), 170, y + R(-4, 4), 256, y + R(-3, 3)); x.stroke(); } });
  const padTex = mk(256, 256, (x) => {
    const g = x.createRadialGradient(128, 128, 10, 128, 128, 124); g.addColorStop(0, '#6f9a45'); g.addColorStop(1, '#3f6a2c'); x.fillStyle = g; x.beginPath(); x.arc(128, 128, 122, 0, 6.283); x.fill();
    x.strokeStyle = 'rgba(200,230,150,.35)'; x.lineWidth = 2; for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.cos(a) * 118, 128 + Math.sin(a) * 118); x.stroke(); }
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.moveTo(128, 128); x.lineTo(256, 110); x.lineTo(256, 146); x.closePath(); x.fill();
  });
  const glowTex = mk(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
  mk(256, 256, (x) => {
    const h = x.createRadialGradient(128, 128, 60, 128, 128, 128); h.addColorStop(0, 'rgba(255,245,220,.35)'); h.addColorStop(1, 'rgba(255,245,220,0)'); x.fillStyle = h; x.fillRect(0, 0, 256, 256);
    const g = x.createRadialGradient(110, 110, 10, 128, 128, 62); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#e8dfca'); x.fillStyle = g; x.beginPath(); x.arc(128, 128, 60, 0, 6.283); x.fill();
    x.save(); x.beginPath(); x.arc(128, 128, 60, 0, 6.283); x.clip(); speck(x, 256, 256, 26, ['rgba(160,150,130,.5)', 'rgba(190,180,160,.5)'], 4, 14, 0.6); x.restore();
  });

  // ---------- scene, sky, light ----------
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.03, 400);
  const sunDir = new THREE.Vector3(0.55, 0.72, -0.42).normalize();
  const C = h => new THREE.Color(h);
  const skyCol = { top: C(0x1d63d0), mid: C(0x8fc2ef), bot: C(0x9fb893), nTop: C(0x0c1230), nMid: C(0x47406a), grey: C(0x9a9ca2) };
  const skyU = { top: { value: skyCol.top.clone() }, mid: { value: skyCol.mid.clone() }, bot: { value: skyCol.bot.clone() }, sunDir: { value: sunDir }, wilt: { value: 0 }, night: { value: 0 } };
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 top, mid, bot, sunDir; uniform float wilt, night; varying vec3 vP;
      void main(){ vec3 d = normalize(vP); float h = d.y;
        vec3 c = mix(mid, top, smoothstep(-0.01, 0.12, h)); c = mix(bot, c, smoothstep(-0.2, 0.02, h));
        float s = max(dot(d, sunDir), 0.); float sk = (1. - night) * (1. - wilt * .8);
        c += vec3(1., .93, .8) * pow(s, 8.) * .25 * sk + vec3(1., .97, .9) * pow(s, 600.) * 2. * sk;
        float st = step(.9985, fract(sin(dot(floor(d * 380.), vec3(12.9898, 78.233, 37.719))) * 43758.5453)) * smoothstep(.1, .5, h) * night;
        c += vec3(st);
        float g = dot(c, vec3(.3, .59, .11)); c = mix(c, vec3(g) * vec3(.9, .92, .96), wilt * .8);
        gl_FragColor = vec4(c, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 16), skyMat);
  scene.add(sky);
  {
    const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), skyMat));
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(envScene, 0.04).texture; pm.dispose();
  }
  scene.fog = new THREE.FogExp2(C(0xc4dcec), 0.016);
  const sun = new THREE.DirectionalLight(0xfff2de, 3.2);
  sun.position.copy(sunDir).multiplyScalar(20); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 45 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  const hemi = new THREE.HemisphereLight(0xcfe2ff, 0x6f7a48, 1.0);
  const glow = new THREE.PointLight(0xffc36e, 0, 6, 1.6);
  scene.add(sun, sun.target, hemi, glow);
  const sunC = C(0xfff2de), sunGrey = C(0xc4c6cc);

  // ---------- ground ----------
  const pond = new THREE.Vector2(2.3, 1.7);
  const gh = (x, z) => {
    let h = 0.05 * Math.sin(x * 0.8 + 0.5) * Math.cos(z * 0.7) + 0.03 * Math.sin(x * 1.9 - z * 1.4) + 0.07 * Math.exp(-(x * x + z * z) / 3);
    const dp = (x - pond.x) ** 2 + (z - pond.y) ** 2; return h * (1 - Math.exp(-dp / 1.6)) - 0.03 * Math.exp(-dp / 1.2);
  };
  const groundMat = new THREE.MeshStandardMaterial({ map: soilTex, bumpMap: soilTex, bumpScale: 1.4, roughness: 1, envMapIntensity: 0.5 });
  const gU = { uR: { value: 1 }, uPond: { value: 0 } };
  groundMat.onBeforeCompile = (sh) => {
    sh.uniforms.uR = gU.uR; sh.uniforms.uPond = gU.uPond;
    sh.vertexShader = 'varying vec2 vW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(position,1.)).xz;');
    sh.fragmentShader = 'uniform float uR, uPond;\nvarying vec2 vW;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      float dd = length(vW); float mm = smoothstep(uR, uR + 2.5, dd);
      float pz = (1. - smoothstep(0.9, 1.3, length(vW - vec2(2.3, 1.7)))) * (1. - uPond) * smoothstep(uR - 0.5, uR + 0.5, 3.2);
      vec3 meadow = vec3(0.30, 0.46, 0.14) * (0.85 + 0.3 * diffuseColor.r);
      diffuseColor.rgb = mix(diffuseColor.rgb, meadow, max(max(mm, 0.35), pz * 0.9));`);
  };
  {
    const g = new THREE.PlaneGeometry(70, 70, 160, 160); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, gh(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, groundMat); m.receiveShadow = true; m.userData.ground = true; scene.add(m);
  }
  const soilC = C(0xffffff);

  // ---------- helpers ----------
  const dummy = new THREE.Object3D(), Y = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), q2 = new THREE.Quaternion();
  const xf = (geo, p, rot, s, c) => {
    const g = geo.clone();
    dummy.position.set(p[0], p[1], p[2]);
    if (rot.isQuaternion) dummy.quaternion.copy(rot); else dummy.rotation.set(rot[0], rot[1], rot[2], rot[3] || 'XYZ');
    dummy.scale.set(s[0], s[1], s[2]); dummy.updateMatrix(); g.applyMatrix4(dummy.matrix);
    const n = g.attributes.position.count, a = new Float32Array(n * 3), cc = c || { r: 1, g: 1, b: 1 };
    for (let i = 0; i < n; i++) { a[i * 3] = cc.r; a[i * 3 + 1] = cc.g; a[i * 3 + 2] = cc.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
  };
  const merge = (geos) => {
    let nv = 0, ni = 0; geos.forEach(g => { nv += g.attributes.position.count; ni += g.index.count; });
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), col = new Float32Array(nv * 3), idx = new Uint32Array(ni);
    let vo = 0, io = 0;
    geos.forEach(g => {
      const c = g.attributes.position.count;
      pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3); uv.set(g.attributes.uv.array, vo * 2); col.set(g.attributes.color.array, vo * 3);
      const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx[io + i] = ia[i] + vo;
      vo += c; io += ia.length;
    });
    const m = new THREE.BufferGeometry();
    m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    m.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); m.setAttribute('color', new THREE.BufferAttribute(col, 3));
    m.setIndex(new THREE.BufferAttribute(idx, 1)); return m;
  };
  const hsl = (h, s, l) => new THREE.Color().setHSL(h, s, l);

  const leafBase = new THREE.PlaneGeometry(1, 1, 1, 4); leafBase.translate(0, 0.5, 0);
  { const p = leafBase.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i); p.setZ(i, -0.22 * y * y + 0.12 * Math.abs(x)); } leafBase.computeVertexNormals(); }
  const petalBase = new THREE.PlaneGeometry(1, 1, 1, 3); petalBase.translate(0, 0.5, 0);
  { const p = petalBase.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i); p.setZ(i, 0.12 * y * y - 0.25 * x * x); } petalBase.computeVertexNormals(); }
  const quadBase = new THREE.PlaneGeometry(1, 1);

  const leafMat = new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: 0.45, side: THREE.DoubleSide, vertexColors: true, roughness: 0.62, envMapIntensity: 0.7 });
  const alphaDepth = (map) => new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.45 });
  const leafDepth = alphaDepth(leafTex);
  const blossomMat = new THREE.MeshStandardMaterial({ map: blossomTex, alphaTest: 0.4, side: THREE.DoubleSide, vertexColors: true, roughness: 0.6, emissive: 0x2a1018, emissiveIntensity: 0.4 });
  const blossomDepth = alphaDepth(blossomTex);
  const petalMat = new THREE.MeshStandardMaterial({ map: petalTex, alphaTest: 0.4, side: THREE.DoubleSide, vertexColors: true, roughness: 0.55 });
  const petalDepth = alphaDepth(petalTex);
  const barkMat = new THREE.MeshStandardMaterial({ map: barkTex, bumpMap: barkTex, bumpScale: 2.5, roughness: 0.95, envMapIntensity: 0.5 });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x55803a, roughness: 0.7 });
  const centerMat = new THREE.MeshStandardMaterial({ map: centerTex, bumpMap: centerTex, bumpScale: 2, roughness: 0.8 });
  const tintMats = [
    { m: leafMat, a: C(0xffffff), b: C(0xd49a4e) }, { m: blossomMat, a: C(0xffffff), b: C(0xa8927e) },
    { m: petalMat, a: C(0xffffff), b: C(0xa38a6c) }, { m: stemMat, a: C(0x55803a), b: C(0x7d6a3e) },
  ];

  // ---------- items ----------
  const items = [];
  const add = (obj, t, kind, o = {}) => {
    obj.userData.day = t; obj.userData.kind = kind;
    const full = o.full ?? obj.scale.x; obj.userData.full = full;
    obj.scale.setScalar(1e-4); obj.visible = false;
    (o.parent || scene).add(obj);
    items.push({ obj, t, until: o.until ?? 1e9, kind, cur: 0, v: 0, on: false, at: 0, lag: o.lag ?? R(0, 0.6), full, sprite: !!obj.isSprite });
    return obj;
  };

  // ---------- trees ----------
  const nodes = [], clusters = [], sways = [];
  function leafCluster(len, n, size, colFn, depthOnly) {
    const gs = [];
    for (let k = 0; k < n; k++) {
      const y = len * R(0.2, 1.02), a = R(0, 6.283), p = R(0.5, 1.45);
      const d = new THREE.Vector3(Math.cos(a) * Math.sin(p), Math.cos(p) - 0.35, Math.sin(a) * Math.sin(p)).normalize();
      q.setFromUnitVectors(Y, d); q2.setFromAxisAngle(d, R(0, 6.283)); q.premultiply(q2);
      const s = size * R(0.7, 1.2);
      gs.push(xf(leafBase, [Math.cos(a) * 0.02, y, Math.sin(a) * 0.02], q, [s * 0.5, s, s], colFn()));
    }
    return merge(gs);
  }
  function makeTree(root, o) {
    function br(parent, d, len, rad, birth) {
      const dur = o.dur[d];
      const g = new THREE.Group(); parent.add(g);
      const geo = new THREE.CylinderGeometry(rad * (d === 0 ? 0.5 : 0.6), rad, len, d < 2 ? 12 : 7, 4, d < o.maxD); geo.translate(0, len / 2, 0);
      { const p = geo.attributes.position, bx = R(-0.06, 0.06) * len, bz = R(-0.06, 0.06) * len; for (let i = 0; i < p.count; i++) { const t = p.getY(i) / len; p.setX(i, p.getX(i) + bx * Math.sin(t * 3.14)); p.setZ(i, p.getZ(i) + bz * Math.sin(t * 3.14)); } geo.computeVertexNormals(); }
      const m = new THREE.Mesh(geo, barkMat); m.castShadow = m.receiveShadow = true;
      m.userData.day = Math.max(o.base, Math.round(birth)); m.userData.kind = o.kind || 'branch'; g.add(m);
      if (d === 0) { const flare = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 1.8, len * 0.08, 12, 1, true).translate(0, len * 0.04, 0), barkMat); flare.castShadow = true; flare.userData = m.userData; g.add(flare); }
      g.scale.setScalar(1e-4);
      nodes.push({ g, birth, dur, d, root: o.root, len });
      if (d > 0 && d < 3) sways.push({ g, ph: R(0, 6), a: 0.015 * d });
      if (d < o.maxD) {
        const kids = d === 0 ? o.k0 : d === 1 ? 4 : 3;
        for (let i = 0; i < kids; i++) {
          const f = d === 0 ? R(0.55, 0.92) : R(0.35, 0.92);
          const cg = new THREE.Group(); cg.position.y = len * f; cg.rotation.y = i * 2.39996 + R(-0.4, 0.4);
          const tg = new THREE.Group(); tg.rotation.z = R(0.5, 0.95); cg.add(tg); g.add(cg);
          br(tg, d + 1, len * R(0.52, 0.7), rad * R(0.45, 0.58), Math.max(birth + dur * f * 0.6 + R(0, 1.2), o.base + o.minB[d + 1] + R(0, o.spread[d + 1])));
        }
        const lg = new THREE.Group(); lg.position.y = len * 0.97; lg.rotation.set(R(-0.18, 0.18), 0, R(-0.18, 0.18)); g.add(lg);
        br(lg, d + 1, len * R(0.62, 0.75), rad * (d === 0 ? 0.5 : 0.6), Math.max(birth + dur * (d === 0 ? 0.45 : 0.7), o.base + o.minB[d + 1]));
      }
      if (d >= 1 && o.leaves) {
        const n = d === o.maxD ? o.nLeaf : Math.round(o.nLeaf * (d === 1 ? 0.35 : 0.6));
        const lm = new THREE.Mesh(leafCluster(len, n, o.leafSize, o.leafCol), o.mat);
        lm.castShadow = true; lm.receiveShadow = true; lm.customDepthMaterial = o.depth;
        lm.userData.day = Math.max(o.base, Math.round(birth + 1)); lm.userData.kind = o.leafKind;
        g.add(lm); lm.scale.setScalar(1e-4);
        clusters.push({ m: lm, birth: birth + dur * 0.35, dur: 2.5, ph: R(0, 6), root: o.root });
        if (o.blossom && d >= o.maxD - 1) {
          const bm = new THREE.Mesh(leafCluster(len, Math.round(n * 0.4), o.leafSize * 0.75, () => hsl(0.95, 0.35, R(0.82, 0.95))), blossomMat);
          bm.castShadow = true; bm.customDepthMaterial = blossomDepth; bm.userData.day = o.blossom[0]; bm.userData.kind = 'blossom';
          g.add(bm); bm.scale.setScalar(1e-4);
          clusters.push({ m: bm, birth: o.blossom[0] + R(0, o.blossom[1]), dur: 2, ph: R(0, 6), root: o.root, bl: true });
        }
      }
      return g;
    }
    return br(root, 0, o.len, o.rad, o.base + o.b0);
  }

  const mainRoot = new THREE.Group(); mainRoot.position.set(0, gh(0, 0) - 0.01, 0); scene.add(mainRoot);
  const trunk = makeTree(mainRoot, {
    root: 0, base: 0, b0: -1, len: 1.55, rad: 0.13, maxD: 3, k0: 4, dur: [12, 5, 4, 4], minB: [0, 3.5, 6.5, 9], spread: [0, 3, 3.5, 4],
    leaves: true, nLeaf: 26, leafSize: 0.2, mat: leafMat, depth: leafDepth, leafKind: 'leaves',
    leafCol: () => hsl(R(0.22, 0.29), R(0.45, 0.62), R(0.3, 0.44)), blossom: [15, 5],
  });

  // seedling leaves on trunk tip
  const seedG = new THREE.Group(); seedG.position.y = 1.55; trunk.add(seedG);
  const seedLeaves = [];
  const seedMat = leafMat;
  [[0, 0.25, 0.8, 0.28, -0.4], [Math.PI, 0.25, 0.8, 0.28, -0.35], [1.6, 0.9, 1.1, 0.95, 1], [4.7, 0.9, 1.15, 1.0, 2], [0.8, 1.3, 1.3, 0.95, 3], [3.9, 1.3, 1.35, 1.05, 4]].forEach(([a, p, s, round, t]) => {
    const d = new THREE.Vector3(Math.cos(a) * Math.sin(p + 0.6), Math.cos(p + 0.6), Math.sin(a) * Math.sin(p + 0.6)).normalize();
    q.setFromUnitVectors(Y, d);
    const m = new THREE.Mesh(xf(leafBase, [0, 0, 0], q, [s * (t < 0 ? 0.75 : 0.5), s * (t < 0 ? 0.6 : 1), s], hsl(0.25, 0.55, t < 0 ? 0.5 : 0.38)), seedMat);
    m.castShadow = true; m.customDepthMaterial = leafDepth; m.userData.day = Math.max(0, t); m.userData.kind = 'seedling';
    m.scale.setScalar(1e-4); seedG.add(m); seedLeaves.push({ m, t, ph: R(0, 6) });
  });

  // ---------- grass ----------
  const MAXG = 34000;
  const bladeGeo = (() => {
    const pos = [], nor = [], uv = [], idx = [], S = 5;
    for (let i = 0; i <= S; i++) {
      const y = i / S, w = 0.5 * Math.pow(1 - y, 0.8), z = 0.28 * y * y;
      if (i < S) { pos.push(-w, y, z, w, y, z); nor.push(0, 1, 0, 0, 1, 0); uv.push(0, y, 1, y); }
      else { pos.push(0, y, z); nor.push(0, 1, 0); uv.push(0.5, 1); }
    }
    for (let i = 0; i < S - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const a = (S - 1) * 2; idx.push(a, a + 1, a + 2);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
  })();
  const grassU = { uTime: { value: 0 }, uWilt: { value: 0 } };
  const grassMat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.75, envMapIntensity: 0.6 });
  grassMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, grassU);
    sh.vertexShader = 'uniform float uTime;\nvarying float vH;\n' + sh.vertexShader.replace('#include <project_vertex>', `
      vec4 mvPosition = vec4( transformed, 1.0 );
      #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
        vec4 ip = instanceMatrix[3];
      #else
        vec4 ip = vec4(0.);
      #endif
      float hh = position.y; vH = hh;
      float wv = sin(uTime * 1.5 + ip.x * 0.7 + ip.z * 0.5) * 0.6 + sin(uTime * 2.9 + ip.x * 2.1 - ip.z * 1.7) * 0.25;
      mvPosition.x += wv * hh * hh * 0.07; mvPosition.z += wv * hh * hh * 0.04;
      mvPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * mvPosition;`);
    sh.fragmentShader = 'uniform float uWilt;\nvarying float vH;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      diffuseColor.rgb *= mix(0.4, 1.2, vH);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.6, 0.5, 0.28) * mix(0.4, 1.0, vH), uWilt * 0.8);`);
  };
  const grass = new THREE.InstancedMesh(bladeGeo, grassMat, MAXG);
  grass.receiveShadow = true; grass.raycast = () => {}; grass.frustumCulled = false;
  {
    const arr = [];
    for (let n = 0; arr.length < MAXG && n < MAXG * 3; n++) {
      const r = 0.12 + Math.sqrt(rnd()) * 8, a = R(0, 6.283), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (Math.hypot(x - pond.x, z - pond.y) < 1.15) continue;
      arr.push({ x, z, key: r * (1 + R(-0.15, 0.15)) + 0.3 * Math.sin(a * 3) });
    }
    arr.sort((a, b) => a.key - b.key);
    const col = new THREE.Color();
    arr.forEach((b, i) => {
      const hgt = R(0.1, 0.26) * (b.key < 1 ? 0.8 : 1);
      dummy.position.set(b.x, gh(b.x, b.z) - 0.01, b.z); dummy.rotation.set(R(-0.15, 0.15), R(0, 6.283), R(-0.15, 0.15));
      dummy.scale.set(R(0.03, 0.05), hgt, hgt); dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
      col.setHSL(R(0.22, 0.3), R(0.5, 0.72), R(0.36, 0.52)); grass.setColorAt(i, col);
    });
    grass.count = 0; scene.add(grass);
  }

  // ---------- ground life ----------
  const used = [new THREE.Vector2(0, 0), pond.clone(), new THREE.Vector2(-2.6, -1.6), new THREE.Vector2(-2.1, 2.3), new THREE.Vector2(-1.3, 1.5)];
  const usedR = [0.9, 1.5, 1.0, 1.0, 0.8];
  const spot = (r0, r1, clear = 0.55) => {
    for (let n = 0; n < 400; n++) {
      const a = R(0, 6.283), r = R(r0, r1), p = new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r);
      if (used.every((u, i) => u.distanceTo(p) > Math.max(usedR[i] ?? clear, clear))) { used.push(p); usedR.push(clear); return p; }
    }
    return new THREE.Vector2(R(-4, 4), R(-4, 4));
  };

  const heads = [];
  function flower(type, col) {
    const big = type === 'sunflower' || type === 'rose' || type === 'peony';
    const g = new THREE.Group(), h = type === 'sunflower' ? R(0.75, 1.05) : type === 'lavender' ? R(0.32, 0.46) : type === 'tulip' ? R(0.26, 0.36) : big ? R(0.35, 0.55) : R(0.3, 0.52);
    const tip = new THREE.Vector3(R(-0.05, 0.05), h, R(-0.05, 0.05));
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(R(-0.03, 0.03), h * 0.5, R(-0.03, 0.03)), tip]);
    const st = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, type === 'sunflower' ? 0.016 : type === 'tulip' || big ? 0.009 : 0.006, 5), stemMat); st.castShadow = true; g.add(st);
    const lv = [];
    for (let k = 0; k < (type === 'tulip' ? 2 : 2); k++) { const a = R(0, 6.28); q.setFromUnitVectors(Y, new THREE.Vector3(Math.cos(a) * 0.7, 0.7, Math.sin(a) * 0.7).normalize()); lv.push(xf(leafBase, [0, h * R(0.1, 0.45), 0], q, type === 'sunflower' ? [0.09, 0.2, 0.2] : type === 'tulip' ? [0.05, 0.2, 0.2] : big ? [0.05, 0.11, 0.11] : [0.035, 0.09, 0.09], hsl(0.26, 0.5, 0.34))); }
    const lm = new THREE.Mesh(merge(lv), leafMat); lm.castShadow = true; lm.customDepthMaterial = leafDepth; g.add(lm);
    const head = new THREE.Group(); head.position.copy(tip); head.userData.bx = R(-0.35, 0.15); head.rotation.set(head.userData.bx, R(0, 6.28), R(-0.2, 0.2));
    const ps = [];
    if (type === 'lavender') {
      const buds = [];
      for (let k = 0; k < 22; k++) { const y = -k * 0.007, a = k * 2.4; buds.push(xf(new THREE.SphereGeometry(1, 6, 4), [Math.cos(a) * 0.009, y, Math.sin(a) * 0.009], [0, 0, 0], [0.008, 0.013, 0.008], hsl(0.75, R(0.35, 0.5), R(0.45, 0.6)))); }
      const bm = new THREE.Mesh(merge(buds), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 })); bm.castShadow = true; head.add(bm);
      tintMats.push({ m: bm.material, a: C(0xffffff), b: C(0x9a8a70) });
    } else if (type === 'sunflower') {
      for (let r2 = 0; r2 < 2; r2++) for (let k = 0; k < 18; k++) ps.push(xf(petalBase, [0, 0, 0], [Math.PI / 2 - 0.08 - r2 * 0.2, k / 18 * 6.283 + r2 * 0.17, 0, 'YXZ'], [0.034, 0.13, 0.13], hsl(0.12 + R(-0.012, 0.012), 0.92, 0.56 + R(-0.05, 0.05) - r2 * 0.07)));
      const pm = new THREE.Mesh(merge(ps), petalMat); pm.castShadow = true; pm.customDepthMaterial = petalDepth; head.add(pm);
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.08, 24, 12), sunCenterMat); c.scale.y = 0.32; head.add(c);
      head.userData.bx = R(0.75, 1.05); head.rotation.x = head.userData.bx;
    } else if (type === 'rose' || type === 'peony') {
      const rings = type === 'rose' ? [[5, 0.2, 0.045], [5, 0.5, 0.06], [6, 0.85, 0.072], [7, 1.2, 0.08]] : [[6, 0.25, 0.055], [8, 0.6, 0.072], [9, 0.95, 0.088], [11, 1.3, 0.1]];
      rings.forEach(([n, th, l], ri) => { for (let k = 0; k < n; k++) ps.push(xf(petalBase, [0, 0, 0], [th + R(-0.08, 0.08), k / n * 6.283 + ri * 0.6, 0, 'YXZ'], [l * 1.05, l, l], col.clone().offsetHSL(R(-0.01, 0.01), 0, ri * 0.035 + R(-0.03, 0.03)))); });
      const pm = new THREE.Mesh(merge(ps), petalMat); pm.castShadow = true; pm.customDepthMaterial = petalDepth; head.add(pm);
      head.userData.bx = R(-0.3, 0.3); head.rotation.x = head.userData.bx;
    } else {
      const n = type === 'daisy' ? 16 : type === 'tulip' ? 6 : 8;
      for (let k = 0; k < n; k++) {
        const tulip = type === 'tulip';
        const th = tulip ? 0.3 : Math.PI / 2 - R(0.05, 0.3);
        const w = type === 'daisy' ? 0.016 : tulip ? 0.06 : 0.042, l = type === 'daisy' ? 0.06 : tulip ? 0.085 : 0.075;
        ps.push(xf(petalBase, [0, tulip ? -0.01 : 0, 0], [th, k / n * 6.283 + (tulip && k % 2 ? 0.5 : 0), 0, 'YXZ'], [w, l, l], col.clone().offsetHSL(R(-0.01, 0.01), 0, R(-0.05, 0.05))));
      }
      const pm = new THREE.Mesh(merge(ps), petalMat); pm.castShadow = true; pm.customDepthMaterial = petalDepth; head.add(pm);
      if (type !== 'tulip') { const c = new THREE.Mesh(new THREE.SphereGeometry(type === 'daisy' ? 0.016 : 0.02, 12, 8), centerMat); c.scale.y = 0.55; head.add(c); }
    }
    heads.push(head); g.add(head); return g;
  }
  const sunCenterMat = new THREE.MeshStandardMaterial({ color: 0x5a3514, bumpMap: centerTex, bumpScale: 3, roughness: 0.95 });
  const bed = (types, cols, t, n, sc = 1.25) => {
    const p = spot(1.1, 5.6, 0.5 * sc), g = new THREE.Group(); g.position.set(p.x, gh(p.x, p.y) - 0.01, p.y);
    for (let k = 0; k < n; k++) { const f = flower(types[k % types.length], cols[k % cols.length]); const a = k / n * 6.283 + R(-0.3, 0.3), rr = R(0.05, 0.24) * sc; f.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); f.scale.setScalar(R(0.85, 1.15) * sc); g.add(f); }
    add(g, t, 'flower', { full: 1 });
  };
  const PINK = hsl(0.93, 0.55, 0.7), WHITE = hsl(0.1, 0.2, 0.95), MAG = hsl(0.9, 0.55, 0.5), RED = hsl(0.99, 0.7, 0.5), YEL = hsl(0.13, 0.8, 0.6), PEACH = hsl(0.05, 0.7, 0.72), LIL = hsl(0.74, 0.35, 0.72);
  [[7, ['cosmos'], [PINK, WHITE]], [8, ['daisy'], [WHITE]], [9, ['tulip'], [RED]], [11, ['lavender'], [LIL]], [12, ['cosmos'], [MAG, PINK]], [13, ['tulip'], [YEL]],
   [16, ['daisy'], [WHITE]], [18, ['cosmos'], [WHITE, PEACH]], [19, ['lavender'], [LIL]], [23, ['tulip'], [PEACH, PINK]], [27, ['cosmos'], [PINK, MAG]], [29, ['daisy'], [WHITE]],
   [33, ['tulip'], [RED, YEL]], [37, ['lavender'], [LIL]], [42, ['cosmos'], [PEACH]], [47, ['daisy'], [WHITE]], [52, ['tulip'], [PINK]], [57, ['cosmos'], [WHITE, PINK]]]
    .forEach(([t, ty, cs]) => bed(ty, cs, t, ty[0] === 'lavender' ? 7 : 6));
  [[10, ['rose'], [RED, PINK], 5, 1.6], [14, ['sunflower'], [YEL], 4, 1.4], [15, ['peony'], [PINK, WHITE], 5, 1.6], [20, ['rose'], [PEACH, WHITE], 5, 1.6], [21, ['sunflower'], [YEL], 4, 1.4],
   [26, ['peony'], [MAG, PINK], 5, 1.6], [34, ['rose'], [WHITE, PINK], 5, 1.6], [36, ['sunflower'], [YEL], 5, 1.4], [39, ['peony'], [PINK, PEACH], 5, 1.6], [44, ['rose'], [RED, MAG], 5, 1.6],
   [49, ['sunflower'], [YEL], 4, 1.4], [54, ['peony'], [WHITE, PINK], 5, 1.6], [59, ['rose'], [PINK, MAG], 6, 1.6]]
    .forEach(([t, ty, cs, n, sc]) => bed(ty, cs, t, n, sc));

  const shrubInner = new THREE.MeshStandardMaterial({ color: 0x2c4420, roughness: 1 });
  [[17, 0.26, null], [22, 0.3, null], [31, 0.36, [0.6, 0.45, 0.72]], [38, 0.34, [0.95, 0.5, 0.8]], [43, 0.32, null]].forEach(([t, r, bloom]) => {
    const p = spot(1.8, 5, 0.8), g = new THREE.Group(); g.position.set(p.x, gh(p.x, p.y) - 0.02, p.y);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(r * 0.85, 16, 12), shrubInner); inner.scale.y = 0.75; inner.position.y = r * 0.6; inner.castShadow = true; g.add(inner);
    const ls = [], bs = [];
    for (let k = 0; k < 320; k++) {
      const d = new THREE.Vector3(R(-1, 1), R(-0.15, 1), R(-1, 1)).normalize();
      const pos = [d.x * r * R(0.85, 1.05), r * 0.6 + d.y * r * 0.8 * R(0.85, 1.05), d.z * r * R(0.85, 1.05)];
      q.setFromUnitVectors(Y, d.clone().add(new THREE.Vector3(R(-0.4, 0.4), 0.2, R(-0.4, 0.4))).normalize());
      ls.push(xf(leafBase, pos, q, [0.05, 0.1, 0.1], hsl(R(0.23, 0.3), R(0.4, 0.6), R(0.24, 0.36))));
      if (bloom && k % 26 === 0) for (let j = 0; j < 14; j++) { const e = new THREE.Vector3(R(-1, 1), R(-1, 1), R(-1, 1)).normalize(); q.setFromUnitVectors(Y, e); bs.push(xf(quadBase, [pos[0] * 1.08 + e.x * 0.06, pos[1] * 1.04 + e.y * 0.05, pos[2] * 1.08 + e.z * 0.06], q, [0.05, 0.05, 0.05], hsl(bloom[0] + R(-0.03, 0.03), bloom[1], bloom[2] + R(-0.06, 0.06)))); }
    }
    const lm = new THREE.Mesh(merge(ls), leafMat); lm.castShadow = lm.receiveShadow = true; lm.customDepthMaterial = leafDepth; g.add(lm);
    if (bs.length) { const bm = new THREE.Mesh(merge(bs), blossomMat); bm.castShadow = true; g.add(bm); }
    add(g, t, 'bush', { full: 1 });
  });

  const mushCap = new THREE.MeshStandardMaterial({ color: 0xa8683c, roughness: 0.5, emissive: 0x5a2a10, emissiveIntensity: 0.15 });
  const mushStem = new THREE.MeshStandardMaterial({ color: 0xe8dcc6, roughness: 0.8 });
  [20, 24, 28, 36, 44, 53].forEach(t => {
    const p = spot(1, 4.5, 0.45), g = new THREE.Group(); g.position.set(p.x, gh(p.x, p.y) - 0.005, p.y);
    const n = 3 + Math.floor(R(0, 3));
    for (let k = 0; k < n; k++) {
      const s = R(0.5, 1.1), m = new THREE.Group();
      const stH = 0.09 * s, cap = new THREE.Mesh(new THREE.SphereGeometry(0.05 * s, 16, 8, 0, 6.283, 0, 1.4), mushCap);
      cap.scale.y = 0.7; cap.position.y = stH; cap.castShadow = true;
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.009 * s, 0.013 * s, stH, 8).translate(0, stH / 2, 0), mushStem); st.castShadow = true;
      m.add(st, cap); m.position.set(R(-0.1, 0.1), 0, R(-0.1, 0.1)); m.rotation.set(R(-0.2, 0.2), 0, R(-0.2, 0.2)); g.add(m);
    }
    add(g, t, 'mushroom', { full: 1 });
  });

  // pond
  {
    const g = new THREE.Group(); g.position.set(pond.x, gh(pond.x, pond.y) + 0.012, pond.y);
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.0, 48).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x14323a, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.3 }));
    water.receiveShadow = true; g.add(water);
    const edge = new THREE.Mesh(new THREE.RingGeometry(0.98, 1.12, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3a2c22, roughness: 1 })); edge.position.y = -0.004; g.add(edge);
    for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283 + R(-0.1, 0.1); const f = flower(i % 3 ? 'daisy' : 'cosmos', i % 3 ? WHITE : PINK); f.position.set(Math.cos(a) * 1.12, 0, Math.sin(a) * 1.12); f.scale.setScalar(R(0.9, 1.2)); g.add(f); }
    add(g, 25, 'pond', { lag: 0, full: 1 });
    const padMat = new THREE.MeshStandardMaterial({ map: padTex, alphaTest: 0.5, roughness: 0.4, side: THREE.DoubleSide });
    [[0.35, 0.25, 0.16], [-0.4, -0.1, 0.13], [0.05, -0.5, 0.14], [-0.1, 0.45, 0.11]].forEach(([x, z, s], i) => {
      const p = new THREE.Group(); p.position.set(pond.x + x, gh(pond.x, pond.y) + 0.016, pond.y + z);
      const pad = new THREE.Mesh(new THREE.CircleGeometry(s, 24).rotateX(-Math.PI / 2), padMat); pad.rotation.y = R(0, 6); pad.receiveShadow = true; p.add(pad);
      if (i === 0) { const f = flower('cosmos', hsl(0.95, 0.45, 0.85)); f.children[0].visible = false; f.children[1].visible = false; f.children[2].position.set(0, 0.01, 0); f.children[2].rotation.set(0, 0, 0); f.scale.setScalar(1.3); p.add(f); }
      add(p, 32, 'lily', { full: 1 });
    });
  }

  // cherry trees
  [[-2.6, -1.6, 30, 0.95], [-2.1, 2.3, 48, 0.8]].forEach(([x, z, t, sc], i) => {
    const r = new THREE.Group(); r.position.set(x, gh(x, z) - 0.01, z); r.scale.setScalar(sc); r.rotation.y = R(0, 6); scene.add(r);
    makeTree(r, {
      root: i + 1, base: t, b0: -0.5, len: 1.2, rad: 0.09, maxD: 3, k0: 3, dur: [6, 3, 3, 3], minB: [0, 1.5, 2.5, 3.5], spread: [0, 1, 1, 1],
      leaves: true, nLeaf: 20, leafSize: 0.13, mat: blossomMat, depth: blossomDepth, leafKind: 'tree', kind: 'tree',
      leafCol: () => i ? hsl(R(0.72, 0.78), R(0.3, 0.45), R(0.8, 0.9)) : hsl(R(0.93, 0.98), R(0.4, 0.6), R(0.78, 0.9)),
    });
  });

  // path + bench
  {
    const wm = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.8 }), im = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.7 });
    const b = new THREE.Group(); b.position.set(-1.3, gh(-1.3, 1.5), 1.5); b.rotation.y = 0.9;
    for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.022, 0.06), wm); s.position.set(0, 0.26, -0.1 + k * 0.07); s.castShadow = s.receiveShadow = true; b.add(s); }
    for (let k = 0; k < 2; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.02), wm); s.position.set(0, 0.36 + k * 0.08, -0.15); s.rotation.x = -0.15; s.castShadow = true; b.add(s); }
    [-0.4, 0.4].forEach(x => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.26, 0.3), im); l.position.set(x, 0.13, -0.02); l.castShadow = true; b.add(l); const bk = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.03), im); bk.position.set(x, 0.38, -0.16); b.add(bk); });
    add(b, 50, 'bench', { full: 1 });
  }

  // fireflies, orbs, moon, motes
  const ffs = [], wingGeo = new THREE.CircleGeometry(0.04, 14); wingGeo.scale(1, 0.8, 1); wingGeo.translate(0.038, 0.01, 0);
  const wingCols = [0xf2963a, 0x5f9dff, 0xfff4dc, 0xffd23f, 0xe58ac0];
  for (let i = 0; i < 26; i++) {
    const b = new THREE.Group(), wm = new THREE.MeshStandardMaterial({ color: wingCols[i % 5], side: THREE.DoubleSide, roughness: 0.6, emissive: wingCols[i % 5], emissiveIntensity: 0.12 });
    const L = new THREE.Mesh(wingGeo, wm), Rw = new THREE.Mesh(wingGeo, wm); Rw.scale.x = -1; L.castShadow = Rw.castShadow = true;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.05, 5), new THREE.MeshStandardMaterial({ color: 0x2a2018 })); body.rotation.x = Math.PI / 2;
    const inner = new THREE.Group(); inner.rotation.x = -Math.PI / 2 + 0.3; inner.add(L, Rw, body); b.add(inner);
    const a = R(0, 6.28), r = R(0.6, 4.2); b.userData = { b: new THREE.Vector3(Math.cos(a) * r, R(0.35, 1.8), Math.sin(a) * r), ph: R(0, 6.28), L, Rw, sp: R(0.25, 0.5) };
    b.position.copy(b.userData.b); ffs.push(b); add(b, 21 + Math.floor(i * 1.4), 'butterfly', { full: 1 });
  }
  const orbs = [];

  const motes = [];
  for (let i = 0; i < 50; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: blossomTex, color: 0xffd6e6, depthWrite: false, transparent: true, opacity: 0, fog: false }));
    s.scale.setScalar(0.07); s.userData.a = R(0, 6.28); s.userData.r = R(0.3, 4); s.userData.off = R(0, 1); s.visible = false; scene.add(s); motes.push(s);
  }

  // particles
  const parts = [];
  const sparkMat = () => new THREE.SpriteMaterial({ map: glowTex, color: 0xe2eb98, depthWrite: false, transparent: true, opacity: 0, fog: false });
  const fallMat = new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: 0.45, side: THREE.DoubleSide, color: 0xc28a45, roughness: 0.7 });
  for (let i = 0; i < 50; i++) { const s = new THREE.Sprite(sparkMat()); s.visible = false; scene.add(s); parts.push({ o: s, life: 0, max: 1, v: new THREE.Vector3(), sp: true }); }
  const fallGeo = leafBase.clone().scale(0.06, 0.12, 0.12);
  for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(fallGeo, fallMat); m.visible = false; m.castShadow = true; scene.add(m); parts.push({ o: m, life: 0, max: 1, v: new THREE.Vector3(), sp: false, ph: R(0, 6) }); }

  // resolve canopy anchor points for orbs (grow tree fully once)
  nodes.forEach(n => n.g.scale.setScalar(1)); scene.updateMatrixWorld(true);
  const canopyPts = nodes.filter(n => n.root === 0 && n.d === 2).map(n => new THREE.Vector3().setFromMatrixPosition(n.g.matrixWorld));
  nodes.forEach(n => n.g.scale.setScalar(1e-4));
  [26, 33, 41].forEach((t, i) => {
    const p = canopyPts[(i * 7 + 3) % canopyPts.length].clone(); p.y -= 0.35;
    const g = new THREE.Group(); g.position.copy(p);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 10), new THREE.MeshStandardMaterial({ color: 0xfff1c4, emissive: 0xffc46a, emissiveIntensity: 3 }));
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc46a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 })); halo.scale.setScalar(0.5);
    g.add(core, halo); g.userData.by = p.y; g.userData.ph = i * 2; orbs.push(g);
    add(g, t, 'orb', { full: 1 });
  });

  let h = 0.2;
  function burst(kind) {
    const up = kind !== 'wilt';
    parts.forEach(p => {
      if (p.sp !== up) return;
      const a = R(0, 6.28), r = up ? R(0.05, 1.8) * (0.4 + k * 1.2) : R(0.2, 1.4);
      const base = up ? mainRoot.position.y + R(0, 0.1) : mainRoot.position.y + Math.max(0.3, h * R(0.6, 1.2));
      p.o.position.set(Math.cos(a) * r, base, Math.sin(a) * r);
      p.v.set(R(-0.1, 0.1), up ? R(0.3, 1.0) * (0.4 + k) : R(-0.35, -0.6), R(-0.1, 0.1));
      p.max = p.life = up ? R(1.2, 2.4) : R(2.5, 4); p.o.visible = true;
      if (up) { p.o.material.color.set(Math.random() < 0.3 ? 0xffffff : 0xe2eb98); p.o.scale.setScalar(R(0.03, 0.07) * (0.5 + k)); }
    });
  }

  // ---------- loop ----------
  let g = 0, sg = 0, wT = 0, w = 0, yaw = 4.1, yawV = 0, pitch = 0.2, pitchT = 0.2, lastInt = -9, t = 0, raf, auto = true, dist = 1.8, lookY = 0.2, kick = 0, k = 0;
  const clock = new THREE.Timer(), tc = new THREE.Color(), nodeScale = (n, x) => n.d === 0 ? out((x - n.birth) / n.dur) : ease((x - n.birth) / n.dur);
  function frame() {
    raf = requestAnimationFrame(frame);
    clock.update(); const dt = Math.min(clock.getDelta(), 0.05); t += dt;
    sg += (g - sg) * Math.min(1, dt * 1.4);
    w += (wT - w) * Math.min(1, dt * 1.3);
    for (const it of items) {
      const want = g >= it.t && g < it.until;
      if (want !== it.on) { it.on = want; it.at = t + (want ? it.lag : it.lag * 0.5); }
      const tgt = (t >= it.at ? it.on : !it.on) ? 1 : 0;
      it.v += (tgt - it.cur) * 90 * dt; it.v *= 1 - Math.min(1, 11 * dt); it.cur += it.v * dt;
      it.obj.visible = it.cur > 0.003 || tgt > 0;
      const s = Math.max(1e-4, it.cur) * it.full;
      if (it.sprite) it.obj.scale.set(s, s, 1); else it.obj.scale.setScalar(s);
    }
    for (const n of nodes) { const s = nodeScale(n, sg); n.g.scale.setScalar(Math.max(1e-4, s)); n.g.visible = s > 0.002; }
    for (const c of clusters) { const s = ease((sg - c.birth) / c.dur) * (c.bl ? 1 - 0.6 * w : 1 - 0.25 * w); c.m.scale.setScalar(Math.max(1e-4, s)); c.m.visible = s > 0.002; c.m.rotation.x = Math.sin(t * 1.2 + c.ph) * 0.05; c.m.rotation.z = Math.sin(t * 0.9 + c.ph * 1.3) * 0.04; }
    for (const s of sways) s.g.rotation.x = Math.sin(t * 0.8 + s.ph) * s.a;
    const tS = nodeScale(nodes[0], sg);
    h = 1.55 * tS;
    const seedSize = (0.14 + clamp(sg / 7) * 0.24) * (1 - ease((sg - 8.5) / 3));
    seedG.scale.setScalar(Math.max(1e-4, seedSize / Math.max(tS, 0.02)));
    seedLeaves.forEach(L => { const s = ease((sg - Math.max(L.t, -0.5) + 0.6) / 1.2); L.m.scale.setScalar(Math.max(1e-4, s)); L.m.visible = s > 0.002; L.m.rotation.x = Math.sin(t * 1.3 + L.ph) * 0.06 + w * 0.5; });
    grass.count = Math.floor(MAXG * Math.pow(clamp((sg - 0.6) / 28), 1.15));
    grassU.uTime.value = t; grassU.uWilt.value = w;
    groundMat.color.copy(soilC).lerp(C(0xb8a894), w * 0.3); gU.uR.value = 0.6 + 7.5 * Math.sqrt(clamp((sg - 0.6) / 28)); gU.uPond.value = clamp((sg - 24.5) / 1.5);
    for (const x of tintMats) x.m.color.copy(x.a).lerp(x.b, w * 0.85);
    heads.forEach(hd => { hd.rotation.x = hd.userData.bx + 1.3 * w; });
    const night = 0;
    skyU.wilt.value = w; skyU.night.value = night;
    skyU.top.value.copy(skyCol.top).lerp(skyCol.nTop, night); skyU.mid.value.copy(skyCol.mid).lerp(skyCol.nMid, night);
    tc.copy(C(0xc4dcec)).lerp(skyCol.grey, w * 0.8); scene.fog.color.copy(tc);
    sun.intensity = (3.4 - 1.6 * night) * (1 - 0.55 * w); sun.color.copy(sunC).lerp(sunGrey, w);
    hemi.intensity = 0.85 + 0.25 * night;
    glow.intensity = clamp((sg - 25) / 6) * 2.2 * (1 - 0.7 * w); if (orbs[0]) glow.position.copy(orbs[0].position);
    ffs.forEach(s => { const u = s.userData, p = u.ph, tt = t * u.sp + p; s.position.set(u.b.x + Math.sin(tt) * 0.9, u.b.y * (1 - 0.7 * w) + Math.sin(tt * 2.3) * 0.15 + Math.abs(Math.sin(t * 9 + p)) * 0.03, u.b.z + Math.cos(tt * 0.8) * 0.9); s.rotation.y = Math.atan2(Math.cos(tt), -Math.sin(tt * 0.8) * 0.8); const f = Math.sin(t * 16 + p) * 1.1 * (1 - 0.8 * w); u.L.rotation.y = -f; u.Rw.rotation.y = f; });
    orbs.forEach(o => { o.position.y = o.userData.by + Math.sin(t * 1.1 + o.userData.ph) * 0.04; });
    const mOn = g >= 58 ? 1 : 0;
    motes.forEach(m => { const ph = (t * 0.08 + m.userData.off) % 1, a = m.userData.a + t * 0.05; m.position.set(Math.cos(a) * m.userData.r, mainRoot.position.y + ph * 3.5, Math.sin(a) * m.userData.r); m.material.opacity = mOn * Math.sin(ph * Math.PI) * 0.8 * (1 - w); m.visible = mOn > 0; });
    for (const p of parts) {
      if (p.life <= 0) { if (p.o.visible) p.o.visible = false; continue; }
      p.life -= dt; p.o.position.addScaledVector(p.v, dt);
      if (p.sp) p.o.material.opacity = Math.sin(clamp(p.life / p.max) * Math.PI);
      else { p.o.position.x += Math.sin(t * 3 + p.ph) * dt * 0.3; p.o.rotation.set(t * 2 + p.ph, t * 1.3, Math.sin(t * 4 + p.ph)); if (p.o.position.y < 0.02) { p.o.position.y = 0.02; p.v.set(0, 0, 0); } }
    }
    if (!down) { yaw += yawV; yawV *= 0.94; if (auto && t - lastInt > 2.5) yaw += dt * 0.08; }
    kick *= 1 - Math.min(1, dt * 2);
    k = out(clamp(sg / 30));
    dist += (3.4 + 14 * k - kick - dist) * Math.min(1, dt * 2);
    lookY += (0.2 + 1.5 * k - lookY) * Math.min(1, dt * 2);
    pitch += (pitchT + 0.08 * k - pitch) * Math.min(1, dt * 6);
    camera.position.set(Math.sin(yaw) * dist * Math.cos(pitch), lookY + dist * Math.sin(pitch), Math.cos(yaw) * dist * Math.cos(pitch));
    camera.lookAt(0, lookY, 0);
    sky.position.copy(camera.position);
    renderer.render(scene, camera);
  }

  // ---------- input ----------
  let down = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const vis = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
  function pick(e) {
    const b = cv.getBoundingClientRect();
    ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(scene.children.filter(c => c !== sky && !parts.some(p => p.o === c) && !motes.includes(c)), true);
    for (const hh of hits) {
      if (!vis(hh.object)) continue;
      let o = hh.object; while (o && o.userData.day === undefined) o = o.parent;
      cb.onPick && cb.onPick(o ? { day: o.userData.day, kind: o.userData.kind } : null);
      return;
    }
    cb.onPick && cb.onPick(null);
  }
  cv.addEventListener('pointerdown', e => { down = { lx: e.clientX, ly: e.clientY, moved: 0 }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; lastInt = t; yawV = 0; });
  cv.addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - down.lx, dy = e.clientY - down.ly; down.lx = e.clientX; down.ly = e.clientY;
    yaw -= dx * 0.007; yawV = -dx * 0.007; pitchT = clamp(pitchT + dy * 0.003, 0.04, 0.7);
    down.moved += Math.abs(dx) + Math.abs(dy); lastInt = t;
    if (down.moved > 8 && !down.told) { down.told = true; cb.onDrag && cb.onDrag(); }
  });
  cv.addEventListener('pointerup', e => { if (down && down.moved < 8) pick(e); down = null; cv.style.cursor = 'grab'; });
  cv.addEventListener('pointercancel', () => { down = null; });

  function size() {
    const W = host.clientWidth || 390, H = host.clientHeight || 760;
    renderer.setSize(W, H, false); camera.aspect = W / H;
    camera.setViewOffset(W, H, 0, -H * 0.14, W, H); camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(size); ro.observe(host); size();
  frame();

  const visAt = (it, n) => n >= it.t && n < it.until;
  return {
    setGrowth(n, instant) {
      g = n;
      if (instant) { sg = n; for (const it of items) { it.on = visAt(it, n); it.cur = it.on ? 1 : 0; it.v = 0; it.at = 0; } }
    },
    setWilt(v, instant) { wT = v; if (instant) w = v; },
    setAuto(v) { auto = v; },
    // Stops drawing while the garden is hidden (another screen on top), and starts again.
    setPaused(v) {
      if (v) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) frame();
    },
    burst(kind) { burst(kind); if (kind !== 'wilt') kick = 0.6; },
    countLost(from, to) {
      const c = {};
      items.forEach(it => { if (visAt(it, from) && !visAt(it, to)) c[it.kind] = (c[it.kind] || 0) + 1; });
      clusters.forEach(cl => { if (cl.birth < from && cl.birth >= to) { const kk = cl.bl ? 'blossom' : 'leaves'; c[kk] = (c[kk] || 0) + 1; } });
      nodes.forEach(n => { if (n.birth < from && n.birth >= to && n.d > 0) c.branch = (c.branch || 0) + 1; });
      return c;
    },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); cv.remove(); },
  };
}
