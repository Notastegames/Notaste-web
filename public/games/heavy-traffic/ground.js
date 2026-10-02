// Heavy Traffic: the ground, seen from behind the player's kart.
// The whole circuit is drawn once, top-down, into a big texture; a WebGL
// shader then lays it out as a floor in perspective (the old "mode 7" trick),
// fading to black in the distance. Everything standing on the floor (karts,
// signs, smoke) is drawn on the 2D canvas above it by race.js.
(function () {
  "use strict";

  var HT = window.HeavyTraffic = window.HeavyTraffic || {};

  var VERTEX = [
    "attribute vec2 aPos;",
    "void main() { gl_Position = vec4(aPos, 0.0, 1.0); }"
  ].join("\n");

  // For each pixel below the horizon: how far away is the floor there, where is
  // that in the world, and what does the circuit texture say is there.
  var FRAGMENT = [
    "precision highp float;",
    "uniform vec2 uRes;",
    "uniform vec2 uCam;",
    "uniform vec2 uFwd;",
    "uniform vec2 uRight;",
    "uniform float uH;",
    "uniform float uF;",
    "uniform float uHorizon;",
    "uniform float uCx;",
    "uniform vec4 uWorld;",
    "uniform vec3 uInk;",
    "uniform vec2 uFog;",
    "uniform sampler2D uTex;",
    "void main() {",
    "  float sy = uRes.y - gl_FragCoord.y;",
    "  float below = max(sy - uHorizon, 0.5);",
    "  float d = uH * uF / below;",
    "  float lat = d * (gl_FragCoord.x - uCx) / uF;",
    "  vec2 w = uCam + uFwd * d + uRight * lat;",
    "  vec2 uv = (w - uWorld.xy) / uWorld.zw;",
    "  vec3 tex = texture2D(uTex, clamp(uv, 0.0, 1.0)).rgb;",
    "  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);",
    "  vec3 col = mix(uInk, tex, inside);",
    "  float fog = smoothstep(uFog.x, uFog.y, d);",
    "  float sky = step(sy, uHorizon + 0.5);",
    "  gl_FragColor = vec4(mix(mix(col, uInk, fog), uInk, sky), 1.0);",
    "}"
  ].join("\n");

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }

  function hexToRgb(hex) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
    var n = parseInt(h, 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  // canvas: the WebGL canvas. texture: a canvas with the circuit drawn on it.
  // world: [minX, minY, width, height] of the world the texture covers.
  // Returns null when WebGL isn't available, and race.js draws top-down instead.
  HT.createGround = function (canvas, texture, world, ink) {
    var gl;
    try { gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, preserveDrawingBuffer: false }); } catch (e) { gl = null; }
    if (!gl) return null;

    var prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) {
      return null;
    }
    gl.useProgram(prog);

    // one triangle that covers the screen
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture);
    gl.generateMipmap(gl.TEXTURE_2D);   // texture sides are powers of two
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // sharp road markings at a low angle, where the hardware allows it
    var aniso = gl.getExtension("EXT_texture_filter_anisotropic") || gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
    if (aniso) {
      var most = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, most));
    }

    var u = {};
    ["uRes", "uCam", "uFwd", "uRight", "uH", "uF", "uHorizon", "uCx", "uWorld", "uInk", "uFog", "uTex"].forEach(function (name) {
      u[name] = gl.getUniformLocation(prog, name);
    });
    var inkRgb = hexToRgb(ink);
    gl.uniform4f(u.uWorld, world[0], world[1], world[2], world[3]);
    gl.uniform3f(u.uInk, inkRgb[0], inkRgb[1], inkRgb[2]);
    gl.uniform1i(u.uTex, 0);

    return {
      // view: camera position, heading, height, focal length and horizon, all
      // in device pixels, as worked out by race.js
      draw: function (view) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(u.uRes, canvas.width, canvas.height);
        gl.uniform2f(u.uCam, view.x, view.y);
        gl.uniform2f(u.uFwd, view.fx, view.fy);
        gl.uniform2f(u.uRight, -view.fy, view.fx);
        gl.uniform1f(u.uH, view.h);
        gl.uniform1f(u.uF, view.f * view.dpr);
        gl.uniform1f(u.uHorizon, view.horizon * view.dpr);
        gl.uniform1f(u.uCx, view.cx * view.dpr);
        gl.uniform2f(u.uFog, view.fogNear, view.fogFar);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      lost: function () { return gl.isContextLost(); }
    };
  };
})();
