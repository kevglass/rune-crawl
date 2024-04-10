import * as THREE from 'three';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let light1: THREE.DirectionalLight;
let light2: THREE.DirectionalLight;
let lightGroup: THREE.Object3D;

export function worldSetup(): THREE.Scene {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#87CEEB");

    camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.lookAt(scene.position);
    camera.rotateZ(Math.PI);

    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.BasicShadowMap
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    lightGroup = new THREE.Object3D();

    light1 = new THREE.DirectionalLight(0xffffff, 2);
    light1.position.set(10, 40, 10);
    light1.lookAt(0, 0, 0);

    light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(-10, 30, -10);
    light2.lookAt(0, 0, 0);

    lightGroup.add(light1.target);
    lightGroup.add(light1);
    lightGroup.add(light2.target);
    lightGroup.add(light2);

    scene.add(lightGroup);

    return scene;
}

export function renderScene(): void {
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

export function lookAt(target: THREE.Object3D): void {
    camera.position.set(target.position.x, 50, target.position.z);
    lightGroup.position.copy(target.position);
    camera.lookAt(target.position.x, 0, target.position.z);
}