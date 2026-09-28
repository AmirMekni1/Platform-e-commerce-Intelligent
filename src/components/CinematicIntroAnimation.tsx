import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  Scan,
  Zap,
  Play,
  Pause,
  Compass,
  Lock,
  User,
  Crown,
  Mail,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, syncUserProfile } from '../firebase';
import { AppUser } from '../types';

interface CinematicIntroAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  requireAuth?: boolean;
  currentUser?: AppUser | null;
  onAuthSuccess?: (user: AppUser) => void;
}

type AnimationPhase = 'scan' | 'exploded' | 'morph' | 'hero';

export const CinematicIntroAnimation: React.FC<CinematicIntroAnimationProps> = ({
  isOpen,
  onClose,
  requireAuth = false,
  currentUser = null,
  onAuthSuccess,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState<number>(0);
  const [phase, setPhase] = useState<AnimationPhase>('scan');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeColorPreset, setActiveColorPreset] = useState<string>('Sidi Bou Saïd');

  // Auth panel state
  const [authMode, setAuthMode] = useState<'options' | 'email-login' | 'email-register'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Synthesized Web Audio Sound Design (Keynote Apple Soundscape)
  const playSfx = useCallback((type: 'sub' | 'laser' | 'whoosh' | 'snap' | 'chime') => {
    if (isMuted || typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;

      if (type === 'sub') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 1.4);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.4);
      } else if (type === 'laser') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.45);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'whoosh') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.65);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
      } else if (type === 'snap') {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(420, now);
        osc1.frequency.exponentialRampToValueAtTime(80, now + 0.22);
        gain1.gain.setValueAtTime(0.16, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.22);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(140, now);
        osc2.frequency.exponentialRampToValueAtTime(40, now + 0.8);
        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.8);
      } else if (type === 'chime') {
        const freqs = [523.25, 659.25, 783.99, 1046.5];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.06, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 1.8);
        });
      }
    } catch {
      // Audio autoplay handled gracefully
    }
  }, [isMuted]);

  // Handle Google Login
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await syncUserProfile(result.user);
      if (onAuthSuccess) onAuthSuccess(profile);
      onClose();
    } catch (err: any) {
      console.warn('Google popup error:', err);
      setAuthError('Erreur de connexion Google. Vous pouvez utiliser l\'accès 1-clic ci-dessous.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Fast Demo Access
  const handleFastDemoLogin = (roleType: 'vip' | 'admin') => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (roleType === 'admin') {
        const mockAdmin: AppUser = {
          uid: 'usr-admin-1',
          email: 'mekniamir09@gmail.com',
          displayName: 'Amir Mekni (Admin)',
          role: 'admin',
          subscriptionTier: 'premium',
          governorate: 'Tunis',
          phone: '+216 98 421 780',
          createdAt: '2026-09-01',
          totalSpent: 1240.0,
          orderCount: 5,
          notes: 'Super Administrateur KARTAGO',
        };
        if (onAuthSuccess) onAuthSuccess(mockAdmin);
      } else {
        const mockVIP: AppUser = {
          uid: 'usr-vip-2',
          email: 'yassine.bensalem@gmail.com',
          displayName: 'Yassine Ben Salem',
          role: 'customer',
          subscriptionTier: 'vip_club',
          governorate: 'Tunis',
          phone: '+216 98 421 780',
          createdAt: '2026-09-12',
          totalSpent: 498.0,
          orderCount: 2,
          notes: 'Membre Club VIP (-15% automatique)',
        };
        if (onAuthSuccess) onAuthSuccess(mockVIP);
      }
      onClose();
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Email Auth
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (authMode === 'email-register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const profile = await syncUserProfile(cred.user, {
          displayName: email.split('@')[0],
        });
        if (onAuthSuccess) onAuthSuccess(profile);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const profile = await syncUserProfile(cred.user);
        if (onAuthSuccess) onAuthSuccess(profile);
      }
      onClose();
    } catch (err: any) {
      setAuthError(err?.message || 'Erreur d\'authentification');
    } finally {
      setAuthLoading(false);
    }
  };

  // Main Three.js Animation Canvas Engine with Crisp White Studio Environment
  useEffect(() => {
    if (!isOpen) return;

    const container = mountRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // 1. SCENE SETUP - PURE WHITE KEYNOTE STUDIO
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Clean off-white studio
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.04);

    // 2. CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(2.8, 1.2, 5.5);

    // 3. RENDERER SETUP
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. APPLE KEYNOTE STUDIO LIGHTING (Light & Pristine)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keySpot = new THREE.SpotLight(0x0284c7, 3.5, 25, Math.PI / 4, 0.4, 1.2);
    keySpot.position.set(5, 7, 5);
    keySpot.castShadow = true;
    scene.add(keySpot);

    const rimSpot = new THREE.SpotLight(0xd97706, 3.2, 25, Math.PI / 3, 0.5, 1.5);
    rimSpot.position.set(-6, -2, -5);
    scene.add(rimSpot);

    const topLight = new THREE.DirectionalLight(0xffffff, 1.8);
    topLight.position.set(0, 8, 1);
    scene.add(topLight);

    // Light Studio Ground Grid
    const gridHelper = new THREE.GridHelper(20, 40, 0x0284c7, 0xe2e8f0);
    gridHelper.position.y = -1.2;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.35;
    scene.add(gridHelper);

    // 5. CYBER LASER SCANNING BEAM
    const laserGeo = new THREE.PlaneGeometry(5, 0.05);
    laserGeo.rotateX(Math.PI / 2);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const laserMesh = new THREE.Mesh(laserGeo, laserMat);
    laserMesh.position.y = 0;
    scene.add(laserMesh);

    // 6. 3D SNEAKER PROCEDURAL GEOMETRY
    const sneakerGroup = new THREE.Group();
    scene.add(sneakerGroup);

    // A. Rubber Outsole with Grip Cleats
    const soleShape = new THREE.Shape();
    soleShape.moveTo(-1.6, -0.4);
    soleShape.lineTo(1.4, -0.4);
    soleShape.quadraticCurveTo(1.85, -0.2, 1.85, 0.1);
    soleShape.quadraticCurveTo(1.85, 0.45, 1.4, 0.45);
    soleShape.lineTo(-1.6, 0.45);
    soleShape.quadraticCurveTo(-1.85, 0.2, -1.85, -0.2);
    soleShape.closePath();

    const soleGeo = new THREE.ExtrudeGeometry(soleShape, {
      steps: 2,
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 4,
    });
    soleGeo.rotateX(Math.PI / 2);
    soleGeo.translate(0, -0.28, 0);

    const soleMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.35,
      metalness: 0.2,
    });
    const soleMesh = new THREE.Mesh(soleGeo, soleMat);
    soleMesh.castShadow = true;
    sneakerGroup.add(soleMesh);

    // Outsole Gripping Lugs
    const treadsGroup = new THREE.Group();
    for (let i = -1.4; i <= 1.4; i += 0.22) {
      const treadGeo = new THREE.BoxGeometry(0.09, 0.06, 0.68);
      const treadMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.7,
      });
      const tread = new THREE.Mesh(treadGeo, treadMat);
      tread.position.set(i, -0.42, 0);
      treadsGroup.add(tread);
    }
    soleMesh.add(treadsGroup);

    // B. Midsole (Sculpted Cushioning Wedge)
    const midSoleGeo = new THREE.CylinderGeometry(0.55, 0.64, 0.26, 36);
    midSoleGeo.scale(2.8, 1, 1.35);
    midSoleGeo.translate(0, -0.1, 0);
    const midSoleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.05,
    });
    const midSoleMesh = new THREE.Mesh(midSoleGeo, midSoleMat);
    sneakerGroup.add(midSoleMesh);

    // Transparent Air-Sole Window with internal chambers
    const airWindowGeo = new THREE.SphereGeometry(0.2, 16, 16);
    airWindowGeo.scale(1.6, 0.42, 0.5);
    airWindowGeo.translate(-0.85, -0.1, 0.45);
    const airWindowMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      transmission: 0.92,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
      ior: 1.52,
    });
    const airWindowMesh = new THREE.Mesh(airWindowGeo, airWindowMat);
    midSoleMesh.add(airWindowMesh);

    // C. Upper Body (Cuir pleine fleur)
    const upperGeo = new THREE.SphereGeometry(1, 36, 28);
    upperGeo.scale(1.85, 0.88, 0.88);
    upperGeo.translate(0.1, 0.26, 0);

    const pos = upperGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      let y = pos.getY(i);
      if (x > 0.8) pos.setY(i, y * 0.68);
      if (x < 0.2 && x > -1.0 && y > 0.45) pos.setY(i, y * 0.32);
    }
    upperGeo.computeVertexNormals();

    const upperMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Bleu Sidi Bou
      roughness: 0.35,
      metalness: 0.25,
    });
    const upperMesh = new THREE.Mesh(upperGeo, upperMat);
    upperMesh.castShadow = true;
    sneakerGroup.add(upperMesh);

    // Wireframe overlay for laser scan
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    const wireframeMesh = new THREE.Mesh(upperGeo.clone(), wireframeMat);
    wireframeMesh.scale.multiplyScalar(1.008);
    upperMesh.add(wireframeMesh);

    // D. Méditerranée Gold Wave (KARTAGO Tanit)
    const waveGeo = new THREE.TorusGeometry(0.68, 0.08, 16, 36, Math.PI);
    waveGeo.scale(1.4, 0.38, 0.95);
    waveGeo.translate(0.12, 0.36, 0.43);
    waveGeo.rotateZ(-0.22);
    const waveMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Or Carthage
      roughness: 0.15,
      metalness: 0.95,
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    upperMesh.add(waveMesh);

    // E. Floating Laces & Tongue Assembly
    const lacesGroup = new THREE.Group();
    const laceMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.55,
      metalness: 0.05,
    });
    for (let i = 0; i < 4; i++) {
      const xPos = 0.22 - i * 0.26;
      const yPos = 0.48 + i * 0.085;
      const laceSeg = new THREE.CylinderGeometry(0.028, 0.028, 0.62, 10);
      laceSeg.rotateX(Math.PI / 2);
      const laceMesh = new THREE.Mesh(laceSeg, laceMat);
      laceMesh.position.set(xPos, yPos + 0.02, 0);
      lacesGroup.add(laceMesh);
    }
    sneakerGroup.add(lacesGroup);

    // F. Floating Studio Dust Particles
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 14;
      particlePositions[i + 1] = (Math.random() - 0.5) * 9;
      particlePositions[i + 2] = (Math.random() - 0.5) * 9;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x0284c7,
      size: 0.04,
      transparent: true,
      opacity: 0.45,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // G. Magnetic Snap Shockwave Ring
    const shockwaveGeo = new THREE.RingGeometry(0.2, 0.35, 64);
    shockwaveGeo.rotateX(Math.PI / 2);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const shockwave = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwave.position.y = -0.3;
    scene.add(shockwave);

    // Mouse drag rotation tracking
    let isDragging = false;
    let prevMouseX = 0;
    let manualRotY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      manualRotY += deltaX * 0.006;
      prevMouseX = e.clientX;
    };
    const onMouseUp = () => {
      isDragging = false;
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 7. KEYNOTE ANIMATION TIMELINE (8.5 SECONDS)
    const TOTAL_DURATION = 8500;
    startTimeRef.current = performance.now();
    playSfx('sub');

    let laserSoundPlayed = false;
    let whooshSoundPlayed = false;
    let snapSoundPlayed = false;
    let chimeSoundPlayed = false;

    const animateLoop = (time: number) => {
      animFrameIdRef.current = requestAnimationFrame(animateLoop);

      if (isPaused) return;

      const elapsed = time - startTimeRef.current;
      const t = Math.min(1, Math.max(0, elapsed / TOTAL_DURATION));
      setProgress(Math.round(t * 100));

      particles.rotation.y += 0.001;

      // SCENE 1: Scan Laser
      if (t < 0.25) {
        setPhase('scan');
        const p1 = t / 0.25;

        if (!laserSoundPlayed && p1 > 0.1) {
          playSfx('laser');
          laserSoundPlayed = true;
        }

        camera.position.x = THREE.MathUtils.lerp(1.2, 3.2, p1);
        camera.position.y = THREE.MathUtils.lerp(0.4, 1.2, p1);
        camera.position.z = THREE.MathUtils.lerp(2.2, 5.2, p1);
        camera.lookAt(0, 0.1, 0);

        sneakerGroup.rotation.y = THREE.MathUtils.lerp(-0.6, 0.3, p1) + manualRotY;
        sneakerGroup.rotation.x = THREE.MathUtils.lerp(0.25, -0.05, p1);

        laserMesh.visible = true;
        laserMesh.position.x = THREE.MathUtils.lerp(-1.8, 1.8, p1);
        laserMesh.position.y = 0.2;

        wireframeMat.opacity = Math.sin(p1 * Math.PI) * 0.55;

        soleMesh.position.y = 0;
        midSoleMesh.position.y = 0;
        upperMesh.position.y = 0;
        lacesGroup.position.y = 0;
      }
      // SCENE 2: Exploded View
      else if (t >= 0.25 && t < 0.55) {
        setPhase('exploded');
        laserMesh.visible = false;
        wireframeMat.opacity = 0;

        const p2 = (t - 0.25) / 0.3;

        if (!whooshSoundPlayed) {
          playSfx('whoosh');
          whooshSoundPlayed = true;
        }

        const orbitAngle = THREE.MathUtils.lerp(0.3, 2.5, p2);
        camera.position.x = Math.cos(orbitAngle) * 5.4;
        camera.position.z = Math.sin(orbitAngle) * 5.4;
        camera.position.y = THREE.MathUtils.lerp(1.2, 0.8, Math.sin(p2 * Math.PI));
        camera.lookAt(0, 0.2, 0);

        sneakerGroup.rotation.y += 0.006;

        const separation = Math.sin(p2 * Math.PI) * 1.1;
        upperMesh.position.y = separation * 0.85;
        lacesGroup.position.y = separation * 1.25;
        midSoleMesh.position.y = -separation * 0.35;
        soleMesh.position.y = -separation * 0.95;
      }
      // SCENE 3: Morph & Magnetic Assembly
      else if (t >= 0.55 && t < 0.75) {
        setPhase('morph');
        const p3 = (t - 0.55) / 0.2;

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, 3.6, 0.08);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.4, 0.08);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 4.8, 0.08);
        camera.lookAt(0, 0, 0);

        sneakerGroup.rotation.y += 0.012;

        if (p3 < 0.6) {
          const returnP = (0.6 - p3) / 0.6;
          upperMesh.position.y = returnP * 0.85;
          lacesGroup.position.y = returnP * 1.25;
          midSoleMesh.position.y = -returnP * 0.35;
          soleMesh.position.y = -returnP * 0.95;
        } else {
          upperMesh.position.y = 0;
          lacesGroup.position.y = 0;
          midSoleMesh.position.y = 0;
          soleMesh.position.y = 0;

          if (!snapSoundPlayed) {
            playSfx('snap');
            snapSoundPlayed = true;
            shockwave.scale.set(1, 1, 1);
            shockwaveMat.opacity = 0.9;
          }
        }

        if (shockwaveMat.opacity > 0) {
          shockwave.scale.addScalar(0.35);
          shockwaveMat.opacity -= 0.035;
        }

        if (p3 < 0.5) {
          upperMat.color.setHex(0x1d4ed8); // Sidi Bou Blue
          setActiveColorPreset('Sidi Bou Saïd');
        } else {
          upperMat.color.setHex(0xc2410c); // Carthage Terracotta
          setActiveColorPreset('Carthage Terracotta');
        }
      }
      // SCENE 4: Hero Reveal
      else {
        setPhase('hero');
        if (!chimeSoundPlayed) {
          playSfx('chime');
          chimeSoundPlayed = true;
        }

        sneakerGroup.rotation.y += 0.016;
        sneakerGroup.rotation.x = Math.sin(time * 0.001) * 0.06;

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, 3.4, 0.04);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.2, 0.04);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 4.6, 0.04);
        camera.lookAt(0, 0, 0);

        upperMat.color.setHex(0x1d4ed8);
        setActiveColorPreset('Sidi Bou Saïd');
      }

      renderer.render(scene, camera);
    };

    animFrameIdRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
    };
  }, [isOpen, isPaused, playSfx]);

  const jumpToChapter = (chapterPct: number) => {
    startTimeRef.current = performance.now() - (chapterPct / 100) * 8500;
  };

  const restartAnimation = () => {
    startTimeRef.current = performance.now();
    setProgress(0);
    setPhase('scan');
    setIsPaused(false);
    playSfx('sub');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center overflow-hidden select-none animate-in fade-in duration-300">
      {/* Three.js Real-Time 3D WebGL Canvas Engine */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing"
        title="Faites glisser la souris pour pivoter manuellement le modèle 3D"
      />

      {/* Top Header: Clean White Apple Style HUD Controls */}
      <div className="absolute top-0 inset-x-0 p-5 sm:p-6 flex flex-col gap-3.5 z-20 pointer-events-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
            <div className="flex flex-col">
              <span className="text-[11px] sm:text-xs font-mono tracking-widest text-slate-800 uppercase font-black">
                KARTAGO 3D · RÉVÉLATION KEYNOTE
              </span>
              <span className="text-[10px] text-blue-600 font-mono font-semibold">
                Rendu 3D WebGL Temps Réel 60 FPS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Play/Pause */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-slate-200 shadow-xs transition-all"
              title={isPaused ? 'Reprendre l\'animation' : 'Mettre en pause'}
            >
              {isPaused ? <Play className="w-4 h-4 text-amber-500 fill-current" /> : <Pause className="w-4 h-4" />}
            </button>

            {/* Replay */}
            <button
              onClick={restartAnimation}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-slate-200 shadow-xs transition-all"
              title="Rejouer depuis le début"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-slate-200 shadow-xs transition-all"
              title={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
            </button>

            {/* Close / Skip into Boutique (Always accessible for all visitors) */}
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black backdrop-blur-md shadow-md transition-all hover:scale-105 cursor-pointer"
            >
              <span>Entrer dans la Boutique</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Apple Style Segmented Chapter Timeline Scrubber */}
        <div className="w-full flex flex-col gap-1.5">
          <div className="w-full grid grid-cols-4 gap-2">
            {[
              { label: '01. Scan Laser', start: 0, end: 25 },
              { label: '02. Éclaté 3D', start: 25, end: 55 },
              { label: '03. Assemblage', start: 55, end: 75 },
              { label: '04. Révélation', start: 75, end: 100 },
            ].map((chap, idx) => {
              const segPct = Math.max(0, Math.min(100, ((progress - chap.start) / (chap.end - chap.start)) * 100));
              return (
                <button
                  key={idx}
                  onClick={() => jumpToChapter(chap.start)}
                  className="group text-left flex flex-col gap-1 cursor-pointer"
                >
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden group-hover:bg-slate-300 transition-colors">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-amber-500 transition-all duration-75"
                      style={{ width: `${segPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-blue-700 transition-colors hidden sm:inline font-medium">
                    {chap.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Overlay Content: REQUIRED CONNEXION GATE OR KINETIC TYPOGRAPHY */}
      {requireAuth && !currentUser ? (
        /* REQUIRED CONNEXION CARD (Cache everything else until connected!) */
        <div className="relative z-30 max-w-md w-full mx-auto px-4 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-400">
            {/* Logo & Connexion Requise Header */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-mono font-bold uppercase tracking-wider">
                <Lock className="w-3 h-3 text-amber-600" />
                <span>Connexion Requise</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                KARTAGO<span className="text-amber-500">.3D</span>
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Connectez-vous pour déverrouiller l'accès complet au catalogue de produits, au visualiseur 3D et aux tarifs préférentiels.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                {authError}
              </div>
            )}

            {/* Quick 1-Click Access Options */}
            <div className="space-y-2.5">
              {/* Google Sign-in */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-semibold py-3 px-4 rounded-xl border border-slate-300 shadow-xs hover:shadow-sm transition-all text-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuer avec Google</span>
              </button>

              {/* Instant 1-Click Demo Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleFastDemoLogin('vip')}
                  disabled={authLoading}
                  className="flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Accès VIP (1-Clic)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFastDemoLogin('admin')}
                  disabled={authLoading}
                  className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-blue-600" />
                  <span>Admin Mekni</span>
                </button>
              </div>

              {/* Standard Email Auth Dropdown */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {authMode === 'options' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setAuthMode('email-login')}
                      className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium py-1 transition-colors"
                    >
                      Se connecter avec un email et mot de passe →
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full text-center text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-2 rounded-xl transition-all"
                    >
                      🛍️ Continuer comme Visiteur (Accéder directement à la Boutique)
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleEmailSubmit} className="space-y-2.5">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Votre adresse email..."
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mot de passe..."
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                    >
                      {authLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Valider la Connexion</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('options')}
                      className="w-full text-center text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      Annuler
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="text-[11px] text-center text-slate-400 font-mono">
              ✦ KARTAGO S.A.R.L · Tunis, Tunisie
            </div>
          </div>
        </div>
      ) : (
        /* Kinetic Typography Overlays synchronized with the 3D Animation */
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center justify-between h-[70vh] pointer-events-none">
          {/* Phase 1: Holographic Laser Scan */}
          {phase === 'scan' && (
            <div className="my-auto space-y-3 animate-in fade-in zoom-in-95 duration-500">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1 text-xs text-blue-700 font-mono font-bold backdrop-blur-md shadow-xs">
                <Scan className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <span>SCAN LASER CAD 3D · PRÉCISION AU 1/100 DE MILLIMÈTRE</span>
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 uppercase leading-none">
                INGÉNIERIE.<br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-600 bg-clip-text text-transparent">
                  SIDI BOU SAÏD.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto font-medium">
                Modélisation 3D interactive · Cuir pleine fleur façonné à la main en Tunisie
              </p>
            </div>
          )}

          {/* Phase 2: Exploded Anatomy Callouts */}
          {phase === 'exploded' && (
            <div className="my-auto space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1 text-xs text-blue-700 font-mono font-bold backdrop-blur-md shadow-xs">
                <Layers className="w-3.5 h-3.5 text-blue-600 animate-spin" style={{ animationDuration: '6s' }} />
                <span>VUE ÉCLATÉE ANATOMIQUE · DÉCOMPOSITION COMPOSANTS</span>
              </div>

              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 uppercase tracking-tight">
                ANATOMIE SANS SECRET.
              </h2>

              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono font-semibold">
                <span className="bg-white border border-blue-200 text-blue-800 px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-xs">
                  1. Semelle Amorti Eva & Air-Sole Visible
                </span>
                <span className="bg-white border border-amber-200 text-amber-800 px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-xs">
                  2. Cuir Pleine Fleur de Sfax
                </span>
                <span className="bg-white border border-indigo-200 text-indigo-800 px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-xs">
                  3. Cambrion de Stabilité Torsionnelle
                </span>
              </div>
            </div>
          )}

          {/* Phase 3: Color Morph & Magnetic Assembly */}
          {phase === 'morph' && (
            <div className="my-auto space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1 text-xs text-amber-800 font-mono font-bold backdrop-blur-md shadow-xs">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>ASSEMBLAGE MAGNÉTIQUE AUTOMATISÉ</span>
              </div>

              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 uppercase tracking-tight">
                NUANCIER ACTIF : <span className="text-amber-600">{activeColorPreset}</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto font-medium">
                Impact dynamique · Verrouillage des 18 composants de la chaussure
              </p>
            </div>
          )}

          {/* Phase 4: Final Hero Reveal with Call To Action */}
          {phase === 'hero' && (
            <div className="my-auto space-y-6 animate-in fade-in zoom-in-95 duration-500 pointer-events-auto">
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1 text-xs text-amber-800 font-mono font-bold backdrop-blur-md shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>DISPONIBLE DÈS MAINTENANT · LIVRAISON 24H EN TUNISIE</span>
              </div>

              <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-slate-900 uppercase leading-none">
                KARTAGO<span className="text-amber-500">.3D</span>
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-600">
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Facturation Électronique Conforme</span>
                </span>
                <span>·</span>
                <span>Paiement à la Livraison</span>
                <span>·</span>
                <span>24 Gouvernorats</span>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-black text-xs sm:text-sm px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2.5 pointer-events-auto cursor-pointer"
                >
                  <span>DÉCOUVRIR TOUS LES PRODUITS EN 3D</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={restartAnimation}
                  className="bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm px-6 py-4 rounded-full border border-slate-300 shadow-xs hover:scale-105 transition-all flex items-center gap-2 pointer-events-auto cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Rejouer l'Animation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Footer Info */}
      <div className="absolute bottom-5 inset-x-0 px-6 flex items-center justify-between text-[11px] text-slate-500 font-mono z-20 pointer-events-none">
        <span className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">GLISSEZ LA SOURIS POUR INTERAGIR EN DIRECT</span>
        </span>
        <span className="text-slate-500 font-semibold">KARTAGO S.A.R.L · TUNISIE 2026</span>
      </div>
    </div>
  );
};
