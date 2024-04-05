import { GLTFLoader } from 'node-three-gltf';
import * as THREE from 'three';

// run npx serve@latest to make content available

const loader = new GLTFLoader();

loader.load("../src/assets/world/building_A.gltf", (model) => {
    const caster = new THREE.Raycaster();
    caster.set(new THREE.Vector3(0.5,100,0.5), new THREE.Vector3(0,-1,0));
    console.log(caster.intersectObject(model.scene)[0].point);
})
