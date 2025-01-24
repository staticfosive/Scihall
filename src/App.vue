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
  mx_noise_vec3,
  EnvironmentNode,
} from 'three/examples/jsm/nodes/Nodes.js';


// import { nodeFrame } from "three/addons/renderers/webgl/nodes/WebGLNodes.js";

import { HDRCubeTextureLoader } from "three/addons/loaders/HDRCubeTextureLoader.js";

import { FlakesTexture } from 'three/examples/jsm/textures/FlakesTexture.js';


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
/* controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; */
let clock = new THREE.Clock();
// 渲染
requestAnimationFrame(function animate() {
  let delta = clock.getDelta();
  world.step(1 / 60, delta, 3);
  sphereMesh.position.copy(sphereBody.position);
  // sphereMesh.quaternion.copy(sphereBody.quaternion);
  robot && robot.quaternion.copy(controls.getObject().quaternion);
  controls.update(delta);
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
});

//初始化cannon 物理世界
let world = new CANNON.World();
//重力
world.gravity.set(0, -9.82, 0);

//初始化物理材质
world.defaultContactMaterial.contactEquationStiffness = 1e8;
world.defaultContactMaterial.contactEquationRelaxation = 4;


const solver = new CANNON.GSSolver();
solver.iterations = 7;//迭代7次计算达到效果最佳
solver.tolerance = 0.1;//容差值

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

//加载模型
let gltfLoader=new GLTFLoader();
let dracoLoader=new DRACOLoader();
dracoLoader.setDecoderPath("./draco/")
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.load('./model/roomModel/ground03.glb',(gltf)=>{
  let mdoel=gltf.scene;
  scene.add(mdoel);
});

//将轨道控制器换成第一人称控制器
function initPointerLock() {
  controls=new PointerLockControlsCannon(camera,sphereBody,world);
  scene.add(controls.getObject());

  renderer.domElement.addEventListener("click", function () {
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
initPointerLock();

let robot;
gltfLoader.load('./model/robot.glb',(gltf)=>{
  robot=gltf.scene;
  robot.children[0].position.set(0, -0.8, 0);
  robot.children[0].rotation.set(0, Math.PI, 0);
  sphereMesh.add(robot);
  //第一人称跟着机器人
  //  robot.add(camera);
   /* sphereMesh是threejs的，spherebody是canno的 */
   //第三人称跟着机器人，摄像头跟着机器人移动
  // sphereMesh.add(camera);
})
/* //虚拟按键使用
var manager = nipplejs.create({});
let isMove = false;
manager.on("start", function (evt, data) {
  isMove = true;
  // console.log("start");
});
manager.on("end", function (evt, data) {
  isMove = false;
  // console.log("end");
});
manager.on("move", function (evt, data) {
  if (isMove) {
    // console.log(data);
    const vector = data.vector;
    const angle = data.angle.radian;
    //控制机器人前后走
    sphereBody.velocity.set(
      vector.x * 3 * data.force,
      sphereBody.velocity.y,
      -vector.y * 3 * data.force
    );
    //使机器人的旋转看起来更好
    let target = angle - Math.PI / 2;
    robot &&
      (robot.rotation.y =
        robot.rotation.y + (target - robot.rotation.y) * 0.1 * data.force);
  }
});
 */
// 根据载入的立方体模型，创建一个防撞墙

gltfLoader.load("./model/roomModel/collisions.glb", (gltf) => {
  let model = gltf.scene;
  model.traverse((child) => {
    if (child.isMesh) {
      // let geometry = child.geometry;
      // let material = child.material;
      // let mesh = new THREE.Mesh(geometry, material);
      // mesh.position.copy(child.position);
      // mesh.rotation.copy(child.rotation);
      // mesh.scale.copy(child.scale);
      // scene.add(mesh);
      // console.log(mesh);
      // console.log(child.scale);
      // 根据缩放比例，修改shape的大小
      let shape = new CANNON.Box(
        new CANNON.Vec3(child.scale.x, child.scale.y, child.scale.z)
      );
      // console.log(shape);
      let body = new CANNON.Body({
        mass: 0,
        material: physicsMaterial,
      });
      body.addShape(shape);
      body.position.copy(child.position);
      body.quaternion.copy(child.quaternion);
      world.addBody(body);
    }
  });
});

//加载场景
// 柱子
gltfLoader.load("./model/roomModel/ground.glb", (gltf) => {
  // 珠光漆材质
  /* let flakesTexture = new FlakesTexture();
  let canvasTexture = new THREE.CanvasTexture(flakesTexture);
  canvasTexture.anisotropy = 16;
  canvasTexture.wrapS = THREE.RepeatWrapping;
  canvasTexture.wrapT = THREE.RepeatWrapping;

  let nodeMaterial = new THREE.StandardNodeMaterial();
  // nodeMaterial.colorNode = texture(canvasTexture);
  nodeMaterial.colorNode = color(0xeeeeff);
  nodeMaterial.normalNode = normalMap(
    texture(canvasTexture, uv().mul(2.5, 1.5)),
    0.15
  );
  nodeMaterial.metalnessNode = float(0.9);
  nodeMaterial.roughnessNode = float(0.5);
  nodeMaterial.clearcoatNode = float(1);
  nodeMaterial.clearcoatRoughnessNode = float(0.01);
  let model = gltf.scene;
  model.traverse((child) => {
    if (child.isMesh) {
      // console.log(child);
      child.material = nodeMaterial;
    }
  });
  scene.add(model); */
});
/* let video = document.createElement("video");
video.src = "./textures/DigitalTwin.mp4";
video.loop = true;
video.muted = true;
video.play();
let videoTexture = new THREE.VideoTexture(video); */
//主舞台
gltfLoader.load("./model/roomModel/stage.glb", (gltf) => {
  let model = gltf.scene;
 scene.add(model);
});

// 展板
gltfLoader.load("./model/roomModel/board.glb", (gltf) => {
  let model = gltf.scene;
  scene.add(model);
});

// 副舞台
gltfLoader.load("./model/roomModel/stage02.glb", (gltf) => {
  let model = gltf.scene;
  scene.add(model);
});

// 添加灯光
gltfLoader.load("./model/roomModel/light.glb", (gltf) => {
  let model = gltf.scene;
  model.traverse((child) => {
    child.intensity = 0.1;
  });
  scene.add(model);
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