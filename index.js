import * as THREE from "./js/three.module.js";
//const aSideinput = document.querySelector(".a-side");
const bSideinput = document.querySelector(".b-side");
const previewButton = document.querySelector(".preview");
const reset = document.querySelector(".reset");
const textFieldTop = document.querySelector(".top");
const textFieldCenter = document.querySelector(".center");
const textFieldBottom = document.querySelector(".bottom");
const textFieldLast = document.querySelector(".last");
const saveAsGif = document.querySelector(".gif");
const saveAsVideo = document.querySelector(".video");
const canvas = document.querySelector("#render");
const modalWindow = document.querySelector(".modal");
const progress = document.querySelector("#progress");
const textPicker = document.querySelector("#textPicker");
const sloganPicker = document.querySelector("#sloganPicker");
const previewCanvas = document.querySelector("#previewCanvas");
const ctx = previewCanvas.getContext("2d");
const modal = document.getElementById("myModal");
const closePreviewModalBtn = document.getElementsByClassName("close")[0];

let capturer,
  recordedChunks,
  mediaRecorder,
  videoFormat = false,
  topText,
  text,
  bottomText,
  lastText,
  defaultTextMaterialColor = "#8c6b3c",
  textMaterial = new THREE.MeshStandardMaterial({
    color: defaultTextMaterialColor,
    metalness: 0.6,
    roughness: 0.4,
  }),
  defaultSloganMaterialColor = "#d76863",
  lastTextMaterial = new THREE.MeshBasicMaterial({
    color: defaultSloganMaterialColor,
  }),
  bTextures = [],
  cardTextTop = "The",
  cardTextCenter = "WILLIAMS",
  cardTextBottom = "Family",
  cardTextLast = "poppins",
  gifIsReady = false,
  rotated = false,
  fontLoader = new THREE.FontLoader(),
  centerFont,
  topBottomFont,
  lastFont,
  outlineMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c6b3c,
    metalness: 0.6,
    roughness: 0.4,
  }),
  renderer,
  camera,
  scene,
  aCardSide,
  bCardSide,
  id,
  card;

const textureLoader = new THREE.TextureLoader();
const cardSize = { x: 15, y: 21 };
textPicker.textContent = defaultTextMaterialColor;
sloganPicker.textContent = defaultSloganMaterialColor;

const previewModal = () => {
  modal.style.display = "none";
  document.body.style = "overflow: unset";
};
const closePreviewModal = (e) => {
  if (e.target == modal) {
    modal.style.display = "none";
    document.body.style = "overflow: unset";
  }
};

closePreviewModalBtn.addEventListener("click", previewModal);
// When the user clicks anywhere outside of the modal, close it
window.addEventListener("click", closePreviewModal);

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

  previewCanvas.width = canvas.clientWidth;
  previewCanvas.height = canvas.clientHeight;

  camera.position.z = 39;
  let rightLight = new THREE.PointLight(0xffffff, 1, 60);
  rightLight.position.set(10, 0, 50);
  scene.add(rightLight);

  let leftLight = new THREE.PointLight(0xffffff, 1, 60);
  leftLight.position.set(-10, 0, 50);
  scene.add(leftLight);

  scene.add(new THREE.AmbientLight());

  card = new THREE.Group();
  card.add(
    new THREE.Mesh(
      new THREE.BoxBufferGeometry(cardSize.x + 0.4, cardSize.y + 0.4, 0.15),
      outlineMaterial
    )
  );
  const geometry = new THREE.PlaneGeometry(cardSize.x, cardSize.y);

  aCardSide = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  bCardSide = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  aCardSide.position.z = 0.1;
  bCardSide.position.z = -0.1;
  bCardSide.rotation.y = Math.PI;
  card.add(aCardSide);
  card.add(bCardSide);
  scene.add(card);
  //disableElements();
};

const download = () => {
  var blob = new Blob(recordedChunks, {
    type: "video/mp4",
  });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = new Date() + ".mp4";
  a.click();
  window.URL.revokeObjectURL(url);
  a.href = "";
};

