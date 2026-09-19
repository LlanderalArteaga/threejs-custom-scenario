import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

await RAPIER.init();

const container = document.getElementById('scene-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07111f);

const camera = new THREE.PerspectiveCamera(
    60, window.innerWidth / window.innerHeight, 0.1, 1500
);
camera.position.set(-3.5, 2.5, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x202020, 1.7));
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(-10, 25, 10);
sun.castShadow = true;
scene.add(sun);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 10;

const physicsWorld = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
const loader = new GLTFLoader();
const timer = new THREE.Timer();

function createStaticTrimesh(mesh) {
    const geometry = mesh.geometry;
    const position = geometry.attributes.position;
    if (!position) return;

    mesh.updateWorldMatrix(true, false);
    const v = new Float32Array(position.count * 3);
    const point = new THREE.Vector3();

    for (let i = 0; i < position.count; i++) {
        point.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
        v[i * 3] = point.x;
        v[i * 3 + 1] = point.y;
        v[i * 3 + 2] = point.z;
    }

    let indices;
    if (geometry.index) {
        indices = new Uint32Array(geometry.index.array);
    } else {
        indices = new Uint32Array(position.count);
        for (let i = 0; i < position.count; i++) indices[i] = i;
    }

    physicsWorld.createCollider(RAPIER.ColliderDesc.trimesh(v, indices));
}

// Cargar Mapa
loader.load('./assets/models/city/scene.gltf', (gltf) => {
    const city = gltf.scene;
    city.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
        createStaticTrimesh(child);
    });
    scene.add(city);
});

// Configuración de Física del Personaje (Ajustada a escala humana)
const characterBody = physicsWorld.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(-3.5, 1.0, 0)
);
const characterCollider = physicsWorld.createCollider(
    RAPIER.ColliderDesc.capsule(0.35, 0.25),
    characterBody
);

const characterController = physicsWorld.createCharacterController(0.03);
characterController.enableAutostep(0.35, 0.2, true);
characterController.enableSnapToGround(0.35);
characterController.setApplyImpulsesToDynamicBodies(true);

const keyStates = {};
document.addEventListener('keydown', e => keyStates[e.code] = true);
document.addEventListener('keyup', e => keyStates[e.code] = false);

let character = null;
let mixer = null;
const actions = {};
let currentAction = null;
let isThrowing = false;

// Función para cargar animaciones y eliminar el desplazamiento de raíz (Root Motion)
async function loadAnimation(url, actionName) {
    return new Promise((resolve) => {
        loader.load(url, (gltf) => {
            if (gltf.animations.length > 0 && mixer) {
                const clip = gltf.animations[0].clone();
                
                // Elimina las pistas de posición en X y Z del hueso principal (Hips)
                clip.tracks = clip.tracks.filter(track => {
                    return !track.name.endsWith('.position');
                });

                const action = mixer.clipAction(clip);
                
                // Si es la animación de lanzamiento, no debe repetirse en bucle
                if (actionName === 'throw') {
                    action.setLoop(THREE.LoopOnce);
                    action.clampWhenFinished = true;
                }
                
                actions[actionName] = action;
            }
            resolve();
        });
    });
}

// Cargar Personaje
loader.load('./assets/models/character/character.gltf', async (gltf) => {
    character = gltf.scene;
    
    // Escala del personaje relativa al escenario (Ajustable entre 0.006 y 0.01)
    character.scale.setScalar(0.22); 

    character.traverse((child) => {
        if (child.isMesh) child.castShadow = true;
    });
    scene.add(character);

    mixer = new THREE.AnimationMixer(character);

    // Evento al terminar una animación de una sola reproducción
    mixer.addEventListener('finished', (e) => {
        if (e.action === actions['throw']) {
            isThrowing = false;
            playAction('idle');
        }
    });

    await loadAnimation('./assets/models/props/Idle.glb', 'idle');
    await loadAnimation('./assets/models/props/Walking.glb', 'walk');
    await loadAnimation('./assets/models/props/Slow_Run.glb', 'run');
    await loadAnimation('./assets/models/props/Throw.glb', 'throw');

    playAction('idle');
});

function playAction(name) {
    const next = actions[name];
    if (!next || next === currentAction) return;
    currentAction?.fadeOut(0.15);
    next.reset().fadeIn(0.15).play();
    currentAction = next;
}

