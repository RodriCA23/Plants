import * as THREE from 'three';
import { OrbitControls } from 'orbitcontrols';
import { Sky } from 'sky';
import { OBJLoader } from 'objloader';
import { MTLLoader } from 'mtlloader';

// 🌎 Escena y Renderizador
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Append the renderer's canvas to the #background-container div
const backgroundContainer = document.getElementById('background-scene');
backgroundContainer.appendChild(renderer.domElement);

// 📷 Cámara
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 4);

// 🕹️ Controles de Cámara
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ☀️ Luz Solar
const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(5, 10, 5);
sunlight.castShadow = true;
scene.add(sunlight);

// 🌎 Luz Ambiental
const ambientLight = new THREE.AmbientLight(0xffffff, 3);
scene.add(ambientLight);

// 🌱 Suelo (Pasto)
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d5a27,  // Color verde oscuro para el pasto
    roughness: 0.8,    // Hace que el material se vea más mate
    metalness: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Cargar modelo Anemone Hybrida
const anemoneObjPath = 'anemone_hybrida.obj';
const anemoneMtlPath = 'anemone_hybrida.mtl';

const anemoneMtlLoader = new MTLLoader();
anemoneMtlLoader.setPath('./Models/Anemone_Hybrida_OBJ/maps/');
anemoneMtlLoader.setMaterialOptions({
    path: './Models/Anemone_Hybrida_OBJ/maps/', // Ruta base para las texturas
    crossOrigin: 'anonymous'
});
anemoneMtlLoader.load(anemoneMtlPath, (materials) => {
    materials.preload();
    Object.values(materials.materials).forEach(material => {
        material.transparent = false;
        material.opacity = 1;
        material.side = THREE.DoubleSide;
        if (material.color) {
            material.color.setRGB(1, 1, 1);
        }
        material.needsUpdate = true;
    });

    const anemoneObjLoader = new OBJLoader();
    anemoneObjLoader.setMaterials(materials);
    anemoneObjLoader.setPath('./Models/Anemone_Hybrida_OBJ/maps/');
    anemoneObjLoader.load(anemoneObjPath, (object) => {
        object.position.set(3, 0, 1);  // Posicionado a la derecha del otro modelo
        object.scale.set(1, 1, 1);
        object.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    if (child.material.color) {
                        child.material.color.setRGB(1, 1, 1);
                    }
                    child.material.transparent = false;
                    child.material.opacity = 1;
                    child.material.side = THREE.DoubleSide;
                    child.material.needsUpdate = true;
                }
            }
        });

        // Crear múltiples copias y distribuirlas en el campo
        const numFlowers = 100;  // Número de flores en el campo
        const areaSize = 20;    // Tamaño del área donde se distribuirán las flores
        for (let i = 0; i < numFlowers; i++) {
            const clone = object.clone();

            // Posicionamiento aleatorio dentro de un área de 20x20 unidades
            const x = Math.random() * areaSize - areaSize / 2; // Aleatorio entre -10 y 10
            const z = Math.random() * (areaSize / 2) - areaSize / 4; // Aleatorio entre -5 y 5 (más cerca del frente)
            const y = 0;  // Todas las flores al nivel del suelo

            clone.position.set(x, y, z);

            // Rotación aleatoria para mayor naturalidad
            clone.rotation.y = Math.random() * Math.PI * 2;

            scene.add(clone);
        }
    });
});

// ☁️ Cielo dinámico
const sky = new Sky();
sky.scale.setScalar(1000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 10;
skyUniforms['rayleigh'].value = 2;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;

const sun = new THREE.Vector3();
function updateSun(position) {
    const phi = THREE.MathUtils.degToRad(90 - position);
    const theta = THREE.MathUtils.degToRad(180);
    sun.setFromSphericalCoords(1, phi, theta);
    sunlight.position.copy(sun).multiplyScalar(10);
    skyUniforms['sunPosition'].value.copy(sun);
}

updateSun(10); // Iniciar en la mañana

// ☀️ Animación del ciclo día/noche
let time = 0;
function updateSunPosition() {
    time += 0.01; // Velocidad del ciclo día/noche

    // Simular el movimiento del sol (cambia entre -50 y 50 grados)
    const sunPosition = 10 + Math.sin(time) * 40;
    updateSun(sunPosition);

    // 🌞 **Simular iluminación de día y noche**
    const normalizedTime = (Math.sin(time) + 1) / 2; // Normaliza entre 0 y 1

    // Ajustar la intensidad de la luz direccional (sol) y ambiental
    sunlight.intensity = 2 * normalizedTime; // Brillo del sol
    ambientLight.intensity = 1.5 * normalizedTime; // Iluminación general de la escena

    // **Si el sol está bajo el horizonte, desactiva las sombras**
    sunlight.castShadow = sunlight.intensity > 0.2;
}

// 🔄 Loop de animación
function animate() {
    requestAnimationFrame(animate);
    updateSunPosition();
    controls.update();
    renderer.render(scene, camera);
}

animate();

// 🔄 Responsive
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});