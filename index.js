import * as THREE from "./js/three.module.js";
const aSideinput = document.querySelector(".a-side");
const bSideinput = document.querySelector(".b-side");
const previewButton = document.querySelector(".preview");
const textField = document.querySelector(".textarea");
const saveAsGif = document.querySelector(".make-gif");
const canvas = document.querySelector("#render");

let capturer,
  text,
  bTextures = [],
  cardText = "Placeholder",
  centerOffset = 0,
  font,
  renderer,
  camera,
  scene,
  aCardSide,
  bCardSide,
  id,
  card;

const textureLoader = new THREE.TextureLoader();
const cardSize = { x: 15, y: 25 };

const initThree = () => {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setClearColor(0x000000);

  camera.position.z = 25;
  let spot = new THREE.SpotLight();
  spot.position.z = 30;
  scene.add(spot);

  card = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(cardSize.x, cardSize.y);

  aCardSide = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  bCardSide = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ side: THREE.BackSide })
  );
  card.add(aCardSide);
  card.add(bCardSide);

  scene.add(card);
};

const initListeners = () => {
  textField.addEventListener("input", ({ target }) => {
    card.remove(text);
    cardText = target.value;
    makeText();
  });

  previewButton.addEventListener("click", (e) => {
    if (!bTextures.length) return;
    capturer.start();
    animate();
  });

  const centerImage = (t) => {
    // var fitScaleX = 1 / (t.image.width / t.image.height) / cardSize.y;
    // console.log(fitScaleX);
    // t.repeat.set(fitScaleX, 1);
    // t.offset.x = wOffset = 0.15;

    const aspectOfPlane = cardSize.x / cardSize.y;
    const aspectOfImage = t.image.width / t.image.height;
    let yScale = 1;
    let xScale = aspectOfPlane / aspectOfImage;
    if (xScale > 1) {
      // it doesn't cover so based on x instead
      xScale = 1;
      yScale = aspectOfImage / aspectOfPlane;
    }
    t.repeat.set(xScale, yScale);
    //wOffset = 1 - xScale;
    t.offset.set((1 - xScale) / 2, (1 - yScale) / 2);
  };

  aSideinput.addEventListener("change", function (e) {
    let userImageURL = URL.createObjectURL(this.files[0]);
    textureLoader.load(userImageURL, (t) => {
      if (t.image.width > t.image.height) {
        centerImage(t);
      }
      aCardSide.material.map = t;
      aCardSide.material.needsUpdate = true;
      renderer.render(scene, camera);
    });
  });

  bSideinput.addEventListener("change", function (e) {
    if (this.files.length > 3) alert("Max 3 files");
    if (this.files.length < 3) alert("Min 3 files");
    for (let i = 0; i < 3; i++) {
      let userImageURL = URL.createObjectURL(this.files[i]);
      textureLoader.load(userImageURL, (t) => {
        if (t.image.width > t.image.height) {
          centerImage(t);
        }
        bTextures.push(t);
        bCardSide.material.map = bTextures[0];
        bCardSide.material.needsUpdate = true;
      });
    }
  });

  saveAsGif.addEventListener("click", () => {
    console.log(capturer);
    capturer.save();
  });

  initThree();
};

const changeBTexture = () => {
  if (card.rotation.y > Math.PI * 2) {
    bCardSide.material.map = bTextures[1];
  }
  if (card.rotation.y > Math.PI * 2 * 2) {
    bCardSide.material.map = bTextures[2];
  }
  if (card.rotation.y > Math.PI * 2 * 3) {
    bCardSide.material.map = bTextures[2];
    console.log("stop");
    window.cancelAnimationFrame(id);
    card.rotation.y = 0;
    capturer.stop();
  }

  bCardSide.material.needsUpdate = true;
};

const init = () => {
  new THREE.FontLoader().load("./helvetiker_bold.typeface.json", (response) => {
    font = response;
    makeText();
  });

  capturer = new CCapture({
    format: "gif",
    workersPath: "js/",
    framerate: 60,
  });
  initListeners();
};

const makeText = () => {
  const geometry = new THREE.TextGeometry(cardText, {
    font: font,
    size: 1.6,
    height: 0.1,
  });
  geometry.computeBoundingBox();
  centerOffset =
    -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
  text = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.5,
      roughness: 0.5,
    })
  );
  text.position.set(centerOffset, 0, 0.1);
  card.add(text);
  //card.add(text2);
  renderer.render(scene, camera);
};

const animate = function () {
  id = requestAnimationFrame(animate);
  card.rotation.y += 0.05;
  changeBTexture();
  renderer.render(scene, camera);
  capturer.capture(renderer.domElement);
};

init();