const desired = new THREE.Vector3();
const forward = new THREE.Vector3();
const side = new THREE.Vector3();

function updateCharacter(delta) {
    if (!character) return;

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    side.crossVectors(forward, camera.up).normalize();

    desired.set(0, -4.5 * delta, 0);
    const running = keyStates.ShiftLeft || keyStates.ShiftRight;
    const speed = running ? 3.8 : 1.8;

    const move = new THREE.Vector3();
    if (keyStates.KeyW) move.add(forward);
    if (keyStates.KeyS) move.sub(forward);
    if (keyStates.KeyD) move.add(side);
    if (keyStates.KeyA) move.sub(side);

    if (move.lengthSq() > 0) {
        move.normalize();
        desired.addScaledVector(move, speed * delta);
        character.rotation.y = Math.atan2(move.x, move.z);
        if (!isThrowing) playAction(running ? 'run' : 'walk');
    } else {
        if (!isThrowing) playAction('idle');
    }

    characterController.computeColliderMovement(characterCollider, desired);
    const corrected = characterController.computedMovement();
    const p = characterBody.translation();
    characterBody.setNextKinematicTranslation({
        x: p.x + corrected.x,
        y: p.y + corrected.y,
        z: p.z + corrected.z
    });
}

function syncCharacter() {
    if (!character) return;
    const p = characterBody.translation();
    
    // Alineación visual con la cápsula física
    character.position.set(p.x, p.y - 0.63, p.z);

    controls.target.set(p.x, p.y + 0.4, p.z);
    controls.update();
}

const dynamicObjects = [];

function createBox(x, y, z, sx = 0.8, sy = 0.8, sz = 0.8, mass = 2) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(sx, sy, sz),
        new THREE.MeshStandardMaterial({ color: 0x9aa7b8, roughness: 0.7 })
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const body = physicsWorld.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z)
    );
    const collider = RAPIER.ColliderDesc.cuboid(sx / 2, sy / 2, sz / 2)
        .setMass(mass)
        .setFriction(0.7)
        .setRestitution(0.1);
    physicsWorld.createCollider(collider, body);
    dynamicObjects.push({ mesh, body });
}

for (let level = 0; level < 3; level++) {
    for (let i = 0; i < 3 - level; i++) {
        createBox(3 + i * 0.9 + level * 0.45, 0.4 + level * 0.8, -4, 0.8, 0.8, 0.8, 2);
    }
}

let canThrow = true;

document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyF' && !event.repeat && canThrow && !isThrowing) {
        throwObject();
    }
});

function throwObject() {
    if (!character) return;
    canThrow = false;
    isThrowing = true;
    
    playAction('throw');

    // Espera a que la animación de extensión de brazo llegue al punto de soltar (aprox 300ms)
    setTimeout(() => {
        const p = characterBody.translation();
        const dir = new THREE.Vector3(0, 0, 1)
            .applyQuaternion(character.quaternion)
            .normalize();

        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x063b49 })
        );
        mesh.castShadow = true;
        scene.add(mesh);

        const start = new THREE.Vector3(p.x, p.y + 0.3, p.z).addScaledVector(dir, 0.5);
        const body = physicsWorld.createRigidBody(
            RAPIER.RigidBodyDesc.dynamic().setTranslation(start.x, start.y, start.z)
        );
        physicsWorld.createCollider(RAPIER.ColliderDesc.ball(0.12).setRestitution(0.25), body);
        body.setLinvel({ x: dir.x * 10, y: 1.8, z: dir.z * 10 }, true);

        dynamicObjects.push({ mesh, body });
    }, 800);

    // Enfriamiento del botón de lanzamiento
    setTimeout(() => { 
        canThrow = true; 
    }, 1000);
}

function syncDynamicObjects() {
    for (const item of dynamicObjects) {
        const p = item.body.translation();
        const q = item.body.rotation();
        item.mesh.position.set(p.x, p.y, p.z);
        item.mesh.quaternion.set(q.x, q.y, q.z, q.w);
    }
}

function animate() {
    timer.update();
    const delta = Math.min(0.05, timer.getDelta());

    updateCharacter(delta);
    physicsWorld.timestep = delta;
    physicsWorld.step();

    syncCharacter();
    syncDynamicObjects();
    if (mixer) mixer.update(delta);

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});