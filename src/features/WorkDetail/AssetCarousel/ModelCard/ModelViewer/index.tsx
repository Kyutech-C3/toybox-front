import { useEffect, useRef, useState } from "react";
import {
  ACESFilmicToneMapping,
  AnimationMixer,
  Box3,
  Clock,
  Color,
  DirectionalLight,
  HemisphereLight,
  MathUtils,
  MOUSE,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Texture,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import styles from "./index.module.css";

import type {
  AnimationClip,
  BufferGeometry,
  Material,
  Object3D,
  Object3DEventMap,
  Skeleton,
} from "three";

type ModelViewerProps = {
  extension: string;
  onLoadError: () => void;
  src: string;
};

type DisposableObject = Object3D & {
  geometry?: BufferGeometry;
  material?: Material | Material[];
  skeleton?: Skeleton;
};

const VIEW_PAN_STEP = 24;
const VIEW_ROTATION_STEP = MathUtils.degToRad(15);

const disposeModel = (model: Object3D) => {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const skeletons = new Set<Skeleton>();
  const textures = new Set<Texture>();

  model.traverse((child) => {
    const disposableChild = child as DisposableObject;
    if (disposableChild.geometry) geometries.add(disposableChild.geometry);
    if (disposableChild.skeleton) skeletons.add(disposableChild.skeleton);

    const childMaterials = Array.isArray(disposableChild.material)
      ? disposableChild.material
      : disposableChild.material
        ? [disposableChild.material]
        : [];

    for (const material of childMaterials) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof Texture) textures.add(value);
      }
    }
  });

  for (const geometry of geometries) geometry.dispose();
  for (const skeleton of skeletons) skeleton.dispose();
  for (const texture of textures) {
    const image = texture.source.data;
    if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) {
      image.close();
    }
    texture.dispose();
  }
  for (const material of materials) material.dispose();
};

const frameModel = (
  model: Object3D,
  camera: PerspectiveCamera,
  controls: OrbitControls,
) => {
  const box = new Box3().setFromObject(model);
  if (box.isEmpty())
    throw new Error("The model does not contain visible geometry");

  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);
  const cameraDistance =
    (maxDimension / (2 * Math.tan(MathUtils.degToRad(camera.fov / 2)))) * 1.35;

  model.position.sub(center);
  camera.position.set(
    cameraDistance * 0.65,
    cameraDistance * 0.4,
    cameraDistance,
  );
  camera.near = Math.max(cameraDistance / 100, 0.001);
  camera.far = cameraDistance * 100;
  camera.updateProjectionMatrix();

  controls.target.set(0, 0, 0);
  controls.update();

  return cameraDistance;
};

