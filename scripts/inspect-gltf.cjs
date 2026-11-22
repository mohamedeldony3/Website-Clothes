const fs = require('fs');
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
const { MeshoptDecoder } = require('three/examples/jsm/libs/meshopt_decoder.module.js');
const THREE = require('three');

const buffer = fs.readFileSync('public/models/pullover_hoodie.glb');
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

loader.parse(arrayBuffer, '', (gltf) => {
  console.log('Scene parsed successfully!');
  const scene = gltf.scene;
  const box = new THREE.Box3().setFromObject(scene);
  console.log('Bounding Box Min:', box.min);
  console.log('Bounding Box Max:', box.max);
  const size = new THREE.Vector3();
  box.getSize(size);
  console.log('Size:', size);
  
  scene.traverse((child) => {
    if (child.isMesh) {
      console.log('Mesh name:', child.name, 'Geometry vertices:', child.geometry.attributes.position.count);
      if (child.material) {
        console.log('Material name:', child.material.name, 'type:', child.material.type);
      }
    }
  });
}, (err) => {
  console.error('Error parsing GLTF:', err);
});
