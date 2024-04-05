import * as THREE from 'three';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let light1: THREE.DirectionalLight;
let light2: THREE.DirectionalLight;
let lightGroup: THREE.Object3D;

const planView = false;
const distance = 7;
export function worldSetup(withPlane: boolean): THREE.Scene {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#87CEEB");

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, planView ? 2000 : 500);
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

    renderer = new THREE.WebGLRenderer({ antialias: true });
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

    const ambient = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambient);

    lightGroup = new THREE.Object3D();

    light1 = new THREE.DirectionalLight(0xffffff, 2);
    light1.position.set(20, 30, 10);
    light1.lookAt(0,0,0);
    light1.castShadow = true;
    light1.shadow.mapSize.width = 1024
    light1.shadow.mapSize.height = 1024
    light1.shadow.camera.near = 0.1
    light1.shadow.camera.far = 1000
    light1.shadow
    
    const d = 30;
    light1.shadow.camera.left = - d;
    light1.shadow.camera.right = d;
    light1.shadow.camera.top = d;
    light1.shadow.camera.bottom = - d;

    lightGroup.add(light1.target);
    lightGroup.add(light1);

    // light2 = new THREE.DirectionalLight(0xffffff, 1);
    // light2.position.set(-20, 50, 20);
    // lightGroup.add(light2);

    scene.add(lightGroup);
    // const helper = new THREE.CameraHelper( light1.shadow.camera );
    // scene.add( helper );

    return scene;
}

export function renderScene(): void {
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

export function lookAt(x: number, y: number, z: number): void {
    if (planView) {
        camera.position.set(x, 200, z);
    } else {
        camera.position.set(x, y + distance / 2, z - distance);
        lightGroup.position.set(x, y, z);
    }
    camera.lookAt(x, y, z);  
}