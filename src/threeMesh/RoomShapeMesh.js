import * as THREE from "three";
export default class RoomShapeMesh extends THREE.Mesh {
  constructor(room, isTop) {
    super();
    this.room = room;
    this.isTop = isTop;
    this.roomShapePoints = room.areas;
    this.init();
  }
  init() {
    let roomShape = new THREE.Shape();
    for (let i = 0; i < this.roomShapePoints.length; i++) {
      if (i == 0) {
        roomShape.moveTo(
          this.roomShapePoints[i].x / 100,
          this.roomShapePoints[i].y / 100
        );
      } else {
        roomShape.lineTo(
          this.roomShapePoints[i].x / 100,
          this.roomShapePoints[i].y / 100
        );
      }
    }
    // console.log(roomShape);
    this.geometry = new THREE.ShapeGeometry(roomShape);
    this.geometry.rotateX(Math.PI / 2);
    // this.material = new THREE.MeshBasicMaterial({
    //   color: 0xffffff,
    //   side: THREE.DoubleSide,
    // });
    // const shapeMesh = new THREE.Mesh(shapeGeometry, shapeMaterial);
    let point = this.room.panoramaLocation.point[0];
    this.panorama = new THREE.TextureLoader().load(point.panoramaUrl);
    this.panorama.flipY = false;
    this.panorama.wrapS = THREE.RepeatWrapping;
    this.panorama.wrapT = THREE.RepeatWrapping;
    let center = new THREE.Vector3(point.x / 100, point.z / 100, point.y / 100);
    this.material = new THREE.ShaderMaterial({
      side: this.isTop ? THREE.FrontSide : THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xff0000) },
        uPanorama: { value: this.panorama },
        uCenter: {
          value: center,
        },
      },
      vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            uniform vec3 uCenter;
            void main() {
                vUv = uv;
                vec4 modelpos = modelMatrix * vec4(position, 1.0);
                vPosition = modelpos.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `,
      fragmentShader: `
            varying vec2 vUv;
            uniform vec3 uColor;
            uniform float uTime;
            uniform sampler2D uPanorama;
            uniform vec3 uCenter;
            varying vec3 vPosition;
            void main() {
                vec3 color = uColor;
                vec3 nPos = normalize(vPosition-uCenter);
                float theta = acos(nPos.y)/3.14;
                float phi = (atan(nPos.z, nPos.x)+3.14)/6.28;
                phi+=0.75;
                vec4 pColor = texture2D(uPanorama, vec2(phi, theta));
                gl_FragColor = pColor;
                // gl_FragColor = vec4(theta, 0, 0.0, 1.0);
            }
            `,
    });

    // let SphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    // let sphere = new THREE.Mesh(SphereGeometry, this.material);
    // sphere.position.copy(center);
    // this.add(sphere);
  }
}
