import * as THREE from "./js/three.module.js";
const aSideinput = document.querySelector(".a-side");
const bSideinput = document.querySelector(".b-side");
const previewButton = document.querySelector(".preview");
const reset = document.querySelector(".reset");
const textFieldTop = document.querySelector(".top");
const textFieldCenter = document.querySelector(".center");
const textFieldBottom = document.querySelector(".bottom");
const saveAsGif = document.querySelector(".make-gif");
const canvas = document.querySelector("#render");
const modalWindow = document.querySelector(".modal");
const progress = document.querySelector("#progress");

let capturer,
  topText,
  text,
  bottomText,
  textMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.5,
    roughness: 0.5,
  }),
  bTextures = [],
  cardTextTop = "The",
  cardTextCenter = "Placeholder",
  cardTextBottom = "Family",
  gifIsReady = false,
  rotated = false,
  fontLoader = new THREE.FontLoader(),
  centerFont,
  topBottomFont,
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
  //disableElements();
};

const initListeners = () => {
  textFieldTop.addEventListener("input", ({ target }) => {
    card.remove(topText);
    topText.geometry.dispose();
    cardTextTop = target.value;
    card.rotation.y = 0;
    renderer.render(scene, camera);
    makeTopText();
  });
  textFieldCenter.addEventListener("input", ({ target }) => {
    card.remove(text);
    text.geometry.dispose();
    cardTextCenter = target.value;
    card.rotation.y = 0;
    renderer.render(scene, camera);
    makeCenterText();
  });
  textFieldBottom.addEventListener("input", ({ target }) => {
    card.remove(bottomText);
    bottomText.geometry.dispose();
    cardTextBottom = target.value;
    card.rotation.y = 0;
    renderer.render(scene, camera);
    makeBottomText();
  });

  previewButton.addEventListener("click", (e) => {
    if (!bTextures.length) {
      alert("Choose images for change side");
      return;
    }
    if (!rotated) {
      card.rotation.y = 0;
      capturer.reset();
      capturer.start();
      rotated = true;
      animate();
    }
  });

  reset.addEventListener("click", ({ target }) => {
    if (target.classList.contains("disabled")) return;
    card.remove(text);
    capturer.reset();
    rotated = false;
    card.remove(topText);
    topText.geometry.dispose();
    cardTextTop = "The";
    textFieldTop.value = cardTextTop;
    makeTopText();
    card.remove(text);
    text.geometry.dispose();
    cardTextCenter = "Placeholder";
    textFieldCenter.value = cardTextCenter;
    makeCenterText();
    card.remove(bottomText);
    bottomText.geometry.dispose();
    cardTextBottom = "Family";
    textFieldBottom.value = cardTextBottom;
    makeBottomText();
    if (aCardSide.material.map) aCardSide.material.map.dispose();
    aCardSide.material.map = null;
    aCardSide.material.needsUpdate = true;
    if (bCardSide.material.map) bCardSide.material.map.dispose();
    bCardSide.material.needsUpdate = true;
    bCardSide.material.map = null;
    bTextures = [];
    gifIsReady = false;
    card.rotation.y = 0;
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
      card.rotation.y = 0;
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
        card.rotation.y = Math.PI;
        renderer.render(scene, camera);
      });
    }
    gifIsReady = false;
    this.value = null;
  });

  saveAsGif.addEventListener("click", ({ target }) => {
    if (!rotated && gifIsReady) {
      capturer.save();
    } else if (target.classList.contains("disabled")) {
      return;
    } else {
      alert("Make a preview");
    }
  });

  initThree();
};

const disableElements = () => {
  textFieldTop.disabled = true;
  textFieldCenter.disabled = true;
  textFieldBottom.disabled = true;
  aSideinput.disabled = true;
  aSideinput.parentElement.classList.add("disabled");
  bSideinput.disabled = true;
  bSideinput.parentElement.classList.add("disabled");
  reset.classList.add("disabled");
  previewButton.classList.add("disabled");
  saveAsGif.classList.add("disabled");
  saveAsGif.textContent = "Wait";
};

const enableElements = () => {
  textFieldTop.disabled = false;
  textFieldCenter.disabled = false;
  textFieldBottom.disabled = false;
  aSideinput.disabled = false;
  aSideinput.parentElement.classList.remove("disabled");
  bSideinput.disabled = false;
  bSideinput.parentElement.classList.remove("disabled");
  reset.classList.remove("disabled");
  previewButton.classList.remove("disabled");
  saveAsGif.classList.remove("disabled");
  saveAsGif.textContent = "Download as Gif";
};
const changeBTexture = () => {
  gifIsReady = false;
  disableElements();
  if (card.rotation.y >= Math.PI * 2 && card.rotation.y <= Math.PI * 2 * 2) {
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
    bCardSide.material.map = bTextures[0];
    enableElements();
  }

  bCardSide.material.needsUpdate = true;
};

const checkLoading = (e) => {
  modalWindow.style.display = e >= 1 ? "none" : "flex";
  progress.value = e;
};

const init = () => {
  fontLoader.load("./helvetiker_italic.typeface.json", (response) => {
    topBottomFont = response;
    makeTopText();
    makeBottomText();
    fontLoader.load("./helvetiker_bold.typeface.json", (response) => {
      centerFont = response;
      makeCenterText();
    });
  });

  capturer = new CCapture({
    format: "gif",
    workersPath: "js/",
    framerate: 60,
    onProgress: (e) => checkLoading(e),
  });
  initListeners();
};

const getTextOffset = (text) =>
  -0.5 * (text.boundingBox.max.x - text.boundingBox.min.x);

const makeTopText = () => {
  gifIsReady = false;
  const gTop = new THREE.TextGeometry(cardTextTop, {
    font: topBottomFont,
    size: 1,
    height: 0.1,
  });

  gTop.computeBoundingBox();

  topText = new THREE.Mesh(gTop, textMaterial);

  topText.position.set(getTextOffset(gTop), 3, 0.1);

  card.add(topText);
  renderer.render(scene, camera);
};

const makeCenterText = () => {
  gifIsReady = false;

  const gCeneter = new THREE.TextGeometry(cardTextCenter, {
    font: centerFont,
    size: 1.6,
    height: 0.1,
  });

  gCeneter.computeBoundingBox();

  text = new THREE.Mesh(gCeneter, textMaterial);

  text.position.set(getTextOffset(gCeneter), 0, 0.1);
  card.add(text);
  renderer.render(scene, camera);
};

const makeBottomText = () => {
  gifIsReady = false;
  const gBottom = new THREE.TextGeometry(cardTextBottom, {
    font: topBottomFont,
    size: 1,
    height: 0.1,
  });

  gBottom.computeBoundingBox();

  bottomText = new THREE.Mesh(gBottom, textMaterial);

  bottomText.position.set(getTextOffset(gBottom), -3, 0.1);

  card.add(bottomText);
  renderer.render(scene, camera);
};

const animate = function () {
  id = requestAnimationFrame(animate);
  card.rotation.y += 0.15;
  changeBTexture();
  renderer.render(scene, camera);
  capturer.capture(renderer.domElement);
};

init();
