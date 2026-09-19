# Aplicación Web 3D Interactiva: Personalización e Integración de Escenarios

**Programador:** Axel Llanderal Arteaga  
**Número de Control:** 22200784  
**Materia:** Desarrollo de Soluciones en Ambientes Virtuales  
**Despliegue GitHub Pages:** [https://llanderalarteaga.github.io/threejs-custom-scenario/](https://llanderalarteaga.github.io/threejs-custom-scenario/)

---

## 🎯 Objetivo
Desarrollar una aplicación Web 3D interactiva con Three.js (asistida por IA) que integre un personaje 3D animado en tercera persona, navegación de cámara con mouse, físicas avanzadas mediante Rapier3D para colisiones y lanzamiento de objetos dinámicos. El propósito principal es estructurar un código modular y reutilizable en JavaScript para cambiar de escenario de forma transparente sin rehacer la lógica del personaje, administrando el proyecto con Git/GitHub y desplegándolo en GitHub Pages.

---

## 🎮 Controles
* **WASD:** Movimiento del personaje (Adelante, Izquierda, Atrás, Derecha).
* **SHIFT:** Correr.
* **F:** Lanzar proyectil dinámico.
* **Mouse (Arrastrar):** Orbitar y orientar la cámara en tercera persona.

---

## 🏙️ Descripción de los Escenarios

### Escenario Base: Ciudad Urbana
Escenario exterior que representa un entorno urbano (*Street City 7*) con edificios, calles y aceras. Se utilizó para calibrar la primera versión del sistema de física, colisiones `trimesh` y el controlador de movimiento del personaje.

### Escenario Personalizado: Almacén (Warehouse)
Escenario interior de tipo industrial (*Warehouse*) compuesto por muros, contenedores de carga y estructuras metálicas. Demuestra la reusabilidad de la arquitectura al cargar un nuevo archivo `.gltf`/`.glb` conservando intactas las animaciones, la cámara y el sistema de física.

---

## 🛠️ Tecnologías Utilizadas
* **Three.js:** Renderizado e iluminación 3D en el navegador.
* **Rapier3D (`@dimforge/rapier3d-compat`):** Motor de físicas 3D para colisiones estáticas, cuerpos dinámicos y `CharacterController`.
* **GLTFLoader:** Carga e importación de modelos y escenarios en formato glTF/GLB.
* **JavaScript ES6+:** Programación modular asíncrona (`async/await`).
* **HTML5 / CSS3:** Interfaz de usuario y maquetación responsiva.
* **Live Server / VS Code:** Servidor de desarrollo local.
* **GitHub Pages:** Alojamiento y despliegue público del proyecto.

---

## ⚙️ Explicación del Motor de Física
La física del proyecto está gestionada por **Rapier3D**:
1. **Colisiones del Escenario (`createEnvironmentColliders`):** Se recorren las mallas del modelo 3D y se genera una geometría `trimesh` fija (`RigidBodyDesc.fixed()`) que impide que el personaje atraviese paredes y suelos.
2. **Controlador del Personaje (`KinematicCharacterController`):** Maneja la cápsula colisionadora del jugador, permitiendo un movimiento suave, ajuste automático a desniveles del suelo (`enableSnapToGround`) y la capacidad de empujar objetos dinámicos.
3. **Objetos Dinámicos (`createDynamicBox` y `throwObject`):** La pirámide de cajas y los proyectiles esféricos son cuerpos rígidos dinámicos (`RigidBodyDesc.dynamic()`) que reaccionan a impulsos, gravedad y restituciones tras recibir un impacto.

---

## 🎨 Créditos de Recursos y Licencias

* **Escenario Base:**
  * **Nombre:** Street City (7) for games FREE
  * **Autor:** dasy444
  * **Enlace:** [Sketchfab - Street City 7](https://sketchfab.com/3d-models/street-city-7-for-games-free-493a69b451284ff88346c7b3e4e1b5a7)
  * **Licencia:** Free Standard License

* **Escenario Personalizado:**
  * **Nombre:** Warehouse FREE LOW-POLY FOR GAMES
  * **Autor:** dasy444
  * **Enlace:** [Sketchfab - Warehouse](https://sketchfab.com/3d-models/warehouse-free-low-poly-for-games-32eeb06ebf8a45db85ea5f98b26f33de)
  * **Licencia:** Free Standard License

* **Personaje y Animaciones:**
  * **Fuente:** [Mixamo](https://www.mixamo.com/) (Adobe)
  * **Animaciones:** Idle, Walking, Slow Run, Throw.

---

## 🚀 Instrucciones de Ejecución Local

1. Clonar el repositorio:
   ```bash
   git clone [https://github.com/LlanderalArteaga/threejs-custom-scenario.git](https://github.com/LlanderalArteaga/threejs-custom-scenario.git)