const handleDataAvailable = (event) => {
  if (event.data.size > 0) {
    recordedChunks.push(event.data);
    download();
  }
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

  textFieldLast.addEventListener("input", ({ target }) => {
    card.remove(lastText);
    lastText.geometry.dispose();
    cardTextLast = target.value;
    card.rotation.y = 0;
    renderer.render(scene, camera);
    makeLastText();
  });

  previewButton.addEventListener("click", (e) => {
    if (!bTextures.length) {
      alert("Choose images for change side");
      return;
    }
    if (!rotated) {
      modal.style.display = "block";
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

  // aSideinput.addEventListener("change", function (e) {
  //   if (!this.files.length) return;
  //   let userImageURL = URL.createObjectURL(this.files[0]);
  //   textureLoader.load(userImageURL, (t) => {
  //     if (t.image.width > t.image.height) {
  //       centerImage(t);
  //     }
  //     aCardSide.material.map = t;
  //     aCardSide.material.needsUpdate = true;
  //     card.rotation.y = 0;
  //     renderer.render(scene, camera);
  //   });
  //   gifIsReady = false;
  //   this.value = null;
  // });

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

  saveAsVideo.addEventListener("click", ({ target }) => {
    if (!bTextures.length) {
      alert("Choose images for change side");
      return;
    }

    if (!rotated) {
      modal.style.display = "block";
      videoFormat = true;
      card.rotation.y = 0;
      rotated = true;
      let stream = canvas.captureStream();
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.start();
      animate();
    }
  });

  initThree();
};

const disableElements = () => {
  textFieldTop.disabled = true;
  textFieldCenter.disabled = true;
  textFieldBottom.disabled = true;
  //aSideinput.disabled = true;
  //aSideinput.parentElement.classList.add("disabled");
  bSideinput.disabled = true;
  bSideinput.parentElement.classList.add("disabled");
  reset.classList.add("disabled");
  previewButton.classList.add("disabled");
  saveAsGif.classList.add("disabled");
  saveAsGif.textContent = "Wait";
  saveAsVideo.classList.add("disabled");
  saveAsVideo.textContent = "Wait";
  document.body.style = "overflow: hidden";
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  closePreviewModalBtn.classList.add("disabled");
  closePreviewModalBtn.removeEventListener("click", previewModal);
  window.removeEventListener("click", closePreviewModal);
};

const enableElements = () => {
  textFieldTop.disabled = false;
  textFieldCenter.disabled = false;
  textFieldBottom.disabled = false;
  //aSideinput.disabled = false;
  //aSideinput.parentElement.classList.remove("disabled");
  bSideinput.disabled = false;
  bSideinput.parentElement.classList.remove("disabled");
  reset.classList.remove("disabled");
  previewButton.classList.remove("disabled");
  saveAsGif.classList.remove("disabled");
  saveAsGif.textContent = "Download as Gif";
  saveAsVideo.classList.remove("disabled");
  saveAsVideo.textContent = "Download as video";
  closePreviewModalBtn.classList.remove("disabled");
  closePreviewModalBtn.addEventListener("click", previewModal);
  window.addEventListener("click", closePreviewModal);
};

const changeBTextureGif = () => {
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

const changeBTextureVideo = () => {
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
    mediaRecorder.stop();
    videoFormat = false;
    bCardSide.material.map = bTextures[0];
    enableElements();
  }

  bCardSide.material.needsUpdate = true;
};

const checkLoading = (e) => {
  modalWindow.style.display = e >= 1 ? "none" : "flex";
  progress.value = e;
};

const asyncFontLoading = (url) => {
  return new Promise((res, rej) => {
    fontLoader.load(url, (font) => {
      res(font),
        (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% loaded"),
        (err) => rej(err);
    });
  });
};

const init = () => {
  Promise.all([
    asyncFontLoading("./fonts/helvetiker_italic.json"),
    asyncFontLoading("./fonts/helvetiker_bold.json"),
    asyncFontLoading("./fonts/Poppins_italic.json"),
  ])
    .then(
      (res) => {
        topBottomFont = res[0];
        centerFont = res[1];
        lastFont = res[2];
      },
      (err) => console.error(err)
    )
    .then(() => {
      makeTopText();
      makeCenterText();
      makeBottomText();
      makeLastText();
    });

  capturer = new CCapture({
    format: "gif",
    workersPath: "js/",
    framerate: 60,
    onProgress: (e) => checkLoading(e),
  });
  initListeners();
  initColorPickers();
};

const getTextOffset = (text) =>
  -0.5 * (text.boundingBox.max.x - text.boundingBox.min.x);

const makeTopText = () => {
  gifIsReady = false;
  const gTop = new THREE.TextGeometry(cardTextTop, {
    font: topBottomFont,
    size: 0.7,
    height: 0.3,
  });

  gTop.computeBoundingBox();

  topText = new THREE.Mesh(gTop, textMaterial);

  topText.position.set(getTextOffset(gTop), 2.3, 0.3);

  card.add(topText);
  renderer.render(scene, camera);
};

const makeCenterText = () => {
  gifIsReady = false;

  const gCeneter = new THREE.TextGeometry(cardTextCenter, {
    font: centerFont,
    size: 1.42,
    height: 0.3,
  });

  gCeneter.computeBoundingBox();

  text = new THREE.Mesh(gCeneter, textMaterial);

  text.position.set(getTextOffset(gCeneter), 0.5, 0.3);
  card.add(text);
  renderer.render(scene, camera);
};

const makeBottomText = () => {
  gifIsReady = false;
  const gBottom = new THREE.TextGeometry(cardTextBottom, {
    font: topBottomFont,
    size: 0.7,
    height: 0.3,
  });

  gBottom.computeBoundingBox();

  bottomText = new THREE.Mesh(gBottom, textMaterial);

  bottomText.position.set(getTextOffset(gBottom), -0.5, 0.3);

  card.add(bottomText);
  renderer.render(scene, camera);
};

const makeLastText = () => {
  gifIsReady = false;

  const gLast = new THREE.TextGeometry(cardTextLast, {
    font: lastFont,
    size: 1.2,
    height: 0.1,
  });

  gLast.computeBoundingBox();

  lastText = new THREE.Mesh(gLast, lastTextMaterial);

  lastText.position.set(getTextOffset(gLast), -3.2, 0.1);

  card.add(lastText);
  renderer.render(scene, camera);
};

const isDark = (color) => {
  var rgb = parseInt(color, 16); // convert rrggbb to decimal
  var r = (rgb >> 16) & 0xff; // extract red
  var g = (rgb >> 8) & 0xff; // extract green
  var b = (rgb >> 0) & 0xff; // extract blue

  var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
  return luma < 120;
};

const initColorPickers = () => {
  var picker = new Picker({
    parent: textPicker,
    color: defaultTextMaterialColor,
    alpha: false,
    editorFormat: "hex",
    onOpen: () => {
      card.rotation.y = 0;
      renderer.render(scene, camera);
    },
    onChange: (color) => {
      textPicker.style.backgroundColor = color.rgbaString;
      textMaterial.color = new THREE.Color(color.hex.slice(0, 7));
      textMaterial.needsUpdate = true;
      renderer.render(scene, camera);
    },
    onClose: (color) => {
      textPicker.textContent = color.hex.slice(0, 7);
      textPicker.style.color = isDark(color.hex.slice(1, 7))
        ? "white"
        : "black";
    },
  });

  var picker2 = new Picker({
    parent: sloganPicker,
    color: defaultSloganMaterialColor,
    alpha: false,
    editorFormat: "hex",
    onOpen: () => {
      card.rotation.y = 0;
      renderer.render(scene, camera);
    },
    onChange: function (color) {
      sloganPicker.style.backgroundColor = color.rgbaString;
      lastTextMaterial.color = new THREE.Color(color.hex.slice(0, 7));
      lastTextMaterial.needsUpdate = true;
      renderer.render(scene, camera);
    },
    onClose: (color) => {
      sloganPicker.textContent = color.hex.slice(0, 7);
      sloganPicker.style.color = isDark(color.hex.slice(1, 7))
        ? "white"
        : "black";
    },
  });
};

const animate = function () {
  id = requestAnimationFrame(animate);
  card.rotation.y += 0.015;
  if (videoFormat) {
    changeBTextureVideo();
    renderer.render(scene, camera);
  } else {
    changeBTextureGif();
    renderer.render(scene, camera);
    capturer.capture(renderer.domElement);
  }
  ctx.drawImage(renderer.domElement, 0, 0);
};

init();

$(".slider").on("click", function (e) {
  if (e.target.tagName === "IMG") {
    textureLoader.load(e.target.src, (t) => {
      aCardSide.material.map = t;
      aCardSide.material.needsUpdate = true;
      card.rotation.y = 0;
      renderer.render(scene, camera);
    });
    gifIsReady = false;
  }
});
