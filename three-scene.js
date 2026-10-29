import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

(() => {
  const canvas = document.getElementById("networkCanvas");
  if (!canvas) return;

  const panel = canvas.closest(".three-panel");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power"
    });
  } catch (error) {
    panel.classList.add("three-fallback");
    canvas.setAttribute("aria-label", "Decorative network visualization. WebGL is unavailable in this browser.");
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setClearColor(0x071226, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 9.2);

  const root = new THREE.Group();
  scene.add(root);

  const globe = new THREE.Group();
  root.add(globe);

  const globeRadius = 2.15;
  const sphereGeometry = new THREE.SphereGeometry(globeRadius, 38, 28);
  const wireframe = new THREE.WireframeGeometry(sphereGeometry);
  const globeLines = new THREE.LineSegments(
    wireframe,
    new THREE.LineBasicMaterial({ color: 0x3978db, transparent: true, opacity: 0.2 })
  );
  globe.add(globeLines);

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(globeRadius * 0.985, 36, 26),
    new THREE.MeshBasicMaterial({ color: 0x0b2a54, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
  );
  globe.add(shell);

  const nodePositions = [];
  const nodeCount = 92;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < nodeCount; i++) {
    const y = 1 - (i / (nodeCount - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    nodePositions.push(new THREE.Vector3(
      Math.cos(theta) * radiusAtY * globeRadius,
      y * globeRadius,
      Math.sin(theta) * radiusAtY * globeRadius
    ));
  }

  const pointGeometry = new THREE.BufferGeometry().setFromPoints(nodePositions);
  const points = new THREE.Points(
    pointGeometry,
    new THREE.PointsMaterial({ color: 0x9ac7ff, size: 0.045, transparent: true, opacity: 0.9, sizeAttenuation: true })
  );
  globe.add(points);

  const edgePositions = [];
  nodePositions.forEach((point, i) => {
    const candidates = nodePositions
      .map((other, j) => ({ other, j, distance: point.distanceToSquared(other) }))
      .filter(item => item.j > i)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
    candidates.forEach(({ other }) => {
      edgePositions.push(point.x, point.y, point.z, other.x, other.y, other.z);
    });
  });
  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));
  globe.add(new THREE.LineSegments(
    edgeGeometry,
    new THREE.LineBasicMaterial({ color: 0x4b91f4, transparent: true, opacity: 0.19 })
  ));

  const accentNodes = [
    { index: 5, color: 0x70f0d0, scale: 1.8 },
    { index: 18, color: 0xe7b76b, scale: 1.65 },
    { index: 33, color: 0x70f0d0, scale: 1.55 },
    { index: 47, color: 0x8cb6ff, scale: 1.7 },
    { index: 65, color: 0xe7b76b, scale: 1.55 },
    { index: 80, color: 0x70f0d0, scale: 1.7 }
  ];
  accentNodes.forEach(({ index, color, scale }) => {
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.055 * scale, 12, 12),
      new THREE.MeshBasicMaterial({ color })
    );
    node.position.copy(nodePositions[index]);
    globe.add(node);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.095 * scale, 12, 12),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.11 })
    );
    halo.position.copy(nodePositions[index]);
    globe.add(halo);
  });

  const rings = [];
  [
    { radius: 2.7, tilt: 0.38, color: 0x3678e6, opacity: 0.48 },
    { radius: 2.95, tilt: -0.58, color: 0xe5b86b, opacity: 0.28 },
    { radius: 3.25, tilt: 0.95, color: 0x4e9bff, opacity: 0.2 }
  ].forEach(({ radius, tilt, color, opacity }, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.006, 5, 180),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
    );
    ring.rotation.x = Math.PI / 2 + tilt;
    ring.rotation.y = i * 0.48;
    root.add(ring);
    rings.push(ring);
  });

  const satelliteGroup = new THREE.Group();
  root.add(satelliteGroup);
  for (let i = 0; i < 34; i++) {
    const angle = (i / 34) * Math.PI * 2;
    const radius = 2.8 + (i % 4) * 0.13;
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(i % 6 === 0 ? 0.028 : 0.014, 8, 8),
      new THREE.MeshBasicMaterial({
        color: i % 5 === 0 ? 0xe5b86b : 0x6ba7ff,
        transparent: true,
        opacity: i % 5 === 0 ? 0.9 : 0.58
      })
    );
    particle.userData = { angle, radius, speed: 0.07 + (i % 5) * 0.012, phase: i * 0.3 };
    satelliteGroup.add(particle);
  }

  const starCount = 220;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 12;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    starPositions[i * 3 + 2] = -2 - Math.random() * 6;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0x7daeff, size: 0.012, transparent: true, opacity: 0.42 })
  );
  scene.add(stars);

  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let frameId = 0;
  let isVisible = true;
  let lastFrame = 0;

  function resize() {
    const width = Math.max(panel.clientWidth, 1);
    const height = Math.max(panel.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 420 ? 10 : width < 650 ? 9.6 : 9.2;
    camera.updateProjectionMatrix();
  }
  resize();

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(panel);

  canvas.addEventListener("pointermove", event => {
    const bounds = canvas.getBoundingClientRect();
    targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.7;
    targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.48;
  }, { passive: true });
  canvas.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
  }, { passive: true });

  const visibilityObserver = new IntersectionObserver(entries => {
    isVisible = entries[0].isIntersecting;
    if (isVisible && !reducedMotion) animate(performance.now());
    else if (!isVisible && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  });
  visibilityObserver.observe(panel);

  function render(time) {
    pointerX += (targetX - pointerX) * 0.035;
    pointerY += (targetY - pointerY) * 0.035;
    root.rotation.y = pointerX + Math.sin(time * 0.00012) * 0.08;
    root.rotation.x = pointerY + Math.sin(time * 0.00016) * 0.035;
    globe.rotation.y += reducedMotion ? 0 : 0.0014;
    globe.rotation.x = Math.sin(time * 0.00018) * 0.08;
    rings.forEach((ring, i) => {
      ring.rotation.z += reducedMotion ? 0 : (i % 2 ? -1 : 1) * 0.00045;
    });
    satelliteGroup.children.forEach(particle => {
      const { angle, radius, speed, phase } = particle.userData;
      const a = angle + time * 0.0001 * speed * 10;
      particle.position.set(
        Math.cos(a) * radius,
        Math.sin(a * 1.13 + phase) * 0.48,
        Math.sin(a) * radius * 0.66
      );
    });
    stars.rotation.z = reducedMotion ? 0 : time * 0.000008;
    renderer.render(scene, camera);
  }

  function animate(time) {
    if (!isVisible || frameId) return;
    frameId = requestAnimationFrame(nextTime => {
      frameId = 0;
      if (!isVisible) return;
      render(nextTime);
      animate(nextTime);
    });
  }

  if (reducedMotion) {
    render(0);
  } else {
    animate(performance.now());
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
    } else if (isVisible && !reducedMotion) {
      animate(performance.now());
    }
  });

  window.addEventListener("pagehide", () => {
    if (frameId) cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    sphereGeometry.dispose();
    wireframe.dispose();
    edgeGeometry.dispose();
    pointGeometry.dispose();
    starGeometry.dispose();
    renderer.dispose();
  }, { once: true });
})();