const ModelViewer = ({ extension, onLoadError, src }: ModelViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onLoadErrorRef = useRef(onLoadError);
  const [isLoading, setIsLoading] = useState(true);

  onLoadErrorRef.current = onLoadError;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isDisposed = false;
    let animationFrameID: number | undefined;
    let model: Object3D<Object3DEventMap> | undefined;
    let mixer: AnimationMixer | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let controls: OrbitControls | undefined;
    let renderer: WebGLRenderer | undefined;
    let frameDistance: number | undefined;
    let handleKeyDown: ((event: KeyboardEvent) => void) | undefined;

    const handleError = () => {
      if (isDisposed) return;
      setIsLoading(false);
      onLoadErrorRef.current();
    };

    const handleMiddleButtonDefault = (event: MouseEvent) => {
      if (event.button === 1) event.preventDefault();
    };
    canvas.addEventListener("pointerdown", handleMiddleButtonDefault);
    canvas.addEventListener("mousedown", handleMiddleButtonDefault);
    canvas.addEventListener("auxclick", handleMiddleButtonDefault);

    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas,
        powerPreference: "high-performance",
      });
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      const scene = new Scene();
      const camera = new PerspectiveCamera(40, 1, 0.1, 1000);
      const orbitControls = new OrbitControls(camera, canvas);
      controls = orbitControls;
      orbitControls.enableDamping = false;
      orbitControls.screenSpacePanning = true;
      orbitControls.mouseButtons.LEFT = MOUSE.ROTATE;
      orbitControls.mouseButtons.MIDDLE = MOUSE.ROTATE;
      orbitControls.mouseButtons.RIGHT = MOUSE.PAN;

      const frameAll = () => {
        if (frameDistance === undefined) return;

        const direction = camera.position
          .clone()
          .sub(orbitControls.target)
          .normalize();
        orbitControls.target.set(0, 0, 0);
        camera.position.copy(direction.multiplyScalar(frameDistance));
        orbitControls.update();
      };

      handleKeyDown = (event: KeyboardEvent) => {
        let isHandled = true;

        switch (event.code) {
          case "ArrowDown":
            orbitControls.rotateUp(-VIEW_ROTATION_STEP);
            break;
          case "ArrowLeft":
            orbitControls.rotateLeft(VIEW_ROTATION_STEP);
            break;
          case "ArrowRight":
            orbitControls.rotateLeft(-VIEW_ROTATION_STEP);
            break;
          case "ArrowUp":
            orbitControls.rotateUp(VIEW_ROTATION_STEP);
            break;
          case "KeyA":
            orbitControls.pan(VIEW_PAN_STEP, 0);
            break;
          case "KeyD":
            orbitControls.pan(-VIEW_PAN_STEP, 0);
            break;
          case "KeyS":
            orbitControls.pan(0, -VIEW_PAN_STEP);
            break;
          case "KeyW":
            orbitControls.pan(0, VIEW_PAN_STEP);
            break;
          case "Home":
            frameAll();
            break;
          default:
            isHandled = false;
        }

        if (isHandled) event.preventDefault();
      };
      canvas.addEventListener("keydown", handleKeyDown);

      const rootStyles = getComputedStyle(document.documentElement);
      const getTokenColor = (tokenName: string) =>
        new Color(rootStyles.getPropertyValue(tokenName).trim());
      const hemisphereLight = new HemisphereLight(
        getTokenColor("--paper-color"),
        getTokenColor("--asset-background"),
        2.4,
      );
      const keyLight = new DirectionalLight(
        getTokenColor("--paper-color"),
        3.5,
      );
      const fillLight = new DirectionalLight(
        getTokenColor("--primary-color"),
        1.8,
      );
      keyLight.position.set(4, 6, 5);
      fillLight.position.set(-4, 2, -3);
      scene.add(hemisphereLight, keyLight, fillLight);

      const render = () => renderer?.render(scene, camera);
      orbitControls.addEventListener("change", render);

      const resize = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (width === 0 || height === 0 || !renderer) return;

        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        render();
      };
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);

      const handleModelLoaded = (
        loadedModel: Object3D,
        animations: AnimationClip[],
      ) => {
        if (isDisposed) {
          disposeModel(loadedModel);
          return;
        }

        try {
          frameDistance = frameModel(loadedModel, camera, orbitControls);
        } catch {
          disposeModel(loadedModel);
          handleError();
          return;
        }

        model = loadedModel;
        scene.add(model);
        setIsLoading(false);
        resize();

        if (animations.length === 0) {
          render();
          return;
        }

        mixer = new AnimationMixer(model);
        for (const animation of animations) mixer.clipAction(animation).play();
        const clock = new Clock();
        const animate = () => {
          if (isDisposed) return;
          mixer?.update(clock.getDelta());
          render();
          animationFrameID = window.requestAnimationFrame(animate);
        };
        animate();
      };

      const normalizedExtension = extension.replace(/^\./, "").toLowerCase();
      if (normalizedExtension === "gltf") {
        new GLTFLoader().load(
          src,
          (gltf) => handleModelLoaded(gltf.scene, gltf.animations),
          undefined,
          handleError,
        );
      } else if (normalizedExtension === "fbx") {
        new FBXLoader().load(
          src,
          (fbx) => handleModelLoaded(fbx, fbx.animations),
          undefined,
          handleError,
        );
      } else {
        handleError();
      }
    } catch {
      handleError();
    }

    return () => {
      isDisposed = true;
      if (animationFrameID !== undefined) {
        window.cancelAnimationFrame(animationFrameID);
      }
      resizeObserver?.disconnect();
      if (handleKeyDown) canvas.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("pointerdown", handleMiddleButtonDefault);
      canvas.removeEventListener("mousedown", handleMiddleButtonDefault);
      canvas.removeEventListener("auxclick", handleMiddleButtonDefault);
      controls?.dispose();
      mixer?.stopAllAction();
      if (model) disposeModel(model);
      renderer?.dispose();
    };
  }, [extension, src]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={styles["model-canvas"]}
        aria-label="3Dモデル。左または中ボタンドラッグで回転、右ボタンドラッグで移動、ホイールで拡大縮小、WASDで移動、矢印キーで視点を回転できます"
        tabIndex={0}
      />
      {isLoading && (
        <div className={styles["loading-state"]} aria-live="polite">
          <span className={styles["loading-spinner"]} aria-hidden="true" />
          <span>3Dモデルを読み込んでいます</span>
        </div>
      )}
    </>
  );
};

export default ModelViewer;
