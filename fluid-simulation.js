/*!
 * WebGL Fluid Simulation — Background Edition
 * Adapted from PavelDoGreat/WebGL-Fluid-Simulation (MIT License)
 * https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
 */
(function () {
  'use strict';

  const canvas = document.getElementById('fluid-canvas');
  if (!canvas) {
    console.warn('[Fluid Simulation] Canvas element with id "fluid-canvas" was not found.');
    return;
  }

  const CONFIG = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    DENSITY_DISSIPATION: 1.25,
    VELOCITY_DISSIPATION: 0.3,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: 35,
    SPLAT_RADIUS: 0.35,
    SPLAT_FORCE: 6000,
    SHADING: true,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 9,
    BACK_COLOR: { r: 4, g: 8, b: 18 },
    TRANSPARENT: false,
    PAUSED: false
  };

  function pointerPrototype() {
    this.id = -1;
    this.texcoordX = 0;
    this.texcoordY = 0;
    this.prevTexcoordX = 0;
    this.prevTexcoordY = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.down = false;
    this.moved = false;
    this.color = [30, 0, 300];
  }

  const pointers = [];
  const splatStack = [];
  pointers.push(new pointerPrototype());

  const { gl, ext } = getWebGLContext(canvas);
  if (!gl || !ext) {
    console.warn('[Fluid Simulation] WebGL context not available.');
    return;
  }

  if (isMobile()) {
    CONFIG.DYE_RESOLUTION = 512;
  }

  if (!ext.supportLinearFiltering) {
    CONFIG.DYE_RESOLUTION = 512;
    CONFIG.SHADING = false;
  }

  const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
    precision highp float;

    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;

    void main () {
      vUv = aPosition * 0.5 + 0.5;
      vL = vUv - vec2(texelSize.x, 0.0);
      vR = vUv + vec2(texelSize.x, 0.0);
      vT = vUv + vec2(0.0, texelSize.y);
      vB = vUv - vec2(0.0, texelSize.y);
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `);

  const copyShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
      gl_FragColor = texture2D(uTexture, vUv);
    }
  `);

  const clearShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;

    void main () {
      gl_FragColor = value * texture2D(uTexture, vUv);
    }
  `);

  const colorShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;

    uniform vec4 color;

    void main () {
      gl_FragColor = color;
    }
  `);

  const displayShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform vec2 texelSize;
    uniform float lightingStrength;

    void main () {
      vec3 color = texture2D(uTexture, vUv).rgb;
      vec3 L = texture2D(uTexture, vL).rgb;
      vec3 R = texture2D(uTexture, vR).rgb;
      vec3 T = texture2D(uTexture, vT).rgb;
      vec3 B = texture2D(uTexture, vB).rgb;

      float dx = length(R) - length(L);
      float dy = length(T) - length(B);
      vec3 normal = normalize(vec3(dx, dy, length(texelSize)));
      float diffuse = clamp(dot(normal, vec3(0.0, 0.0, 1.0)) + lightingStrength, 0.3, 1.25);

      color *= diffuse;
      gl_FragColor = vec4(color, 1.0);
    }
  `);

  const splatShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;

    void main () {
      vec2 p = vUv - point.xy;
      p.x *= aspectRatio;
      vec3 splat = exp(-dot(p, p) / radius) * color;
      vec3 base = texture2D(uTarget, vUv).xyz;
      gl_FragColor = vec4(base + splat, 1.0);
    }
  `);

  const advectionShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform float dissipation;

    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
      vec2 st = uv / tsize - 0.5;
      vec2 iuv = floor(st);
      vec2 fuv = fract(st);

      vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
      vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
      vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
      vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

      return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
    }

    void main () {
    #ifdef MANUAL_FILTERING
      vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
      vec4 result = bilerp(uSource, coord, dyeTexelSize);
    #else
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      vec4 result = texture2D(uSource, coord);
    #endif
      float decay = 1.0 + dissipation * dt;
      gl_FragColor = result / decay;
    }
  `, ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']);

  const divergenceShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
      float L = texture2D(uVelocity, vL).x;
      float R = texture2D(uVelocity, vR).x;
      float T = texture2D(uVelocity, vT).y;
      float B = texture2D(uVelocity, vB).y;

      vec2 C = texture2D(uVelocity, vUv).xy;
      if (vL.x < 0.0) { L = -C.x; }
      if (vR.x > 1.0) { R = -C.x; }
      if (vT.y > 1.0) { T = -C.y; }
      if (vB.y < 0.0) { B = -C.y; }

      float div = 0.5 * (R - L + T - B);
      gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
  `);

  const curlShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
      float L = texture2D(uVelocity, vL).y;
      float R = texture2D(uVelocity, vR).y;
      float T = texture2D(uVelocity, vT).x;
      float B = texture2D(uVelocity, vB).x;
      float vorticity = R - L - T + B;
      gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }
  `);

  const vorticityShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;

    void main () {
      float L = texture2D(uCurl, vL).x;
      float R = texture2D(uCurl, vR).x;
      float T = texture2D(uCurl, vT).x;
      float B = texture2D(uCurl, vB).x;
      float C = texture2D(uCurl, vUv).x;

      vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
      force /= length(force) + 0.0001;
      force *= curl * C;
      force.y *= -1.0;

      vec2 vel = texture2D(uVelocity, vUv).xy;
      gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
    }
  `);

  const pressureShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;

    void main () {
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      float C = texture2D(uPressure, vUv).x;
      float divergence = texture2D(uDivergence, vUv).x;
      float pressure = (L + R + B + T - divergence) * 0.25;
      gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
  `);

  const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;

    void main () {
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      vec2 velocity = texture2D(uVelocity, vUv).xy;
      velocity.xy -= vec2(R - L, T - B);
      gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
  `);

  const copyProgram = new Program(baseVertexShader, copyShader);
  const clearProgram = new Program(baseVertexShader, clearShader);
  const colorProgram = new Program(baseVertexShader, colorShader);
  const displayProgram = new Program(baseVertexShader, displayShader);
  const splatProgram = new Program(baseVertexShader, splatShader);
  const advectionProgram = new Program(baseVertexShader, advectionShader);
  const divergenceProgram = new Program(baseVertexShader, divergenceShader);
  const curlProgram = new Program(baseVertexShader, curlShader);
  const vorticityProgram = new Program(baseVertexShader, vorticityShader);
  const pressureProgram = new Program(baseVertexShader, pressureShader);
  const gradienSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);

  let dye;
  let velocity;
  let divergence;
  let curl;
  let pressure;

  // Color palette for fluid effects
  const PALETTE = [
    { h: 195 / 360, s: 0.95, v: 1.0 }, // neon cyan
    { h: 308 / 360, s: 0.82, v: 1.0 }, // vibrant magenta
    { h: 140 / 360, s: 0.72, v: 0.95 }, // laser lime
    { h: 265 / 360, s: 0.78, v: 0.96 }  // deep violet
  ];
  let paletteIndex = 0;

  initFramebuffers();

  // Ensure all programs are properly initialized before using them
  setTimeout(() => {
    try {
      multipleSplats(20);
    } catch(e) {
      console.warn('Initial splat generation failed:', e);
    }
  }, 100);

  let lastUpdateTime = Date.now();
  let colorUpdateTimer = 0.0;

  update();

  function update() {
    const dt = calcDeltaTime();
    if (resizeCanvas()) {
      initFramebuffers();
    }
    updateColors(dt);
    applyInputs();
    if (!CONFIG.PAUSED) {
      step(dt);
    }
    render(null);
    requestAnimationFrame(update);
  }

  function calcDeltaTime() {
    const now = Date.now();
    let dt = (now - lastUpdateTime) / 1000;
    dt = Math.min(dt, 0.016666);
    lastUpdateTime = now;
    return dt;
  }

  function resizeCanvas() {
    const width = scaleByPixelRatio(canvas.clientWidth);
    const height = scaleByPixelRatio(canvas.clientHeight);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }
    return false;
  }

  function updateColors(dt) {
    if (!CONFIG.COLORFUL) {
      return;
    }
    colorUpdateTimer += dt * CONFIG.COLOR_UPDATE_SPEED;
    if (colorUpdateTimer >= 1) {
      colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
      pointers.forEach(pointer => {
        pointer.color = generateColor();
      });
    }
  }

  function applyInputs() {
    if (splatStack.length > 0) {
      multipleSplats(splatStack.pop());
    }
    pointers.forEach(pointer => {
      if (pointer.moved) {
        pointer.moved = false;
        splatPointer(pointer);
      }
    });
  }

  function step(dt) {
    // Ensure all programs are initialized before use
    if (!curlProgram || !curlProgram.bind ||
        !vorticityProgram || !vorticityProgram.bind ||
        !divergenceProgram || !divergenceProgram.bind ||
        !pressureProgram || !pressureProgram.bind ||
        !gradienSubtractProgram || !gradienSubtractProgram.bind ||
        !advectionProgram || !advectionProgram.bind) {
      return;
    }

    gl.disable(gl.BLEND);
    gl.viewport(0, 0, velocity.width, velocity.height);

    curlProgram.bind();
    gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(curl.fbo);

    vorticityProgram.bind();
    gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
    gl.uniform1f(vorticityProgram.uniforms.curl, CONFIG.CURL);
    gl.uniform1f(vorticityProgram.uniforms.dt, dt);
    blit(velocity.write.fbo);
    velocity.swap();

    divergenceProgram.bind();
    gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(divergence.fbo);

    clearProgram.bind();
    gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
    gl.uniform1f(clearProgram.uniforms.value, CONFIG.PRESSURE);
    blit(pressure.write.fbo);
    pressure.swap();

    pressureProgram.bind();
    gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
    for (let i = 0; i < CONFIG.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
      blit(pressure.write.fbo);
      pressure.swap();
    }

    gradienSubtractProgram.bind();
    gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
    gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
    blit(velocity.write.fbo);
    velocity.swap();

    advectionProgram.bind();
    gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    if (!ext.supportLinearFiltering) {
      gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
    }
    const velocityId = velocity.read.attach(0);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
    gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
    gl.uniform1f(advectionProgram.uniforms.dt, dt);
    gl.uniform1f(advectionProgram.uniforms.dissipation, CONFIG.VELOCITY_DISSIPATION);
    blit(velocity.write.fbo);
    velocity.swap();

    gl.viewport(0, 0, dye.width, dye.height);
    if (!ext.supportLinearFiltering) {
      gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
    }
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
    gl.uniform1f(advectionProgram.uniforms.dissipation, CONFIG.DENSITY_DISSIPATION);
    blit(dye.write.fbo);
    dye.swap();
  }

  function render(target) {
    // Ensure render programs are initialized
    if (!colorProgram || !colorProgram.bind || !displayProgram || !displayProgram.bind) {
      return;
    }

    if (target === null || !CONFIG.TRANSPARENT) {
      gl.disable(gl.BLEND);
    }

    const width = target === null ? gl.drawingBufferWidth : target.width;
    const height = target === null ? gl.drawingBufferHeight : target.height;
    gl.viewport(0, 0, width, height);

    const fbo = target === null ? null : target.fbo;
    if (!CONFIG.TRANSPARENT) {
      drawColor(fbo, normalizeColor(CONFIG.BACK_COLOR));
    }

    drawDisplay(fbo, width, height);
  }

  function drawColor(fbo, color) {
    colorProgram.bind();
    gl.uniform4f(colorProgram.uniforms.color, color.r, color.g, color.b, 1);
    blit(fbo);
  }

  function drawDisplay(fbo, width, height) {
    displayProgram.bind();
    gl.uniform2f(displayProgram.uniforms.texelSize, 1.0 / width, 1.0 / height);
    gl.uniform1i(displayProgram.uniforms.uTexture, dye.read.attach(0));
    gl.uniform1f(displayProgram.uniforms.lightingStrength, CONFIG.SHADING ? 0.65 : 0.0);
    blit(fbo);
  }

  function multipleSplats(amount) {
    for (let i = 0; i < amount; i++) {
      const color = generateColor();
      color.r *= 12.0;
      color.g *= 12.0;
      color.b *= 12.0;
      const x = Math.random();
      const y = Math.random();
      const dx = 1000 * (Math.random() - 0.5);
      const dy = 1000 * (Math.random() - 0.5);
      splat(x, y, dx, dy, color);
    }
  }

  function splatPointer(pointer) {
    const dx = pointer.deltaX * CONFIG.SPLAT_FORCE;
    const dy = pointer.deltaY * CONFIG.SPLAT_FORCE;
    splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
  }

  function splat(x, y, dx, dy, color) {
    if (!splatProgram || !splatProgram.bind) {
      console.warn('Splat program not initialized yet');
      return;
    }
    gl.viewport(0, 0, velocity.width, velocity.height);
    splatProgram.bind();
    gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
    gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(splatProgram.uniforms.point, x, y);
    gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
    gl.uniform1f(splatProgram.uniforms.radius, correctRadius(CONFIG.SPLAT_RADIUS / 100.0));
    blit(velocity.write.fbo);
    velocity.swap();

    gl.viewport(0, 0, dye.width, dye.height);
    gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
    gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
    blit(dye.write.fbo);
    dye.swap();
  }

  function initFramebuffers() {
    const simRes = getResolution(CONFIG.SIM_RESOLUTION);
    const dyeRes = getResolution(CONFIG.DYE_RESOLUTION);
    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const rg = ext.formatRG;
    const r = ext.formatR;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering, dye);
    velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering, velocity);
    divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST, divergence);
    curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST, curl);
    pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST, pressure);
  }

  function createFBO(w, h, internalFormat, format, type, param, existingFbo) {
    if (existingFbo && existingFbo.width === w && existingFbo.height === h) {
      return existingFbo;
    }
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const texelSizeX = 1.0 / w;
    const texelSizeY = 1.0 / h;

    return {
      texture,
      fbo,
      width: w,
      height: h,
      texelSizeX,
      texelSizeY,
      attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      }
    };
  }

  function createDoubleFBO(w, h, internalFormat, format, type, param, existingDouble) {
    if (existingDouble && existingDouble.width === w && existingDouble.height === h) {
      return existingDouble;
    }
    let fbo1 = createFBO(w, h, internalFormat, format, type, param);
    let fbo2 = createFBO(w, h, internalFormat, format, type, param);
    return {
      width: w,
      height: h,
      texelSizeX: fbo1.texelSizeX,
      texelSizeY: fbo1.texelSizeY,
      get read() {
        return fbo1;
      },
      set read(value) {
        fbo1 = value;
      },
      get write() {
        return fbo2;
      },
      set write(value) {
        fbo2 = value;
      },
      swap() {
        const temp = fbo1;
        fbo1 = fbo2;
        fbo2 = temp;
      }
    };
  }

  const blit = (function () {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    return function (destination) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
  })();

  function updatePointerDownData(pointer, id, posX, posY) {
    pointer.id = id;
    pointer.down = true;
    pointer.moved = false;
    pointer.texcoordX = posX / canvas.width;
    pointer.texcoordY = 1.0 - posY / canvas.height;
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.deltaX = 0;
    pointer.deltaY = 0;
    pointer.color = generateColor();
  }

  function updatePointerMoveData(pointer, posX, posY) {
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.texcoordX = posX / canvas.width;
    pointer.texcoordY = 1.0 - posY / canvas.height;
    pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
    pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
    pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
  }

  function updatePointerUpData(pointer) {
    pointer.down = false;
  }

  function correctDeltaX(delta) {
    const aspectRatio = canvas.width / canvas.height;
    if (aspectRatio < 1) {
      delta *= aspectRatio;
    }
    return delta;
  }

  function correctDeltaY(delta) {
    const aspectRatio = canvas.width / canvas.height;
    if (aspectRatio > 1) {
      delta /= aspectRatio;
    }
    return delta;
  }

  function generateColor() {
    const pick = PALETTE[paletteIndex++ % PALETTE.length];
    const jitter = (Math.random() - 0.5) * 0.06;
    const color = HSVtoRGB((pick.h + jitter + 1.0) % 1.0, pick.s, pick.v);
    color.r *= 0.8;
    color.g *= 0.8;
    color.b *= 0.8;
    return color;
  }

  function HSVtoRGB(h, s, v) {
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
      default: r = v; g = t; b = p; break;
    }
    return { r, g, b };
  }

  function normalizeColor(input) {
    return {
      r: input.r / 255,
      g: input.g / 255,
      b: input.b / 255
    };
  }

  function wrap(value, min, max) {
    const range = max - min;
    if (range === 0) {
      return min;
    }
    return ((value - min) % range + range) % range + min;
  }

  function getResolution(resolution) {
    let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspectRatio < 1) {
      aspectRatio = 1.0 / aspectRatio;
    }
    const min = Math.round(resolution);
    const max = Math.round(resolution * aspectRatio);
    if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
      return { width: max, height: min };
    }
    return { width: min, height: max };
  }

  function scaleByPixelRatio(input) {
    const pixelRatio = window.devicePixelRatio || 1;
    return Math.floor(input * pixelRatio);
  }

  function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
  }

  function getWebGLContext(targetCanvas) {
    const params = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false
    };
    let context = targetCanvas.getContext('webgl2', params);
    const isWebGL2 = !!context;
    if (!isWebGL2) {
      context = targetCanvas.getContext('webgl', params) || targetCanvas.getContext('experimental-webgl', params);
    }

    if (!context) {
      return {};
    }

    let halfFloat;
    let supportLinearFiltering;

    if (isWebGL2) {
      context.getExtension('EXT_color_buffer_float');
      supportLinearFiltering = context.getExtension('OES_texture_float_linear');
    } else {
      halfFloat = context.getExtension('OES_texture_half_float');
      supportLinearFiltering = context.getExtension('OES_texture_half_float_linear');
    }

    context.clearColor(0.0, 0.0, 0.0, 1.0);
    const halfFloatTexType = isWebGL2 ? context.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;

    const formatRGBA = getSupportedFormat(context, context.RGBA16F, context.RGBA, halfFloatTexType, isWebGL2);
    const formatRG = getSupportedFormat(context, context.RG16F, context.RG, halfFloatTexType, isWebGL2);
    const formatR = getSupportedFormat(context, context.R16F, context.RED, halfFloatTexType, isWebGL2);

    return {
      gl: context,
      ext: {
        formatRGBA,
        formatRG,
        formatR,
        halfFloatTexType,
        supportLinearFiltering
      }
    };
  }

  function getSupportedFormat(glContext, internalFormat, format, type, isWebGL2) {
    if (!supportRenderTextureFormat(glContext, internalFormat, format, type)) {
      if (!isWebGL2) {
        return getFallbackFormat(glContext, type);
      }
      switch (internalFormat) {
        case glContext.R16F:
          return getSupportedFormat(glContext, glContext.RG16F, glContext.RG, type, isWebGL2);
        case glContext.RG16F:
          return getSupportedFormat(glContext, glContext.RGBA16F, glContext.RGBA, type, isWebGL2);
        default:
          return null;
      }
    }
    return { internalFormat, format };
  }

  function getFallbackFormat(glContext, type) {
    return {
      internalFormat: glContext.RGBA,
      format: glContext.RGBA,
      type
    };
  }

  function supportRenderTextureFormat(glContext, internalFormat, format, type) {
    const texture = glContext.createTexture();
    glContext.bindTexture(glContext.TEXTURE_2D, texture);
    glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MIN_FILTER, glContext.NEAREST);
    glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MAG_FILTER, glContext.NEAREST);
    glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_S, glContext.CLAMP_TO_EDGE);
    glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_T, glContext.CLAMP_TO_EDGE);
    glContext.texImage2D(glContext.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

    const fbo = glContext.createFramebuffer();
    glContext.bindFramebuffer(glContext.FRAMEBUFFER, fbo);
    glContext.framebufferTexture2D(glContext.FRAMEBUFFER, glContext.COLOR_ATTACHMENT0, glContext.TEXTURE_2D, texture, 0);

    const status = glContext.checkFramebufferStatus(glContext.FRAMEBUFFER);
    glContext.deleteTexture(texture);
    glContext.deleteFramebuffer(fbo);
    return status === glContext.FRAMEBUFFER_COMPLETE;
  }

  function compileShader(type, source, keywords) {
    if (keywords != null) {
      source = addKeywords(source, keywords);
    }
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(shader);
    }
    return shader;
  }

  function addKeywords(source, keywords) {
    if (keywords == null) {
      return source;
    }
    let keywordsString = '';
    keywords.forEach(keyword => {
      keywordsString += '#define ' + keyword + '\n';
    });
    return keywordsString + source;
  }

  function Program(vertexShader, fragmentShader) {
    this.uniforms = {};
    this.program = createProgram(vertexShader, fragmentShader);
    this.uniforms = getUniforms(this.program);
  }

  Program.prototype.bind = function bind() {
    gl.useProgram(this.program);
  };

  function createProgram(vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(program);
    }
    return program;
  }

  function getUniforms(program) {
    const uniforms = {};
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      const uniformName = gl.getActiveUniform(program, i).name;
      uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }
    return uniforms;
  }

  function correctRadius(radius) {
    let aspectRatio = canvas.width / canvas.height;
    if (aspectRatio > 1) {
      radius *= aspectRatio;
    }
    return radius;
  }

  // Pointer interactions
  canvas.addEventListener('mousedown', e => {
    const posX = scaleByPixelRatio(e.offsetX);
    const posY = scaleByPixelRatio(e.offsetY);
    updatePointerDownData(pointers[0], -1, posX, posY);
  });

  window.addEventListener('mousemove', e => {
    const pointer = pointers[0];
    if (!pointer.down) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const posX = scaleByPixelRatio(e.clientX - rect.left);
    const posY = scaleByPixelRatio(e.clientY - rect.top);
    updatePointerMoveData(pointer, posX, posY);
  });

  window.addEventListener('mouseup', () => {
    updatePointerUpData(pointers[0]);
  });

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const touches = e.targetTouches;
    while (touches.length >= pointers.length) {
      pointers.push(new pointerPrototype());
    }
    for (let i = 0; i < touches.length; i++) {
      const posX = scaleByPixelRatio(touches[i].pageX - canvas.offsetLeft);
      const posY = scaleByPixelRatio(touches[i].pageY - canvas.offsetTop);
      updatePointerDownData(pointers[i + 1], touches[i].identifier, posX, posY);
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const touches = e.targetTouches;
    for (let i = 0; i < touches.length; i++) {
      const pointer = pointers[i + 1];
      if (!pointer.down) {
        continue;
      }
      const posX = scaleByPixelRatio(touches[i].pageX - canvas.offsetLeft);
      const posY = scaleByPixelRatio(touches[i].pageY - canvas.offsetTop);
      updatePointerMoveData(pointer, posX, posY);
    }
  }, { passive: false });

  window.addEventListener('touchend', e => {
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const pointer = pointers.find(p => p.id === touches[i].identifier);
      if (!pointer) {
        continue;
      }
      updatePointerUpData(pointer);
    }
  });

  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      splatStack.push(parseInt(Math.random() * 20) + 5);
    }
    if (e.code === 'KeyP') {
      CONFIG.PAUSED = !CONFIG.PAUSED;
    }
  });

  const FluidField = {
    splatNormalized(x, y, dx = 0, dy = 0, color) {
      const velocityScale = 1500;
      const col = color || generateColor();
      splat(x, y, dx * velocityScale, dy * velocityScale, col);
    },
    addRandomSplats(amount = 1) {
      multipleSplats(amount);
    },
    pause() {
      CONFIG.PAUSED = true;
    },
    resume() {
      CONFIG.PAUSED = false;
    },
    isPaused() {
      return CONFIG.PAUSED;
    }
  };

  window.FluidField = FluidField;
  document.dispatchEvent(new CustomEvent('fluid-ready', { detail: FluidField }));
})();
