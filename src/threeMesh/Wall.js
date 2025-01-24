import * as THREE from "three";
let material1 = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  side: THREE.FrontSide,
  //   transparent: true,
  metalness: 1,
  roughness: 0.6,
  //   wireframe: true,
});
export default class Wall extends THREE.Mesh {
  constructor(wallPoints, faceRelation) {
    super();
    this.wallPoints = wallPoints;
    this.faceRelation = faceRelation;
    this.init();
  }
  init() {
    let wallPoints = this.wallPoints;
    wallPoints.forEach((item) => {
      item.x = item.x / 100;
      item.y = item.y / 100;
      item.z = item.z / 100;
    });

    let faceIndexs = [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [0, 3, 6, 5],
      [2, 1, 4, 7],
      [1, 0, 5, 4],
      [3, 2, 7, 6],
    ];
    let mIndex = [];
    faceIndexs.forEach((item, i) => {
      let faceItem;
      let isFace = this.faceRelation.some((face) => {
        faceItem = face;
        return (
          item.includes(face.index[0]) &&
          item.includes(face.index[1]) &&
          item.includes(face.index[2]) &&
          item.includes(face.index[3])
        );
      });
      if (isFace) {
        mIndex.push(faceItem.panorama);
      } else {
        mIndex.push(0);
      }
    });
    // console.log(mIndex);
    let faces = [
      // 底面
      [
        [wallPoints[0].x, wallPoints[0].z, wallPoints[0].y],
        [wallPoints[1].x, wallPoints[1].z, wallPoints[1].y],
        [wallPoints[2].x, wallPoints[2].z, wallPoints[2].y],
        [wallPoints[3].x, wallPoints[3].z, wallPoints[3].y],
      ],
      //   上面
      [
        [wallPoints[4].x, wallPoints[4].z, wallPoints[4].y],
        [wallPoints[5].x, wallPoints[5].z, wallPoints[5].y],
        [wallPoints[6].x, wallPoints[6].z, wallPoints[6].y],
        [wallPoints[7].x, wallPoints[7].z, wallPoints[7].y],
      ],
      // 左面
      [
        [wallPoints[0].x, wallPoints[0].z, wallPoints[0].y],
        [wallPoints[3].x, wallPoints[3].z, wallPoints[3].y],
        [wallPoints[6].x, wallPoints[6].z, wallPoints[6].y],
        [wallPoints[5].x, wallPoints[5].z, wallPoints[5].y],
      ],
      // 右面
      [
        [wallPoints[2].x, wallPoints[2].z, wallPoints[2].y],
        [wallPoints[1].x, wallPoints[1].z, wallPoints[1].y],

        [wallPoints[4].x, wallPoints[4].z, wallPoints[4].y],
        [wallPoints[7].x, wallPoints[7].z, wallPoints[7].y],
      ],
      // 前面
      [
        [wallPoints[1].x, wallPoints[1].z, wallPoints[1].y],
        [wallPoints[0].x, wallPoints[0].z, wallPoints[0].y],
        [wallPoints[5].x, wallPoints[5].z, wallPoints[5].y],
        [wallPoints[4].x, wallPoints[4].z, wallPoints[4].y],
      ],
      // 后面
      [
        [wallPoints[3].x, wallPoints[3].z, wallPoints[3].y],
        [wallPoints[2].x, wallPoints[2].z, wallPoints[2].y],
        [wallPoints[7].x, wallPoints[7].z, wallPoints[7].y],
        [wallPoints[6].x, wallPoints[6].z, wallPoints[6].y],
      ],
    ];
    // console.log(faces);

    let positions = [];
    let uvs = [];
    let indices = [];
    let normals = [];
    let faceNormals = [
      [0, -1, 0],
      [0, 1, 0],
      [-1, 0, 0],
      [1, 0, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];
    let materialGroups = [];

    for (let i = 0; i < faces.length; i++) {
      let point = faces[i];
      let facePositions = [];
      let faceUvs = [];
      let faceIndices = [];

      facePositions.push(...point[0], ...point[1], ...point[2], ...point[3]);
      faceUvs.push(0, 0, 1, 0, 1, 1, 0, 1);
      faceIndices.push(
        0 + i * 4,
        2 + i * 4,
        1 + i * 4,
        0 + i * 4,
        3 + i * 4,
        2 + i * 4
      ); // 顺时针
      materialGroups.push({
        start: i * 6,
        count: 6,
        materialIndex: i,
      });
      //   console.log(faceNormals);

      positions.push(...facePositions);
      uvs.push(...faceUvs);
      indices.push(...faceIndices);
      normals.push(
        ...faceNormals[i],
        ...faceNormals[i],
        ...faceNormals[i],
        ...faceNormals[i]
      );
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    this.geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    this.geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(normals, 3)
    );
    this.geometry.setIndex(
      new THREE.BufferAttribute(new Uint16Array(indices), 1)
    );
    this.geometry.groups = materialGroups;

    // console.log(this.geometry);

    // 设置基础材质
    // this.material = new THREE.MeshBasicMaterial({
    //   color: 0xffffff,
    //   side: THREE.FrontSide,
    //   wireframe: true,
    // });

    // this.material = new THREE.MeshStandardMaterial({
    //   color: 0xffffff,
    //   side: THREE.FrontSide,
    //   //   transparent: true,
    //   metalness: 1,
    //   roughness: 0.6,
    //   //   wireframe: true,
    // });

    let point = this.faceRelation.panorama.point[0];
    this.panorama = new THREE.TextureLoader().load(point.panoramaUrl);
    // console.log(point.panoramaUrl);
    this.panorama.flipY = false;
    this.panorama.wrapS = THREE.RepeatWrapping;
    this.panorama.wrapT = THREE.RepeatWrapping;
    let center = new THREE.Vector3(point.x / 100, point.z / 100, point.y / 100);
    // let material2 = new THREE.ShaderMaterial({
    //   // side: THREE.DoubleSide,
    //   uniforms: {
    //     uTime: { value: 0 },
    //     uColor: { value: new THREE.Color(0xff0000) },
    //     uPanorama: { value: this.panorama },
    //     uCenter: {
    //       value: center,
    //     },
    //   },
    //   vertexShader: `
    //         varying vec2 vUv;
    //         varying vec3 vPosition;
    //         uniform vec3 uCenter;
    //         varying vec3 vNormal;
    //         void main() {
    //             vUv = uv;
    //             vNormal = normal;
    //             vec4 modelpos = modelMatrix * vec4(position, 1.0);
    //             vPosition = modelpos.xyz;
    //             gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    //         }
    //         `,
    //   fragmentShader: `
    //         varying vec2 vUv;
    //         uniform vec3 uColor;
    //         uniform float uTime;
    //         uniform sampler2D uPanorama;
    //         uniform vec3 uCenter;
    //         varying vec3 vPosition;
    //         varying vec3 vNormal;
    //         void main() {
    //             vec3 color = uColor;
    //             vec3 nPos = normalize(vPosition-uCenter);
    //             float isFront = dot(nPos, vNormal);
    //             float theta = acos(nPos.y)/3.14;
    //             float phi = (atan(nPos.z, nPos.x)+3.14)/6.28;
    //             phi+=0.75;
    //             vec4 pColor = texture2D(uPanorama, vec2(phi, theta));
    //             // if(isFront<0.0){
    //             //   gl_FragColor = pColor;

    //             // }else{
    //             //   gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    //             // }
    //             // gl_FragColor = vec4(vNormal,1.0);
    //             gl_FragColor = pColor;
    //             // gl_FragColor = vec4(theta, 0, 0.0, 1.0);
    //         }
    //         `,
    // });
    this.materials = mIndex.map((item) => {
      if (item == 0) {
        return material1;
      } else {
        return item.material;
      }
    });
    // console.log(this.materials);
    this.material = this.materials;

    // this.material = new THREE.ShaderMaterial({
    //   uniforms: {
    //     uTime: { value: 0 },
    //     uColor: { value: new THREE.Color(0x00ff00) },
    //   },
    //   vertexShader: `
    //     varying vec2 vUv;
    //     varying vec3 vNormal;
    //     varying vec3 vPosition;
    //     void main() {
    //         vUv = uv;
    //         vNormal = normal;
    //         vPosition = position;
    //         gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    //     }
    //     `,
    //   fragmentShader: `
    //     varying vec2 vUv;
    //     varying vec3 vNormal;
    //     varying vec3 vPosition;
    //     uniform vec3 uColor;
    //     uniform float uTime;
    //     void main() {
    //         vec3 color = uColor;
    //         gl_FragColor = vec4(vUv,0.0, 1.0);
    //     }
    //     `,
    //   side: THREE.DoubleSide,
    //   transparent: true,
    // });
  }
}
