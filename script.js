// ===============================
// THREE.JS WORLD – ALL IN ONE FILE
// ===============================

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

scene.add(new THREE.AmbientLight(0x404040));

// ===============================
// PLAYER
// ===============================

let player = {
  speed: 0.15,
  gravity: 0.05,
  velocityY: 0,
  health: 10,
  takeDamage(amount){
    this.health -= amount;
    if(this.health < 0) this.health = 0;
  }
};

camera.position.set(0,5,10);
player.position = camera.position;

// ===============================
// CONTROLS
// ===============================

let keys = {};

document.addEventListener("keydown", e=>{
  keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", e=>{
  keys[e.key.toLowerCase()] = false;
});

document.addEventListener("mousedown", e=>{
  if(e.button === 0){
    attack();
  }
});

// Mouse Look
document.body.addEventListener("click", ()=>{
  document.body.requestPointerLock();
});

document.addEventListener("mousemove", e=>{
  if(document.pointerLockElement === document.body){
    camera.rotation.y -= e.movementX * 0.002;
    camera.rotation.x -= e.movementY * 0.002;
  }
});

// ===============================
// TERRAIN
// ===============================

const MAP_SIZE = 200;

function generateTerrain(){

  for(let x = -MAP_SIZE; x < MAP_SIZE; x+=5){
    for(let z = -MAP_SIZE; z < MAP_SIZE; z+=5){

      const height = Math.random()*2;

      const geo = new THREE.BoxGeometry(5, height+1, 5);
      const mat = new THREE.MeshStandardMaterial({
        color:0x228b22
      });

      const block = new THREE.Mesh(geo,mat);

      block.position.set(x, height/2, z);

      scene.add(block);
    }
  }
}

generateTerrain();

// ===============================
// ENEMIES
// ===============================

class Enemy{

  constructor(){

    const geo = new THREE.BoxGeometry(2,2,2);
    const mat = new THREE.MeshStandardMaterial({
      color:0xff0000
    });

    this.mesh = new THREE.Mesh(geo,mat);

    this.mesh.position.set(
      Math.random()*100 - 50,
      1,
      Math.random()*100 - 50
    );

    this.health = 3;
    this.dead = false;

    scene.add(this.mesh);
  }

  update(){

    if(this.dead) return;

    const dir = new THREE.Vector3()
      .subVectors(camera.position, this.mesh.position)
      .normalize();

    this.mesh.position.add(dir.multiplyScalar(0.03));

    if(this.mesh.position.distanceTo(camera.position) < 2){
      player.takeDamage(1);
    }
  }

  takeDamage(amount){

    this.health -= amount;

    if(this.health <= 0){
      this.dead = true;
      scene.remove(this.mesh);
    }
  }
}

let enemies = [];

function spawnEnemies(){
  for(let i=0;i<10;i++){
    enemies.push(new Enemy());
  }
}

spawnEnemies();

// ===============================
// FLYING ENEMY
// ===============================

class FlyingEnemy extends Enemy{

  constructor(){
    super();
    this.mesh.material.color.set(0x00ffff);
  }

  update(){
    this.mesh.position.y += Math.sin(Date.now()*0.005)*0.02;
    super.update();
  }
}

function spawnSkyEnemies(){
  for(let i=0;i<5;i++){
    enemies.push(new FlyingEnemy());
  }
}

// ===============================
// LAVA SYSTEM
// ===============================

let hazards = [];

function createLava(){

  const geo = new THREE.PlaneGeometry(20,20);
  const mat = new THREE.MeshStandardMaterial({
    color:0xff3300,
    emissive:0xff0000,
    side:THREE.DoubleSide
  });

  const lava = new THREE.Mesh(geo,mat);
  lava.rotation.x = -Math.PI/2;
  lava.position.set(0,-199,0);

  scene.add(lava);
  hazards.push(lava);
}

createLava();

// ===============================
// ATTACK SYSTEM
// ===============================

let attackCooldown = false;

function attack(){

  if(attackCooldown) return;

  attackCooldown = true;

  enemies.forEach(enemy=>{
    if(!enemy.dead){
      if(enemy.mesh.position.distanceTo(camera.position) < 6){
        enemy.takeDamage(1);
      }
    }
  });

  setTimeout(()=>{
    attackCooldown = false;
  },500);
}

// ===============================
// LAYER SYSTEM
// ===============================

let currentLayer = "surface";

function enterDepths(){
  currentLayer = "depths";
  camera.position.y = -190;
  scene.background = new THREE.Color(0x200010);
  spawnEnemies();
}

function enterSky(){
  currentLayer = "sky";
  camera.position.y = 210;
  scene.background = new THREE.Color(0x87ceeb);
  spawnSkyEnemies();
}

function enterSurface(){
  currentLayer = "surface";
  camera.position.y = 5;
  scene.background = new THREE.Color(0x228b22);
}

document.addEventListener("keydown", e=>{
  if(e.key.toLowerCase() === "r"){
    enterSurface();
  }
});

// ===============================
// GAME LOOP
// ===============================

function updatePlayer(){

  let forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  let right = new THREE.Vector3();
  right.crossVectors(forward,new THREE.Vector3(0,1,0));

  if(keys["w"]) camera.position.add(forward.clone().multiplyScalar(player.speed));
  if(keys["s"]) camera.position.add(forward.clone().multiplyScalar(-player.speed));
  if(keys["a"]) camera.position.add(right.clone().multiplyScalar(player.speed));
  if(keys["d"]) camera.position.add(right.clone().multiplyScalar(-player.speed));

  // Gravity
  player.velocityY -= player.gravity;
  camera.position.y += player.velocityY;

  if(camera.position.y < 5 && currentLayer !== "sky"){
    camera.position.y = 5;
    player.velocityY = 0;
  }
}

function updateHazards(){

  hazards.forEach(lava=>{
    if(camera.position.distanceTo(lava.position) < 10){
      player.takeDamage(1);
    }
  });
}

function animate(){

  requestAnimationFrame(animate);

  updatePlayer();
  updateHazards();

  enemies.forEach(enemy=>{
    if(!enemy.dead){
      enemy.update();
    }
  });

  renderer.render(scene,camera);
}

animate();
