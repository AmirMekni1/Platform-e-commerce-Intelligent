import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Sun,
  Eye,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { ColorOption, Product } from '../types';

interface Product3DViewerProps {
  product: Product;
  selectedColor: ColorOption;
  customParts?: {
    upperColor?: string;
    soleColor?: string;
    lacesColor?: string;
    accentColor?: string;
  };
  onColorChange?: (color: ColorOption) => void;
  className?: string;
}

export const Product3DViewer: React.FC<Product3DViewerProps> = ({
  product,
  selectedColor,
  customParts,
  onColorChange,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const meshesRef = useRef<{
    upperMesh?: THREE.Mesh;
    soleMesh?: THREE.Mesh;
    midsoleMesh?: THREE.Mesh;
    lacesMesh?: THREE.Group;
    accentMesh?: THREE.Mesh;
    detailsGroup?: THREE.Group;
    bootShaft?: THREE.Mesh;
  }>({});

  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [lightingMode, setLightingMode] = useState<'studio' | 'sunset' | 'dark'>('studio');
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<'perspective' | 'side' | 'top' | 'sole' | 'heel'>('perspective');
  const [activeTab, setActiveTab] = useState<'rotate' | 'parts' | 'lighting'>('rotate');

  // Interactive mouse drag controls
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rotationVelocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0.005 });
  const zoomLevelRef = useRef<number>(5.5);

  // Setup Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(4, 2.5, 4.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Lights setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    ambientLight.name = 'ambient';
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(5, 8, 5);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    dirLight1.shadow.camera.near = 0.5;
    dirLight1.shadow.camera.far = 25;
    dirLight1.name = 'dir1';
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x60a5fa, 1.0);
    dirLight2.position.set(-5, 4, -4);
    dirLight2.name = 'dir2';
    scene.add(dirLight2);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 0.8);
    rimLight.position.set(0, -3, -5);
    rimLight.name = 'rim';
    scene.add(rimLight);

    // Ground platform with subtle shadow receiver (Light Studio)
    const groundGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.15, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.8,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -1.3;
    ground.receiveShadow = true;
    scene.add(ground);

    // Ground reflective ring
    const ringGeo = new THREE.RingGeometry(3.65, 3.75, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xd97706, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.22;
    scene.add(ring);

    // Build the 3D model
    const modelGroup = new THREE.Group();
    modelGroupRef.current = modelGroup;
    scene.add(modelGroup);

    buildModelGeometry(modelGroup, product.model3DType, selectedColor, customParts);

    // Mouse & Touch events for rotating & zooming
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !modelGroupRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      modelGroupRef.current.rotation.y += deltaX * 0.012;
      modelGroupRef.current.rotation.x = Math.max(
        -0.8,
        Math.min(0.8, modelGroupRef.current.rotation.x + deltaY * 0.008)
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomDelta = e.deltaY * 0.005;
      zoomLevelRef.current = Math.max(2.8, Math.min(8.5, zoomLevelRef.current + zoomDelta));
      const pos = cameraRef.current.position.clone().normalize().multiplyScalar(zoomLevelRef.current);
      cameraRef.current.position.copy(pos);
    };

    // Touch events for mobile phones & tablets
    let touchStartX = 0;
    let touchStartY = 0;
    let initialPinchDist = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: touchStartX, y: touchStartY };
      } else if (e.touches.length === 2) {
        initialPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDraggingRef.current && modelGroupRef.current) {
        const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
        const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

        modelGroupRef.current.rotation.y += deltaX * 0.015;
        modelGroupRef.current.rotation.x = Math.max(
          -0.8,
          Math.min(0.8, modelGroupRef.current.rotation.x + deltaY * 0.01)
        );

        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2 && cameraRef.current) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = (initialPinchDist - dist) * 0.01;
        zoomLevelRef.current = Math.max(2.8, Math.min(8.5, zoomLevelRef.current + factor));
        const pos = cameraRef.current.position.clone().normalize().multiplyScalar(zoomLevelRef.current);
        cameraRef.current.position.copy(pos);
        initialPinchDist = dist;
      }
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });
    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (modelGroupRef.current && isRotating && !isDraggingRef.current) {
        modelGroupRef.current.rotation.y += 0.007;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
    };
  }, [product.model3DType]);

  // Handle color & material updates
  useEffect(() => {
    updateMaterials(selectedColor, customParts, isWireframe);
  }, [selectedColor, customParts, isWireframe]);

  // Handle Exploded view
  useEffect(() => {
    if (!meshesRef.current.upperMesh || !meshesRef.current.soleMesh) return;
    const upper = meshesRef.current.upperMesh;
    const laces = meshesRef.current.lacesMesh;
    const details = meshesRef.current.detailsGroup;
    const bootShaft = meshesRef.current.bootShaft;

    if (isExploded) {
      upper.position.y = 0.7;
      if (laces) laces.position.y = 0.7;
      if (details) details.position.y = 0.7;
      if (bootShaft) bootShaft.position.y = 1.1;
      meshesRef.current.soleMesh.position.y = -0.5;
      if (meshesRef.current.midsoleMesh) meshesRef.current.midsoleMesh.position.y = -0.2;
    } else {
      upper.position.y = 0;
      if (laces) laces.position.y = 0;
      if (details) details.position.y = 0;
      if (bootShaft) bootShaft.position.y = 0;
      meshesRef.current.soleMesh.position.y = 0;
      if (meshesRef.current.midsoleMesh) meshesRef.current.midsoleMesh.position.y = 0;
    }
  }, [isExploded]);

  // Handle Lighting Modes
  useEffect(() => {
    if (!sceneRef.current) return;
    const ambient = sceneRef.current.getObjectByName('ambient') as THREE.AmbientLight;
    const dir1 = sceneRef.current.getObjectByName('dir1') as THREE.DirectionalLight;
    const dir2 = sceneRef.current.getObjectByName('dir2') as THREE.DirectionalLight;
    const rim = sceneRef.current.getObjectByName('rim') as THREE.DirectionalLight;

    if (lightingMode === 'studio') {
      if (ambient) ambient.color.setHex(0xffffff), (ambient.intensity = 1.2);
      if (dir1) dir1.color.setHex(0xffffff), (dir1.intensity = 2.0);
      if (dir2) dir2.color.setHex(0x60a5fa), (dir2.intensity = 1.0);
      if (rim) rim.color.setHex(0xf59e0b), (rim.intensity = 0.8);
    } else if (lightingMode === 'sunset') {
      if (ambient) ambient.color.setHex(0xffedd5), (ambient.intensity = 1.0);
      if (dir1) dir1.color.setHex(0xf97316), (dir1.intensity = 2.5);
      if (dir2) dir2.color.setHex(0xec4899), (dir2.intensity = 1.2);
      if (rim) rim.color.setHex(0xfbbf24), (rim.intensity = 1.5);
    } else if (lightingMode === 'dark') {
      if (ambient) ambient.color.setHex(0x1e293b), (ambient.intensity = 0.4);
      if (dir1) dir1.color.setHex(0x06b6d4), (dir1.intensity = 2.2);
      if (dir2) dir2.color.setHex(0x8b5cf6), (dir2.intensity = 2.0);
      if (rim) rim.color.setHex(0x10b981), (rim.intensity = 1.2);
    }
  }, [lightingMode]);

  // Camera presets
  const applyCameraPreset = (preset: 'perspective' | 'side' | 'top' | 'sole' | 'heel') => {
    setActivePreset(preset);
    if (!cameraRef.current || !modelGroupRef.current) return;
    const dist = zoomLevelRef.current;

    modelGroupRef.current.rotation.set(0, 0, 0);

    switch (preset) {
      case 'perspective':
        cameraRef.current.position.set(dist * 0.7, dist * 0.45, dist * 0.7);
        break;
      case 'side':
        cameraRef.current.position.set(dist, 0.1, 0);
        break;
      case 'top':
        cameraRef.current.position.set(0.01, dist, 0.01);
        break;
      case 'sole':
        cameraRef.current.position.set(0.01, -dist, 0.01);
        break;
      case 'heel':
        cameraRef.current.position.set(-dist, 0.3, 0);
        break;
    }
    cameraRef.current.lookAt(0, 0, 0);
  };

  // Helper to build 3D mesh based on product type
  const buildModelGeometry = (
    group: THREE.Group,
    type: Product['model3DType'],
    color: ColorOption,
    custom?: Product3DViewerProps['customParts']
  ) => {
    group.clear();
    meshesRef.current = {};

    const primaryColor = custom?.upperColor || color.hex;
    const soleColor = custom?.soleColor || color.soleHex || '#f8fafc';
    const accentColor = custom?.accentColor || color.accentHex || '#0284c7';
    const lacesColor = custom?.lacesColor || color.lacesHex || '#ffffff';

    if (type.startsWith('sneaker') || type === 'trainer-speed' || type === 'boot-desert' || (!['hoodie', 'duffle', 'watch'].includes(type))) {
      // 1. OUTSOLE (Base Rubber)
      const soleShape = new THREE.Shape();
      soleShape.moveTo(-1.6, -0.4);
      soleShape.lineTo(1.4, -0.4);
      soleShape.quadraticCurveTo(1.8, -0.2, 1.8, 0.1);
      soleShape.quadraticCurveTo(1.8, 0.4, 1.4, 0.4);
      soleShape.lineTo(-1.6, 0.4);
      soleShape.quadraticCurveTo(-1.8, 0.2, -1.8, -0.2);
      soleShape.closePath();

      const extrudeSettings = {
        steps: 2,
        depth: 0.25,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize: 0.06,
        bevelSegments: 4,
      };

      const soleGeo = new THREE.ExtrudeGeometry(soleShape, extrudeSettings);
      soleGeo.rotateX(Math.PI / 2);
      soleGeo.translate(0, -0.25, 0);

      const soleMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(soleColor),
        roughness: 0.7,
        metalness: 0.1,
      });

      const soleMesh = new THREE.Mesh(soleGeo, soleMat);
      soleMesh.castShadow = true;
      soleMesh.receiveShadow = true;
      group.add(soleMesh);
      meshesRef.current.soleMesh = soleMesh;

      // 1.b Sole Treads pattern (Grip ridges underneath)
      const treadGroup = new THREE.Group();
      for (let i = -1.4; i <= 1.4; i += 0.25) {
        const treadGeo = new THREE.BoxGeometry(0.1, 0.06, 0.65);
        const treadMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(accentColor),
          roughness: 0.9,
        });
        const tread = new THREE.Mesh(treadGeo, treadMat);
        tread.position.set(i, -0.38, 0);
        treadGroup.add(tread);
      }
      soleMesh.add(treadGroup);

      // 2. MIDSOLE (Cushion layer)
      const midSoleGeo = new THREE.CylinderGeometry(0.55, 0.62, 0.22, 32);
      midSoleGeo.scale(2.8, 1, 1.3);
      midSoleGeo.translate(0, -0.1, 0);
      const midSoleMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(soleColor).multiplyScalar(0.95),
        roughness: 0.5,
      });
      const midSoleMesh = new THREE.Mesh(midSoleGeo, midSoleMat);
      midSoleMesh.castShadow = true;
      group.add(midSoleMesh);
      meshesRef.current.midsoleMesh = midSoleMesh;

      // 3. UPPER (Shoe Body)
      // Custom curved geometry mimicking sneaker anatomy
      const upperGeo = new THREE.SphereGeometry(1, 32, 24);
      upperGeo.scale(1.8, 0.85, 0.85);
      upperGeo.translate(0.1, 0.25, 0);

      // Flatten bottom of upper to rest on sole
      const pos = upperGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i);
        let x = pos.getX(i);
        let z = pos.getZ(i);

        // Toe taper
        if (x > 0.8) {
          pos.setY(i, y * 0.7);
        }
        // Ankle opening cutout
        if (x < 0.2 && x > -1.0 && y > 0.5) {
          pos.setY(i, y * 0.35);
        }
      }
      upperGeo.computeVertexNormals();

      const upperMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(primaryColor),
        roughness: type === 'boot-desert' ? 0.85 : 0.45,
        metalness: type === 'trainer-speed' ? 0.05 : 0.15,
      });
      const upperMesh = new THREE.Mesh(upperGeo, upperMat);
      upperMesh.castShadow = true;
      group.add(upperMesh);
      meshesRef.current.upperMesh = upperMesh;

      // 4. ACCENT STRIPE / WAVE
      const accentGeo = new THREE.TorusGeometry(0.6, 0.08, 16, 32, Math.PI);
      accentGeo.scale(1.4, 0.4, 0.95);
      accentGeo.translate(0.1, 0.35, 0.4);
      accentGeo.rotateZ(-0.2);

      const accentMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(accentColor),
        roughness: 0.3,
        metalness: 0.3,
      });
      const accentMesh = new THREE.Mesh(accentGeo, accentMat);
      accentMesh.castShadow = true;

      // Mirror accent on other side
      const accentMesh2 = accentMesh.clone();
      accentMesh2.position.z = -0.8;
      accentMesh.add(accentMesh2);

      group.add(accentMesh);
      meshesRef.current.accentMesh = accentMesh;

      // 5. DETAILS: Laces & Eyelets
      const lacesGroup = new THREE.Group();
      const laceMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(lacesColor),
        roughness: 0.6,
      });

      for (let i = 0; i < 4; i++) {
        const xPos = 0.2 - i * 0.25;
        const yPos = 0.48 + i * 0.08;

        // Eyelets
        const eyeletGeo = new THREE.RingGeometry(0.04, 0.08, 16);
        const eyeletMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
        const eyeletL = new THREE.Mesh(eyeletGeo, eyeletMat);
        eyeletL.position.set(xPos, yPos, 0.28);
        eyeletL.rotation.y = Math.PI / 2;
        lacesGroup.add(eyeletL);

        const eyeletR = eyeletL.clone();
        eyeletR.position.z = -0.28;
        lacesGroup.add(eyeletR);

        // Criss-cross lace segment
        const laceSegmentGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.58, 8);
        laceSegmentGeo.rotateX(Math.PI / 2);
        const laceMesh = new THREE.Mesh(laceSegmentGeo, laceMat);
        laceMesh.position.set(xPos, yPos + 0.02, 0);
        lacesGroup.add(laceMesh);
      }

      // Sneaker tongue
      const tongueGeo = new THREE.BoxGeometry(0.65, 0.85, 0.35);
      tongueGeo.rotateZ(0.4);
      tongueGeo.translate(-0.15, 0.6, 0);
      const tongueMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(primaryColor).multiplyScalar(0.9),
        roughness: 0.6,
      });
      const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
      lacesGroup.add(tongueMesh);

      group.add(lacesGroup);
      meshesRef.current.lacesMesh = lacesGroup;

      // 6. Special High-Top or Desert Boot Shaft
      if (type === 'sneaker-hightop' || type === 'boot-desert') {
        const shaftGeo = new THREE.CylinderGeometry(0.45, 0.52, 0.8, 32);
        shaftGeo.translate(-0.4, 0.85, 0);
        const shaftMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(primaryColor),
          roughness: 0.6,
        });
        const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
        shaftMesh.castShadow = true;
        group.add(shaftMesh);
        meshesRef.current.bootShaft = shaftMesh;
      }
    } else if (type === 'hoodie') {
      // 3D Streetwear Hoodie representation
      const bodyGeo = new THREE.CylinderGeometry(0.85, 0.95, 1.6, 32);
      bodyGeo.scale(1.2, 1, 0.65);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(primaryColor),
        roughness: 0.9,
      });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 0.2;
      group.add(bodyMesh);
      meshesRef.current.upperMesh = bodyMesh;

      // Kangaroo pocket
      const pocketGeo = new THREE.BoxGeometry(0.8, 0.45, 0.15);
      pocketGeo.translate(0, -0.2, 0.4);
      const pocketMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(primaryColor).multiplyScalar(0.9),
        roughness: 0.9,
      });
      const pocketMesh = new THREE.Mesh(pocketGeo, pocketMat);
      bodyMesh.add(pocketMesh);

      // Hood shape
      const hoodGeo = new THREE.SphereGeometry(0.55, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.7);
      hoodGeo.scale(1, 1.1, 0.9);
      hoodGeo.translate(0, 0.9, -0.1);
      const hoodMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(accentColor),
        roughness: 0.85,
      });
      const hoodMesh = new THREE.Mesh(hoodGeo, hoodMat);
      group.add(hoodMesh);

      // Sleeves
      const sleeveLGeo = new THREE.CylinderGeometry(0.25, 0.2, 1.2, 16);
      sleeveLGeo.rotateZ(Math.PI / 4.5);
      sleeveLGeo.translate(-1.1, 0.2, 0);
      const sleeveRGeo = sleeveLGeo.clone();
      sleeveRGeo.rotateZ(-Math.PI / 2.25);
      sleeveRGeo.translate(2.2, 0, 0);

      const sleeveL = new THREE.Mesh(sleeveLGeo, bodyMat);
      const sleeveR = new THREE.Mesh(sleeveRGeo, bodyMat);
      group.add(sleeveL);
      group.add(sleeveR);
    } else if (type === 'duffle') {
      // 3D Leather Travel Bag
      const barrelGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.9, 32);
      barrelGeo.rotateZ(Math.PI / 2);
      const bagMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(primaryColor),
        roughness: 0.5,
        metalness: 0.15,
      });
      const bagMesh = new THREE.Mesh(barrelGeo, bagMat);
      bagMesh.castShadow = true;
      group.add(bagMesh);
      meshesRef.current.upperMesh = bagMesh;

      // Brass zipper line
      const zipGeo = new THREE.BoxGeometry(1.7, 0.05, 0.05);
      zipGeo.translate(0, 0.65, 0);
      const zipMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
      const zipMesh = new THREE.Mesh(zipGeo, zipMat);
      bagMesh.add(zipMesh);

      // Leather Handles
      const handleGeo = new THREE.TorusGeometry(0.4, 0.06, 16, 32, Math.PI);
      handleGeo.rotateX(Math.PI / 2);
      handleGeo.translate(0, 0.65, 0.3);
      const handleMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(soleColor),
        roughness: 0.6,
      });
      const handle1 = new THREE.Mesh(handleGeo, handleMat);
      const handle2 = handle1.clone();
      handle2.position.z = -0.6;
      group.add(handle1);
      group.add(handle2);
    } else if (type === 'watch') {
      // 3D Luxury Watch
      const caseGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.16, 48);
      const caseMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.1 });
      const caseMesh = new THREE.Mesh(caseGeo, caseMat);
      caseMesh.castShadow = true;
      group.add(caseMesh);
      meshesRef.current.upperMesh = caseMesh;

      // Sapphire Dial Face
      const dialGeo = new THREE.CircleGeometry(0.72, 48);
      dialGeo.rotateX(-Math.PI / 2);
      dialGeo.translate(0, 0.09, 0);
      const dialMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(primaryColor),
        roughness: 0.1,
        metalness: 0.3,
      });
      const dialMesh = new THREE.Mesh(dialGeo, dialMat);
      caseMesh.add(dialMesh);

      // Hour markers
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        const markerGeo = new THREE.BoxGeometry(0.04, 0.02, 0.12);
        const markerMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(Math.sin(angle) * 0.58, 0.1, Math.cos(angle) * 0.58);
        marker.rotation.y = angle;
        caseMesh.add(marker);
      }

      // Leather Straps
      const strapGeo = new THREE.BoxGeometry(0.7, 0.08, 1.2);
      strapGeo.translate(0, -0.02, 1.1);
      const strapMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(soleColor),
        roughness: 0.7,
      });
      const strap1 = new THREE.Mesh(strapGeo, strapMat);
      const strap2 = strap1.clone();
      strap2.position.z = -2.2;
      caseMesh.add(strap1);
      caseMesh.add(strap2);
    }
  };

  // Helper to dynamically update materials
  const updateMaterials = (
    color: ColorOption,
    custom?: Product3DViewerProps['customParts'],
    wireframe = false
  ) => {
    const primary = custom?.upperColor || color.hex;
    const sole = custom?.soleColor || color.soleHex || '#f8fafc';
    const accent = custom?.accentColor || color.accentHex || '#0284c7';
    const laces = custom?.lacesColor || color.lacesHex || '#ffffff';

    if (meshesRef.current.upperMesh) {
      const mat = meshesRef.current.upperMesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.color.set(primary);
        mat.wireframe = wireframe;
      }
    }
    if (meshesRef.current.soleMesh) {
      const mat = meshesRef.current.soleMesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.color.set(sole);
        mat.wireframe = wireframe;
      }
    }
    if (meshesRef.current.accentMesh) {
      const mat = meshesRef.current.accentMesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.color.set(accent);
        mat.wireframe = wireframe;
      }
    }
    if (meshesRef.current.bootShaft) {
      const mat = meshesRef.current.bootShaft.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.color.set(primary);
        mat.wireframe = wireframe;
      }
    }
    if (meshesRef.current.lacesMesh) {
      meshesRef.current.lacesMesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.roughness === 0.6) {
            mat.color.set(laces);
            mat.wireframe = wireframe;
          }
        }
      });
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current) return;
    const factor = direction === 'in' ? -0.8 : 0.8;
    zoomLevelRef.current = Math.max(2.8, Math.min(8.5, zoomLevelRef.current + factor));
    const pos = cameraRef.current.position.clone().normalize().multiplyScalar(zoomLevelRef.current);
    cameraRef.current.position.copy(pos);
  };

  return (
    <div className={`relative flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md ${className}`}>
      {/* Top Bar with badge, 360 Indicator, and quick actions */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-amber-700 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>Studio 3D Interactif 360°</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-600 shadow-xs">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Glissez pour pivoter · Molette pour zoomer</span>
          </div>
        </div>

        {/* Lighting & Wireframe controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-1 shadow-xs">
          <button
            onClick={() => setLightingMode((prev) => (prev === 'studio' ? 'sunset' : prev === 'sunset' ? 'dark' : 'studio'))}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title={`Éclairage: ${lightingMode === 'studio' ? 'Studio Blanc' : lightingMode === 'sunset' ? 'Coucher de soleil' : 'Dark Cyber'}`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
          </button>
          <button
            onClick={() => setIsWireframe((prev) => !prev)}
            className={`p-1.5 rounded-lg transition-colors ${
              isWireframe ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Mode Filaire / Wireframe 3D"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsRotating((prev) => !prev)}
            className={`p-1.5 rounded-lg transition-colors ${
              isRotating ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title={isRotating ? 'Pause rotation auto' : 'Démarrer rotation 360°'}
          >
            <RotateCcw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas */}
      <div
        ref={mountRef}
        className="w-full h-[380px] sm:h-[460px] cursor-grab active:cursor-grabbing flex items-center justify-center relative touch-none select-none bg-radial from-slate-50 to-slate-100/60"
      />

      {/* Camera Angle Presets Bar */}
      <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-1.5 shadow-md max-w-[94%] overflow-x-auto">
        <button
          onClick={() => applyCameraPreset('perspective')}
          className={`px-3 py-1 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            activePreset === 'perspective' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Perspective
        </button>
        <button
          onClick={() => applyCameraPreset('side')}
          className={`px-3 py-1 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            activePreset === 'side' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Profil 90°
        </button>
        <button
          onClick={() => applyCameraPreset('top')}
          className={`px-3 py-1 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            activePreset === 'top' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Haut
        </button>
        <button
          onClick={() => applyCameraPreset('sole')}
          className={`px-3 py-1 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            activePreset === 'sole' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Semelle
        </button>
        <button
          onClick={() => applyCameraPreset('heel')}
          className={`px-3 py-1 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            activePreset === 'heel' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Talon
        </button>

        <div className="w-[1px] h-4 bg-slate-200 mx-1" />

        {/* Exploded View Toggle for Shoes */}
        {product.category === 'shoes' && (
          <button
            onClick={() => setIsExploded((prev) => !prev)}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isExploded
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
            }`}
            title="Vue éclatée pour voir l'anatomie de la chaussure et de la semelle"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Vue Éclatée</span>
          </button>
        )}
      </div>

      {/* Floating Zoom Controls */}
      <div className="absolute right-3 bottom-24 z-10 hidden sm:flex flex-col gap-1 bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-1 shadow-xs">
        <button
          onClick={() => handleZoom('in')}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          title="Zoomer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          title="Dézoomer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Color Palette Bar */}
      <div className="bg-slate-50 border-t border-slate-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
            Coloris 3D:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {product.colors.map((color) => {
              const isSelected = selectedColor.name === color.name;
              return (
                <button
                  key={color.name}
                  onClick={() => onColorChange && onColorChange(color)}
                  className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs flex-shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span>{color.name}</span>
                  {color.labelDerja && (
                    <span className="hidden md:inline text-[10px] text-amber-700 font-medium">
                      ({color.labelDerja})
                    </span>
                  )}
                  {isSelected && <Check className="w-3 h-3 text-amber-600 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>Rendu WebGL Haute Précision</span>
        </div>
      </div>
    </div>
  );
};
