import * as THREE from 'three';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let light1: THREE.DirectionalLight;
let light2: THREE.DirectionalLight;
let lightGroup: THREE.Object3D;

const planView = true;
const distance = 5;
export function worldSetup(withPlane: boolean): THREE.Scene {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#87CEEB");

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, planView ? 2000 : 80);
    if (!planView) {
        scene.fog = new THREE.Fog( 0x87CEEB, 50, 80 );
    }
    // const aspect = window.innerWidth / window.innerHeight;
    // const cameraDistance = distance / window.innerWidth;
    // camera = new THREE.OrthographicCamera(- cameraDistance * aspect, cameraDistance * aspect, cameraDistance, - cameraDistance, -100, 100);

    camera.position.set(-10, 10, 10);
    if (planView) {
        camera.position.set(0, 10, 0);
    }
    camera.lookAt(scene.position);
    if (planView) {
        camera.rotateZ(Math.PI);
    }

    renderer = new THREE.WebGLRenderer({
        powerPreference: "high-performance",
        alpha: false,
    });
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    if (withPlane) {
        const planeGeometry = new THREE.PlaneGeometry(20, 20)
        const plane = new THREE.Mesh(planeGeometry, new THREE.MeshPhongMaterial())
        plane.rotateX(-Math.PI / 2)
        plane.position.y = 0
        plane.receiveShadow = true
        scene.add(plane)
    }

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    lightGroup = new THREE.Object3D();

    light1 = new THREE.DirectionalLight(0xffffff, 2);
    light1.position.set(20, 30, 10);
    light1.lookAt(0, 0, 0);
    light1.castShadow = true;
    light1.shadow.mapSize.width = 1024
    light1.shadow.mapSize.height = 1024
    light1.shadow.camera.near = 0.1
    light1.shadow.camera.far = 1000
    light1.shadow.bias = -0.001;

    const d = 50;
    light1.shadow.camera.left = - d;
    light1.shadow.camera.right = d;
    light1.shadow.camera.top = d;
    light1.shadow.camera.bottom = - d;

    light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(-20, 30, 10);
    light2.lookAt(0, 0, 0);

    lightGroup.add(light1.target);
    lightGroup.add(light1);
    lightGroup.add(light2.target);
    lightGroup.add(light2);

    scene.add(lightGroup);

    return scene;
}

export function disableShadows(): void {
    light1.castShadow = false;
}

export function renderScene(): void {
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

export function lookAt(target: THREE.Object3D): void {
    const direction = target.getWorldDirection(new THREE.Vector3());
    const above = (distance / 3) + 1;

    if (planView) {
        camera.position.set(target.position.x, 500, target.position.y);
    } else {
        camera.position.set(target.position.x - (direction.x * distance), target.position.y + above, target.position.z - (direction.z * distance));
        lightGroup.position.copy(target.position);
    }
    camera.lookAt(target.position.x, target.position.y + above, target.position.z);
}