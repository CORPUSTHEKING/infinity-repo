export function bindScrollChrome({ shell, threshold = 18, onChange } = {}) {
  const update = () => {
    const scrolled = (window.scrollY || 0) > threshold;
    if (shell) shell.classList.toggle('is-scrolled', scrolled);
    onChange?.(scrolled);
  };

  window.addEventListener('scroll', update, { passive: true });
  update();

  return () => window.removeEventListener('scroll', update);
}

export function bindHeroParallax(root, options = {}) {
  const hero = root?.querySelector?.('[data-hero-parallax]');
  if (!hero) return () => {};

  const layers = [
    hero.querySelector('.inf-hero-layer-back'),
    hero.querySelector('.inf-hero-layer-mid'),
    hero.querySelector('.inf-hero-layer-front')
  ].filter(Boolean);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || layers.length === 0) {
    return () => {};
  }

  // Drone Rig Configuration (The Cinematic Setup)
  // [driftX_Amp, driftY_Amp, driftX_Freq, driftY_Freq, scrollParallaxX, scrollParallaxY]
  const droneRig = options.droneRig || [
    [140, 16, 0.00012, 0.00018, 0.035, 0.012], // Back (distant, slow)
    [80,  10, 0.00018, 0.00025, 0.065, 0.025], // Mid (fog/clouds)
    [36,   6, 0.00028, 0.00035, 0.110, 0.045]  // Front (close, agile)
  ];

  const INERTIA = 0.045; // Camera rig weight (lower = heavier/smoother)

  // State holds actual rendered positions for Linear Interpolation (Lerp)
  const state = layers.map(() => ({ x: 0, y: 0 }));

  let rafId = 0;
  let active = true;

  const frame = (now) => {
    if (!active) return;

    const scrollY = window.scrollY || 0;

    layers.forEach((layer, i) => {
      const [xAmp, yAmp, xFreq, yFreq, pxX, pxY] = droneRig[i];

      // 1. Organic Drone Drift (Lissajous curves remove the "mathy" predictable loop)
      const driftX = Math.sin(now * xFreq) * xAmp + Math.cos(now * xFreq * 0.45) * (xAmp * 0.25);
      const driftY = Math.cos(now * yFreq) * yAmp + Math.sin(now * yFreq * 0.65) * (yAmp * 0.25);

      // 2. Target Coordinates (Drift + Scroll Momentum)
      const targetX = driftX - (scrollY * pxX);
      const targetY = driftY - (scrollY * pxY);

      // 3. Cinematic Inertia (Lerp smoothly towards the target to create weight)
      state[i].x += (targetX - state[i].x) * INERTIA;
      state[i].y += (targetY - state[i].y) * INERTIA;

      // 4. Paint to DOM with subpixel precision
      layer.style.backgroundPosition = `${state[i].x.toFixed(3)}px calc(50% + ${state[i].y.toFixed(3)}px)`;
    });

    rafId = requestAnimationFrame(frame);
  };

  const start = () => {
    if (!rafId) rafId = requestAnimationFrame(frame);
  };

  const stop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  const onVisibilityChange = () => document.hidden ? stop() : start();

  document.addEventListener('visibilitychange', onVisibilityChange);
  start();

  return () => {
    active = false;
    stop();
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
