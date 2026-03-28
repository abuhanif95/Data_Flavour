import React, { useEffect, useRef } from "react";
import * as THREE from "three";

function AnimatedSphere({ isDarkMode }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const sphereRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(isDarkMode ? 0x000000 : 0xf8fafc);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = 2.2;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight,
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create wireframe sphere geometry - SMALLER
    const geometry = new THREE.IcosahedronGeometry(1.0, 4);
    const wireframeGeometry = new THREE.WireframeGeometry(geometry);

    const lineMaterial = new THREE.LineBasicMaterial({
      color: isDarkMode ? 0x00d9ff : 0x0891b2,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
    });

    const wireframe = new THREE.LineSegments(wireframeGeometry, lineMaterial);
    scene.add(wireframe);
    sphereRef.current = wireframe;

    // Add a glow effect with points
    const pointGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(
      wireframeGeometry.attributes.position.array,
    );
    pointGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );

    const pointMaterial = new THREE.PointsMaterial({
      color: isDarkMode ? 0x06b6d4 : 0x0891b2,
      size: 0.04,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(pointGeometry, pointMaterial);
    scene.add(points);

    // Add some ambient light
    const light = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(light);

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // Simple continuous spin - no mouse interaction
      if (sphereRef.current) {
        sphereRef.current.rotation.x += 0.003;
        sphereRef.current.rotation.y += 0.005;
      }

      if (points) {
        points.rotation.copy(sphereRef.current.rotation);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (
        containerRef.current &&
        renderer.domElement.parentElement === containerRef.current
      ) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      wireframeGeometry.dispose();
      lineMaterial.dispose();
      pointMaterial.dispose();
      renderer.dispose();
    };
  }, [isDarkMode]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: "500px" }}
    />
  );
}

export default AnimatedSphere;
