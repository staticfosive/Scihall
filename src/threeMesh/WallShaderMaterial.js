import * as THREE from "three";
export default function WallShaderMaterial(panoramaLocation) {
  let point = panoramaLocation.point[0];
  let panorama = new THREE.TextureLoader().load(point.panoramaUrl);
  panorama.flipY = false;
  panorama.wrapS = THREE.RepeatWrapping;
  panorama.wrapT = THREE.RepeatWrapping;
  let center = new THREE.Vector3(point.x / 100, point.z / 100, point.y / 100);
  return new THREE.ShaderMaterial({
    // side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0xff0000) },
      uPanorama: { value: panorama },
      uCenter: {
        value: center,
      },
    },
    vertexShader: `
              varying vec2 vUv;
              varying vec3 vPosition;
              uniform vec3 uCenter;
              varying vec3 vNormal;
              void main() {
                  vUv = uv;
                  vNormal = normal;
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
              varying vec3 vNormal;
              void main() {
                  vec3 color = uColor;
                  vec3 nPos = normalize(vPosition-uCenter);
                  float isFront = dot(nPos, vNormal);
                  float theta = acos(nPos.y)/3.14;
                  float phi = (atan(nPos.z, nPos.x)+3.14)/6.28;
                  phi+=0.75;
                  vec4 pColor = texture2D(uPanorama, vec2(phi, theta));
                  // if(isFront<0.0){
                  //   gl_FragColor = pColor;
                      
                  // }else{
                  //   gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                  // }
                  // gl_FragColor = vec4(vNormal,1.0);
                  gl_FragColor = pColor;
                  // gl_FragColor = vec4(theta, 0, 0.0, 1.0);
              }
              `,
  });
}
