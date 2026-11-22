const fs = require('fs');
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
const { MeshoptDecoder } = require('three/examples/jsm/libs/meshopt_decoder.module.js');
const THREE = require('three');

const buffer = fs.readFileSync('public/models/pullover_hoodie.glb');
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

loader.parse(arrayBuffer, '', (gltf) => {
  const scene = gltf.scene;
  let mesh;
  scene.traverse((child) => {
    if (child.isMesh) mesh = child;
  });

  const pos = mesh.geometry.attributes.position;
  const normal = mesh.geometry.attributes.normal;
  
  // Calculate average normal for vertices with positive Z vs negative Z
  let zPosNormals = 0, zNegNormals = 0;
  let countPos = 0, countNeg = 0;
  
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const nz = normal.getZ(i);
    if (z > 0) {
      zPosNormals += nz;
      countPos++;
    } else {
      zNegNormals += nz;
      countNeg++;
    }
  }
  
  console.log('Pos Z avg normal Z:', zPosNormals / countPos);
  console.log('Neg Z avg normal Z:', zNegNormals / countNeg);

  // Check the hood / opening: where is the opening of the hood?
  // Let's sample vertices at highest Y (the hood)
  let maxY = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > maxY) maxY = pos.getY(i);
  }
  
  // Near the top (hood opening)
  let hoodZSum = 0, hoodCount = 0;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > maxY - 1.0) {
      hoodZSum += pos.getZ(i);
      hoodCount++;
    }
  }
  console.log('Hood region avg Z:', hoodZSum / hoodCount);

  // Let's check bounding box center
  const box = new THREE.Box3().setFromObject(mesh);
  const center = new THREE.Vector3();
  box.getCenter(center);
  console.log('Center:', center);
  
  // Look at extreme points
  console.log('Extreme +Z vertices count:', countPos, 'Extreme -Z count:', countNeg);
});
