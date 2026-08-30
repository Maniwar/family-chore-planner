/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ThemePreset, isGlassTheme } from '../utils/theme';

interface GlassIceShaderBackgroundProps {
  currentTheme: ThemePreset;
  intensity?: number;
  enableShaders?: boolean;
}

// GLSL Vertex Shader for Fullscreen Ambient Fluid Refraction Quad
const fluidVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// GLSL Fragment Shader for Apple VisionOS / macOS Fluid Glass & Ice Ambient Wallpaper
const fluidFragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uIsIce; // 1.0 for crystal_ice, 0.0 for frosted_glass
  uniform float uIntensity;
  varying vec2 vUv;

  // Simplex 2D noise for organic fluid gradients
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 st = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
    vec2 mouseNorm = (uMouse * 2.0 - 1.0);
    mouseNorm.y = -mouseNorm.y;

    // Gentle ambient drift speed
    float t = uTime * 0.07;

    // Interactive mouse fluid attraction
    float mouseDist = length(st - mouseNorm * 0.85);
    float mouseInfluence = smoothstep(0.9, 0.0, mouseDist);

    // Multi-octave organic fluid warp with soft curves
    vec2 q = vec2(0.0);
    q.x = snoise(st * 0.6 + vec2(t * 0.2, t * 0.15));
    q.y = snoise(st * 0.6 + vec2(t * 0.15, t * 0.25));

    vec2 r = vec2(0.0);
    r.x = snoise(st * 0.9 + 0.8 * q + vec2(1.7, 9.2) + 0.09 * t + mouseInfluence * 0.12);
    r.y = snoise(st * 0.9 + 0.8 * q + vec2(8.3, 2.8) + 0.08 * t);

    float f = snoise(st * 0.7 + r * 0.9);

    // Apple visionOS Luminous Ambient Palettes (Soft, Dreamy, Eye-Safe)
    vec3 col;
    if (uIsIce > 0.5) {
      // Subzero Glacial Ice - Arctic Turquoise, Pure Frost Caustics, Deep Marine
      vec3 iceBase = vec3(0.82, 0.92, 0.98);        // Soft Glacier White-Blue
      vec3 iceCyan = vec3(0.48, 0.82, 0.96);        // Soft Crystal Cyan
      vec3 iceAqua = vec3(0.24, 0.64, 0.90);        // Pure Marine Azure
      vec3 iceDeep = vec3(0.12, 0.38, 0.68);        // Deep Polar Navy
      
      col = mix(iceBase, iceCyan, clamp((f * 0.5 + 0.5) * 1.4, 0.0, 1.0));
      col = mix(col, iceAqua, clamp(length(q) * 0.7, 0.0, 1.0));
      col = mix(col, iceDeep, clamp(length(r.x) * 0.6, 0.0, 1.0) * 0.40);
      col += vec3(0.98, 1.0, 1.0) * pow(clamp(f * 0.5 + 0.5, 0.0, 1.0), 3.0) * 0.30;
    } else {
      // Frosted Glass UI - Apple Dynamic Ambient Flow (Sky Blue, Soft Lilac, Ethereal Pearl, Subtle Quartz)
      vec3 glassBase = vec3(0.85, 0.91, 0.99);      // Soft Pearl Periwinkle
      vec3 glassSky  = vec3(0.50, 0.75, 0.98);      // Gentle Azure Sky
      vec3 glassIris = vec3(0.72, 0.60, 0.95);      // Soft Twilight Lavender
      vec3 glassRose = vec3(0.96, 0.70, 0.84);      // Gentle Morning Rose Quartz
      vec3 glassMint = vec3(0.60, 0.92, 0.90);      // Soft Seafoam Mint
      
      col = mix(glassBase, glassSky, clamp((f * 0.5 + 0.5) * 1.3, 0.0, 1.0));
      col = mix(col, glassIris, clamp(length(q) * 0.75, 0.0, 1.0));
      col = mix(col, glassRose, clamp(length(r.x) * 0.65, 0.0, 1.0) * 0.35);
      col = mix(col, glassMint, clamp(length(r.y) * 0.55, 0.0, 1.0) * 0.25);
      col += vec3(1.0, 1.0, 1.0) * pow(clamp(f * 0.5 + 0.5, 0.0, 1.0), 2.8) * 0.25;
    }

    // Soft corner vignette for depth
    float corner = length(vUv - 0.5);
    col -= smoothstep(0.45, 0.95, corner) * 0.05;

    // Organic micro-frost crystalline texture
    float microFrost = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.015;
    col += microFrost;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const GlassIceShaderBackground: React.FC<GlassIceShaderBackgroundProps> = ({
  currentTheme,
  intensity = 1.0,
  enableShaders = true,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const isIce = currentTheme === 'crystal_ice';
  const isFrosted = currentTheme === 'frosted_glass';
  const isActive = isIce || isFrosted;

  useEffect(() => {
    if (!isActive || !enableShaders || !mountRef.current) return;

    const container = mountRef.current;
    let animationFrameId: number;

    // Three.js Scene Setup for fullscreen ambient background
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'highp',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uIsIce: { value: isIce ? 1.0 : 0.0 },
      uIntensity: { value: intensity },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: fluidVertexShader,
      fragmentShader: fluidFragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Mouse tracking for fluid parallax
    const mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    const handlePointerMove = (e: PointerEvent) => {
      mouse.targetX = e.clientX / window.innerWidth;
      mouse.targetY = e.clientY / window.innerHeight;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Resize handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      uniforms.uResolution.value.set(w, h);
    };

    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      uniforms.uTime.value = elapsed;
      uniforms.uMouse.value.set(mouse.x, mouse.y);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isActive, isIce, isFrosted, intensity, enableShaders]);

  if (!isActive) return null;

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      style={{ width: '100vw', height: '100vh' }}
      aria-hidden="true"
    />
  );
};
