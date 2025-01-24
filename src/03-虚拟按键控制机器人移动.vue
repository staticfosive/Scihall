<script setup>
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import * as CANNON from "cannon-es";
import { PointerLockControlsCannon } from "./threeMesh/PointerLockControlsCannon.js";
import nipplejs from "nipplejs";
import { ColladaLoader } from "three/addons/loaders/ColladaLoader.js";
// 加载hdrloader
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { Reflector } from "./mesh/Reflector.js";

import {
  color,
  float,
  vec2,
  texture,
  normalMap,
  uv,
  MeshPhysicalNodeMaterial,
  EnvironmentNode,
} from "three/nodes";

import { nodeFrame } from "three/addons/renderers/webgl/nodes/WebGLNodes.js";

import { HDRCubeTextureLoader } from "three/addons/loaders/HDRCubeTextureLoader.js";

import { FlakesTexture } from "three/addons/textures/FlakesTexture.js";
import { render } from "vue";

// 场景
const scene = new THREE.Scene();
// 相机
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(0, 2, 8);
camera.lookAt(0, 0, -2);

// 辅助坐标轴
// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

// 渲染器
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
document.body.appendChild(renderer.domElement);

// 加载纹理
const textureLoader = new THREE.TextureLoader();
// 加载环境纹理
let envMap = textureLoader.load("./textures/0006_4k.jpg");
envMap.mapping = THREE.EquirectangularReflectionMapping;
// 设置为环境纹理
scene.background = envMap;
scene.environment = envMap;

// let rgbeLoader = new RGBELoader();
// rgbeLoader.load("./textures/0006_4k.hdr", (envMap) => {
//   envMap.mapping = THREE.EquirectangularReflectionMapping;
//   scene.background = envMap;
//   scene.environment = envMap;
// });

// 设置环境光
let ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// // 设置平行光
// let directionalLight = new THREE.DirectionalLight(0xffffff, 2);
// directionalLight.position.set(0, 20, 20);
// scene.add(directionalLight);
// const spotlight = new THREE.SpotLight(0xffffff, 0.9, 0, Math.PI / 4, 1);
// spotlight.position.set(10, 30, 20);
// spotlight.target.position.set(0, 0, 0);

// spotlight.castShadow = true;

// spotlight.shadow.camera.near = 10;
// spotlight.shadow.camera.far = 100;
// spotlight.shadow.camera.fov = 30;

// // spotlight.shadow.bias = -0.0001
// spotlight.shadow.mapSize.width = 2048;
// spotlight.shadow.mapSize.height = 2048;

// scene.add(spotlight);
// 控制器
let controls;
// controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
let clock = new THREE.Clock();
// 渲染
requestAnimationFrame(function animate() {
  let delta = clock.getDelta();
  world.step(1 / 60, delta, 3);
  sphereMesh.position.copy(sphereBody.position);

  // sphereMesh.quaternion.copy(sphereBody.quaternion);
  // controls.update(delta);
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
});

// 初始化cannon
let world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// 初始化物理材质
world.defaultContactMaterial.contactEquationStiffness = 1e9;
world.defaultContactMaterial.contactEquationRelaxation = 4;

const solver = new CANNON.GSSolver();
solver.iterations = 7;
solver.tolerance = 0.1;

world.solver = new CANNON.SplitSolver(solver);

// 创建物理材质
const physicsMaterial = new CANNON.Material("physics");
const physics_physics = new CANNON.ContactMaterial(
  physicsMaterial,
  physicsMaterial,
  {
    // 当摩擦力为0时，物体不会滑动
    friction: 0,
    // 弹性系数
    restitution: 0.3,
  }
);
// 将物理材质添加到世界中
world.addContactMaterial(physics_physics);

// 创建一个球体
const radius = 0.8;
const sphereShape = new CANNON.Sphere(radius);
const sphereBody = new CANNON.Body({
  mass: 5,
  material: physicsMaterial,
});
sphereBody.addShape(sphereShape);
sphereBody.linearDamping = 0.9;
sphereBody.position.set(0, 5, 0);
world.addBody(sphereBody);

// 创建threejs的球体
const sphereGeometry = new THREE.SphereGeometry(radius, 8, 8);
const sphereMaterial = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  wireframe: true,
});
const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphereMesh);

// 创建一个平面
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({
  mass: 0,
  material: physicsMaterial,
});
groundBody.addShape(groundShape);
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(groundBody);

let gltfLoader = new GLTFLoader();
let dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./draco/");
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.load("./model/roomModel/ground03.glb", (gltf) => {
  let model = gltf.scene;
  scene.add(model);
});

function initPointerLock() {
  controls = new PointerLockControlsCannon(camera, sphereBody);
  scene.add(controls.getObject());

  renderer.domElement.addEventListener("click", () => {
    controls.lock();
  });
  controls.addEventListener("lock", () => {
    console.log("lock");
    controls.enabled = true;
  });
  controls.addEventListener("unlock", () => {
    console.log("unlock");
    controls.enabled = false;
  });
}

let robot;
gltfLoader.load("./model/robot.glb", (gltf) => {
  robot = gltf.scene;
  robot.children[0].position.set(0, -0.8, 0);
  robot.children[0].rotation.set(0, Math.PI, 0);
  // robot.add(camera);
  sphereMesh.add(robot);
  sphereMesh.add(camera);
});

// 虚拟按键使用
var manager = nipplejs.create({});
let isMove = false;
manager.on("start", function (evt, data) {
  isMove = true;
  console.log("start");
});
manager.on("end", function (evt, data) {
  isMove = false;
  console.log("end");
});
manager.on("move", function (evt, data) {
  if (isMove) {
    console.log(data);
    const vector = data.vector;
    const angle = data.angle.radian;
    sphereBody.velocity.set(
      vector.x * 3 * data.force,
      sphereBody.velocity.y,
      -vector.y * 3 * data.force
    );
    let target = angle - Math.PI / 2;
    robot &&
      (robot.rotation.y =
        robot.rotation.y + (target - robot.rotation.y) * 0.1 * data.force);
  }
});
</script>

<template>
  <div></div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

canvas {
  width: 100vw;
  height: 100vh;
  display: block;
  position: fixed;
  top: 0;
  left: 0;
}
</style>
