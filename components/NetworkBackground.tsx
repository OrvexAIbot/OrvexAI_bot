import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const NetworkBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    particles: THREE.Points;
    lineSegments: THREE.LineSegments;
    frameId: number;
    geometry: THREE.BufferGeometry;
    material: THREE.PointsMaterial;
    coreGeometry: THREE.IcosahedronGeometry;
    lineMaterial: THREE.LineBasicMaterial;
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return;

    const mount = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020202, 0.002);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Particles/Nodes
    const geometry = new THREE.BufferGeometry();
    const count = 400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 15 + Math.random() * 15;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const color = new THREE.Color().setHSL(Math.random() > 0.5 ? 0.08 : 0.58, 1, 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Wireframe core
    const coreGeometry = new THREE.IcosahedronGeometry(12, 1);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.05
    });
    const wireframe = new THREE.WireframeGeometry(coreGeometry);
    const lineSegments = new THREE.LineSegments(wireframe, lineMaterial);
    scene.add(lineSegments);

    // Store refs
    sceneRef.current = {
      renderer,
      scene,
      camera,
      particles,
      lineSegments,
      frameId: 0,
      geometry,
      material,
      coreGeometry,
      lineMaterial
    };

    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return;

      sceneRef.current.frameId = requestAnimationFrame(animate);

      sceneRef.current.particles.rotation.y += 0.001;
      sceneRef.current.particles.rotation.x += 0.0005;
      sceneRef.current.lineSegments.rotation.y += 0.001;
      sceneRef.current.lineSegments.rotation.x -= 0.0005;

      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!sceneRef.current) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      sceneRef.current.camera.aspect = width / height;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.frameId);
        sceneRef.current.geometry.dispose();
        sceneRef.current.material.dispose();
        sceneRef.current.coreGeometry.dispose();
        sceneRef.current.lineMaterial.dispose();
        sceneRef.current.renderer.dispose();
        if (mount.contains(sceneRef.current.renderer.domElement)) {
          mount.removeChild(sceneRef.current.renderer.domElement);
        }
        sceneRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-0 pointer-events-none opacity-60 mix-blend-screen"
      style={{ background: 'radial-gradient(circle at center, rgba(2,2,2,0) 0%, rgba(2,2,2,1) 100%)' }}
    />
  );
};

export default NetworkBackground;
