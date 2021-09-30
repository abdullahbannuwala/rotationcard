import * as THREE from "./js/three.module.js";
const aSideinput = document.querySelector(".a-side");
const bSideinput = document.querySelector(".b-side");
const previewButton = document.querySelector(".preview");
const reset = document.querySelector(".reset");
const textField = document.querySelector(".textarea");
const saveAsGif = document.querySelector(".make-gif");
const canvas = document.querySelector("#render");
const modalWindow = document.querySelector(".modal");
const progress = document.querySelector("#progress");

let capturer,
  text,
  bTextures = [],
  cardText = "Placeholder",
  gifIsReady = false,
  centerOffset = 0,
  rotated = false,
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
    45,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setClearColor(0x000000);

  camera.position.z = 39;
  let spot = new THREE.SpotLight();
  spot.position.z = 30;
  scene.add(spot);

  card = new THREE.Group();
  card.add(
    new THREE.Mesh(
      new THREE.BoxBufferGeometry(cardSize.x + 0.1, cardSize.y + 0.1, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )
  );
  const geometry = new THREE.PlaneGeometry(cardSize.x, cardSize.y);

  aCardSide = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  bCardSide = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ side: THREE.BackSide })
  );
  aCardSide.position.z = 0.1;
  bCardSide.position.z = -0.1;
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
    if (!bTextures.length) {
      alert("Choose images for change side");
      return;
    }
    if (!rotated) {
      capturer.start();
      rotated = true;
      animate();
    }
  });

  reset.addEventListener("click", () => {
    card.remove(text);
    capturer.reset();
    rotated = false;
    cardText = "Placeholder";
    textField.value = cardText;
    makeText();
    aCardSide.material.map = null;
    aCardSide.material.needsUpdate = true;
    bCardSide.material.map = null;
    bCardSide.material.needsUpdate = true;
    bTextures = [];
    gifIsReady = false;
    renderer.render(scene, camera);
  });

  const centerImage = (t) => {
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
    if (!this.files.length) return;
    let userImageURL = URL.createObjectURL(this.files[0]);
    textureLoader.load(userImageURL, (t) => {
      if (t.image.width > t.image.height) {
        centerImage(t);
      }
      aCardSide.material.map = t;
      aCardSide.material.needsUpdate = true;
      renderer.render(scene, camera);
    });
    gifIsReady = false;
    this.value = null;
  });

  bSideinput.addEventListener("change", function (e) {
    if (this.files.length > 3) {
      gifIsReady = false;
      alert("Max 3 files");
      return;
    }
    if (this.files.length < 3) {
      gifIsReady = false;
      alert("Min 3 files");
      return;
    }
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
    this.value = null;
  });

  saveAsGif.addEventListener("click", () => {
    if (!rotated && gifIsReady) {
      capturer.save();
    } else {
      alert("Make a preview");
    }
  });

  initThree();
};

const changeBTexture = () => {
  gifIsReady = false;
  let r = card.rotation.y;
  if (r >= Math.PI * 2 && r <= Math.PI * 2 * 2) {
    bCardSide.material.map = bTextures[1];
  }
  if (card.rotation.y >= Math.PI * 2 * 2) {
    bCardSide.material.map = bTextures[2];
  }
  if (card.rotation.y >= Math.PI * 2 * 3) {
    bCardSide.material.map = bTextures[2];
    window.cancelAnimationFrame(id);
    card.rotation.y = 0;
    rotated = false;
    capturer.stop();
    gifIsReady = true;
  }

  bCardSide.material.needsUpdate = true;
};

const checkLoading = (e) => {
  modalWindow.style.display = e >= 1 ? "none" : "flex";
  progress.value = e;
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
    onProgress: (e) => checkLoading(e),
  });
  initListeners();
};

const makeText = () => {
  gifIsReady = false;
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
  renderer.render(scene, camera);
};

const animate = function () {
  id = requestAnimationFrame(animate);
  card.rotation.y += 0.015;
  changeBTexture();
  renderer.render(scene, camera);
  capturer.capture(renderer.domElement);
};

init();
