import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.163.0/three.module.js";
import * as BufferGeometryUtils from "https://cdn.skypack.dev/three@0.133.1/examples/jsm/utils/BufferGeometryUtils.js";

//게임 설정 변경

//디버그모드
const DebugMode = false;

//플레이어 이름
const player1name = "Player 1";
const player2name = "Player 2";
//주사위 질량
const DiceMass = 500;
//마찰, 탄성계수
const Dice2Dice = [0, 0.3];
const Dice2Floor = [0.2, 0.3];
const Dice2Wall = [0.1, 0.7];
//벽 재질(matalness, roughness)
const CarpetTexture = [0.1, 0.5];
const WallTexture = [0.7, 0.3];
//주사위 정지 후 정렬까지 걸리는 시간(ms)
const DiceStopDelay = 330;
//주사위 던지는 위치
const targetX = -15;
//굴리기 쿨타임(ms)
const CoolTime = 200;

//-------------

let scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 10); // 박스 위에서 아래를 바라보도록 카메라 위치 조정
camera.lookAt(0, 0, 0);

let renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);

// function resizeCanvas() {
//   const canvasContainer = document.getElementById("canvasContainer");
//   const width = canvasContainer.clientWidth;
//   const height = canvasContainer.clientHeight;

//   renderer.setSize(width, height);
//   camera.aspect = width / height;
//   camera.updateProjectionMatrix();
// }

// // 초기 캔버스 크기 설정
// resizeCanvas();

// // 창 크기 변경 이벤트 리스너 등록
// window.addEventListener("resize", resizeCanvas);

const canvasContainer = document.getElementById("canvasContainer");
canvasContainer.appendChild(renderer.domElement);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Cannon.js 물리 세계 생성
let world = new CANNON.World();
world.gravity.set(0, 0, -9.82); // 중력 설정

const AmbientLight = new THREE.AmbientLight(0xfffefa, 0.4);
const PointLight = new THREE.PointLight(0xfffffc, 900);
const HemisphereLight = new THREE.HemisphereLight(0xffefe3, 0xfffef5, 0.4);
// const Light = new THREE.DirectionalLight(0xffffff, 3);

PointLight.position.set(3, 3, 20);
PointLight.castShadow = true;
// Light.target.position.set(0, 0, 0);
PointLight.shadow.radius = 3;

// 그림자 맵의 해상도를 높임
PointLight.shadow.mapSize.width = 1024;
PointLight.shadow.mapSize.height = 1024;
// 그림자 카메라의 보이는 범위 조절
// PointLight.shadow.camera.near = 0.5;
// PointLight.shadow.camera.far = 50;
// PointLight.shadow.camera.left = -10;
// PointLight.shadow.camera.right = 10;
// PointLight.shadow.camera.top = 10;
// PointLight.shadow.camera.bottom = -10;

scene.add(PointLight);
scene.add(HemisphereLight);
scene.add(AmbientLight);

const settingsIcon = document.getElementById("settingsIcon");
const settingsPopup = document.getElementById("settingsPopup");
const applySettingsButton = document.getElementById("applySettings");
const closeSettingsButton = document.getElementById("closeSettings");

settingsIcon.addEventListener("click", () => {
  settingsPopup.classList.toggle("hidden");
});

applySettingsButton.addEventListener("click", () => {
  const lightQuality = document.getElementById("lightQuality").value;
  const shadowQuality = document.getElementById("shadowQuality").value;

  // 빛 품질 설정 적용
  switch (lightQuality) {
    case "high":
      AmbientLight.visible = true;
      PointLight.visible = true;
      HemisphereLight.visible = true;
      break;
    case "medium":
      AmbientLight.visible = true;
      PointLight.visible = true;
      HemisphereLight.visible = false;
      break;
    case "low":
      AmbientLight.visible = false;
      PointLight.visible = true;
      HemisphereLight.visible = false;
      break;
  }

  // 그림자 품질 설정 적용
  switch (shadowQuality) {
    case "on":
      PointLight.shadow.mapSize.width = 1024;
      PointLight.shadow.mapSize.height = 1024;
      PointLight.castShadow = true;
      break;
    case "off":
      PointLight.castShadow = false;
      break;
  }
});

closeSettingsButton.addEventListener("click", () => {
  settingsPopup.classList.add("hidden");
});

function resizeCanvas() {
  const canvasContainer = document.getElementById("canvasContainer");
  const scoreBoard = document.querySelector(".user");
  const scoreBoardWidth = scoreBoard.offsetWidth;

  const width = window.innerWidth + scoreBoardWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // 주사위 박스 위치 조정
  const boxWidth = 10;
  const boxHeight = 10;
  const boxPositionX = (width - boxWidth) / 2;
  const boxPositionY = (height - boxHeight) / 2;

  // 벽 위치 조정
  const walls = [
    { position: new CANNON.Vec3(boxPositionX, boxPositionY + 5, 1) }, // 앞쪽 벽
    { position: new CANNON.Vec3(boxPositionX, boxPositionY - 5, 1) }, // 뒤쪽 벽
    { position: new CANNON.Vec3(boxPositionX + 5, boxPositionY, 1) }, // 오른쪽 벽
    { position: new CANNON.Vec3(boxPositionX - 5, boxPositionY, 1) }, // 왼쪽 벽
  ];

  walls.forEach((wall, index) => {
    const wallBody = world.bodies.find((body) => body.id === index + 1);
    if (wallBody) {
      wallBody.position.copy(wall.position);
    }
  });
}

// 초기 캔버스 크기 설정
resizeCanvas();

// // 창 크기 변경 이벤트 리스너 등록
// window.addEventListener("resize", resizeCanvas);

//플레이어
// Player 클래스 추가
class Player {
  constructor(name) {
    this.name = name;
    this.scores = {};
    this.totalScore = 0;
    this.bonusScore = 0;
  }

  addScore(category, score) {
    this.scores[category] = score;
    this.totalScore += score;
    this.updateBonusScore();
  }

  updateBonusScore() {
    const categories = ["Aces", "Deuces", "Threes", "Fours", "Fives", "Sixes"];
    const subtotal = categories.reduce(
      (sum, category) => sum + (this.scores[category] || 0),
      0
    );
    this.bonusScore = subtotal >= 63 ? 35 : 0;
  }
}

let particleSystem = null;

class ParticleSystem {
  constructor(scene, count, color, size) {
    this.particles = [];
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      color: 0xcfff8c,
      size: size,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });

    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    this.particleSystem = new THREE.Points(this.geometry, this.material);
    scene.add(this.particleSystem);
  }

  update() {
    const positions = this.geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= Math.random() * 0.007;
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  destroy() {
    this.particleSystem.geometry.dispose();
    this.particleSystem.material.dispose();
    scene.remove(this.particleSystem);
  }
}

const mainScreen = document.getElementById("mainScreen");
const playWithFriendButton = document.getElementById("playWithFriendButton");
const playWithComputerButton = document.getElementById(
  "playWithComputerButton"
);

playWithFriendButton.addEventListener("click", () => {
  mainScreen.style.display = "none";
  playerNameForm.style.display = "block";
});

playWithComputerButton.addEventListener("click", () => {
  mainScreen.style.display = "none";
  startGameWithComputer();
});

function startGameWithComputer() {
  // const randomOrder = Math.random() < 0.5;
  // if (randomOrder) {
  //   player1.name = "Player";
  //   player2.name = "Computer";
  // } else {
  //   player1.name = "Computer";
  //   player2.name = "Player";
  //   renderScoreBoard();
  //   resetAndRollDice();
  //   setTimeout(() => {
  //     computerTurn();
  //   }, 1000);
  // }

  player1.name = "Computer";
  player2.name = "Player";

  const displayPlayer1Name = player1.name;
  const displayPlayer2Name = player2.name;

  document.querySelector(".player1").textContent = displayPlayer1Name;
  document.querySelector(".player2").textContent = displayPlayer2Name;
  document.getElementById(
    "currentPlayer"
  ).textContent = `${currentPlayer.name}`;
  const nextPlayerElement = document.querySelector(".nextplayer");
  nextPlayerElement.textContent = `${currentPlayer.name.slice(0, 10)}${
    currentPlayer.name.length > 10 ? "..." : ""
  } Turn`;
  nextPlayerElement.style.opacity = "1";
  setTimeout(() => {
    nextPlayerElement.style.opacity = "0";
  }, 1200);

  isGameStarted = true;

  renderScoreBoard();
  resetAndRollDice();
  setTimeout(() => {
    computerTurn();
  }, 1000);
}

async function computerTurn() {
  isComputerTurn = true;
  rollDiceButton.disabled = true;

  let keptDiceIndices = []; // 누적된 keptDiceIndices 배열 선언

  if (rollCount < 3 && keptDice.length < 5) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    resetAndRollDice();
    rollDiceButton.disabled = true;
    await new Promise((resolve) => setTimeout(resolve, 700));
    resetAndRollDice();
    rollDiceButton.disabled = true;
    while (!diceStopped) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    await new Promise((resolve) => setTimeout(resolve, 1400));
    const diceResults = diceMeshes
      .map((diceMesh) => findTopFace(diceMesh))
      .map(Number);

    // 이전에 선택된 keptDiceIndices를 전달하여 누적된 결과 사용
    const selectedDiceIndices = selectKeptDice(
      diceResults,
      rollCount,
      keptDiceIndices
    );
    keptDiceIndices = [...keptDiceIndices, ...selectedDiceIndices]; // 선택된 주사위 인덱스 누적
    selectedDiceIndices.forEach((index) => {
      if (!keptDice.includes(index)) {
        keptDice.push(index);
      }
    });
    positionKeptDice();
    await new Promise((resolve) => setTimeout(resolve, 700));
    await computerTurn();
  } else {
    while (!diceStopped) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    const finalDiceResults = diceMeshes
      .map((diceMesh) => findTopFace(diceMesh))
      .map(Number);

    const category = selectCategory(finalDiceResults);
    const score = judge.scoreBoard(finalDiceResults)[category];

    await new Promise((resolve) => setTimeout(resolve, 400));
    selectScore(category, score);
  }
}

function selectKeptDice(diceResults, rollCount, keptDiceIndices) {
  const counts = {};
  diceResults.forEach((dice) => {
    counts[dice] = (counts[dice] || 0) + 1;
  });

  const maxCount = Math.max(...Object.values(counts));

  const sortedDiceValues = [...diceResults].sort((a, b) => a - b);
  const uniqueDiceValues = [...new Set(sortedDiceValues)];
  const isStraightPossible = uniqueDiceValues.some((diceValue, index) => {
    if (index <= uniqueDiceValues.length - 4) {
      const slice = uniqueDiceValues.slice(index, index + 4);
      return slice[3] - slice[0] === 3;
    }
    return false;
  });

  if (isStraightPossible) {
    if (currentPlayer.scores["S. Straight"] === undefined) {
      const straightDice = [];

      for (let i = 0; i < uniqueDiceValues.length - 1; i++) {
        if (uniqueDiceValues[i + 1] - uniqueDiceValues[i] === 1) {
          straightDice.push(uniqueDiceValues[i]);
          straightDice.push(uniqueDiceValues[i + 1]);
        }
      }

      const uniqueStraightDice = [...new Set(straightDice)];
      const keptDiceIndices = [];

      uniqueStraightDice.forEach((diceValue) => {
        const indices = diceResults.reduce((acc, dice, index) => {
          if (dice === diceValue && !keptDiceIndices.includes(index)) {
            acc.push(index);
          }
          return acc;
        }, []);
        keptDiceIndices.push(...indices.slice(0, 1));
      });

      return keptDiceIndices;
    } else if (
      keptDiceIndices.length === 0 &&
      currentPlayer.scores["S. Straight"] !== undefined &&
      currentPlayer.scores["L. Straight"] === undefined
    ) {
      const straightDice = [];

      for (let i = 0; i < uniqueDiceValues.length - 1; i++) {
        if (uniqueDiceValues[i + 1] - uniqueDiceValues[i] === 1) {
          straightDice.push(uniqueDiceValues[i]);
          straightDice.push(uniqueDiceValues[i + 1]);
        }
      }

      const uniqueStraightDice = [...new Set(straightDice)];
      const keptDiceIndices = [];

      uniqueStraightDice.forEach((diceValue) => {
        const indices = diceResults.reduce((acc, dice, index) => {
          if (dice === diceValue && !keptDiceIndices.includes(index)) {
            acc.push(index);
          }
          return acc;
        }, []);
        keptDiceIndices.push(...indices.slice(0, 1));
      });

      return keptDiceIndices;
    }
  }

  if (maxCount >= 4) {
    const categoryNames = [
      "",
      "Aces",
      "Deuces",
      "Threes",
      "Fours",
      "Fives",
      "Sixes",
    ];
    const maxCountDice = parseInt(
      Object.keys(counts).find((key) => counts[key] === maxCount)
    );
    const remainingDice = diceResults.find((dice) => dice !== maxCountDice);
    const remainingDiceCategory = `${categoryNames[remainingDice]}`;

    if (
      currentPlayer.scores[`${categoryNames[maxCountDice]}`] !== undefined &&
      currentPlayer.scores["Choice"] !== undefined &&
      currentPlayer.scores["4 of a Kind"] !== undefined &&
      currentPlayer.scores["Yacht"] !== undefined &&
      currentPlayer.scores[remainingDiceCategory] === undefined
    ) {
      // 4개 나온 수 카테고리, Choice, 4 of a Kind, Yacht이 모두 기록되었고,
      // 남은 주사위 수의 카테고리가 아직 기록되지 않은 경우
      diceResults.forEach((dice, index) => {
        if (dice === remainingDice && !keptDiceIndices.includes(index)) {
          keptDiceIndices.push(index);
        }
      });
    } else if (
      currentPlayer.scores[`${categoryNames[maxCountDice]}`] !== undefined &&
      currentPlayer.scores["Choice"] !== undefined &&
      currentPlayer.scores["4 of a Kind"] !== undefined &&
      currentPlayer.scores["Yacht"] !== undefined &&
      currentPlayer.scores[remainingDiceCategory] !== undefined
    ) {
      // 4개 나온 수 카테고리, Choice, 4 of a Kind, Yacht이 모두 기록되었고,
      // 남은 주사위 수의 카테고리도 기록된 경우
      // 모두 킵하지 않고 다시 굴림 (keptDiceIndices를 변경하지 않음)
    } else {
      // 기존 로직 유지
      diceResults.forEach((dice, index) => {
        if (dice === maxCountDice && !keptDiceIndices.includes(index)) {
          keptDiceIndices.push(index);
        }
      });
    }
  } else if (maxCount === 3) {
    const maxCountDice = parseInt(
      Object.keys(counts).find((key) => counts[key] === maxCount)
    );
    const categoryNames = [
      "",
      "Aces",
      "Deuces",
      "Threes",
      "Fours",
      "Fives",
      "Sixes",
    ];
    if (currentPlayer.scores[`${categoryNames[maxCountDice]}`] === undefined) {
      diceResults.forEach((dice, index) => {
        if (dice === maxCountDice && !keptDiceIndices.includes(index)) {
          keptDiceIndices.push(index);
        }
      });
    }
  } else {
  }
  if (keptDiceIndices.length === 0) {
    const upperCategories = [
      "Aces",
      "Deuces",
      "Threes",
      "Fours",
      "Fives",
      "Sixes",
    ];
    const upperScores = upperCategories.reduce(
      (sum, category) => sum + (currentPlayer.scores[category] || 0),
      0
    );

    if (upperScores >= 63) {
      // 보너스를 이미 획득한 경우, 높은 값의 주사위를 킵함
      const maxDice = Math.max(...diceResults);
      diceResults.forEach((dice, index) => {
        if (dice === maxDice && !keptDiceIndices.includes(index)) {
          keptDiceIndices.push(index);
        }
      });
    } else {
      if (
        rollCount < 2 &&
        currentPlayer.scores["Full House"] === undefined &&
        Object.values(counts).filter((count) => count >= 2).length === 2
      ) {
        // Full House를 노리는 경우
        const pairDice = Object.keys(counts)
          .filter((dice) => counts[dice] >= 2)
          .map(Number);
        diceResults.forEach((dice, index) => {
          if (pairDice.includes(dice) && !keptDiceIndices.includes(index)) {
            keptDiceIndices.push(index);
          }
        });
      } else {
        const categoryNames = [
          "",
          "Aces",
          "Deuces",
          "Threes",
          "Fours",
          "Fives",
          "Sixes",
        ];
        const availableCategories = Object.keys(counts)
          .filter(
            (dice) =>
              currentPlayer.scores[`${categoryNames[dice]}`] === undefined
          )
          .map(Number);

        if (availableCategories.length > 0) {
          const maxAvailableDice = availableCategories.reduce((a, b) =>
            counts[a] > counts[b] ? a : b
          );
          diceResults.forEach((dice, index) => {
            if (dice === maxAvailableDice && !keptDiceIndices.includes(index)) {
              keptDiceIndices.push(index);
            }
          });
        } else {
          const maxCountDice = parseInt(
            Object.keys(counts).find((key) => counts[key] === maxCount)
          );
          diceResults.forEach((dice, index) => {
            if (dice === maxCountDice && !keptDiceIndices.includes(index)) {
              keptDiceIndices.push(index);
            }
          });
        }
      }
    }
  }
  if (keptDiceIndices.length >= 1 && isStraightPossible === false) {
    const categoryNames = [
      "",
      "Aces",
      "Deuces",
      "Threes",
      "Fours",
      "Fives",
      "Sixes",
    ];
    const keptDiceValue = diceResults[keptDiceIndices[0]];
    const updatedAvailableCategories = Object.keys(counts)
      .filter(
        (dice) =>
          currentPlayer.scores[`${categoryNames[dice]}`] === undefined &&
          Number(dice) !== keptDiceValue
      )
      .map(Number);

    if (counts[keptDiceValue] > 1) {
      // 킵한 주사위와 같은 값이 2개 이상인 경우
      diceResults.forEach((dice, index) => {
        if (dice === keptDiceValue && !keptDiceIndices.includes(index)) {
          keptDiceIndices.push(index);
        }
      });
    } else if (updatedAvailableCategories.length > 0) {
      const maxAvailableDice = updatedAvailableCategories.reduce((a, b) =>
        counts[a] > counts[b] ? a : b
      );
      const maxAvailableDiceCategory = categoryNames[maxAvailableDice];

      if (
        counts[maxAvailableDice] >= 2 &&
        currentPlayer.scores[maxAvailableDiceCategory] === undefined
      ) {
        // 가장 많이 나온 주사위 값이 2개 이상이고, 해당 카테고리가 비어있는 경우
        keptDiceIndices = diceResults.reduce((indices, dice, index) => {
          if (dice === maxAvailableDice) {
            indices.push(index);
          }
          return indices;
        }, []);
      }
    }
  }

  return keptDiceIndices;
}

function selectCategory(diceResults) {
  const scores = judge.scoreBoard(diceResults);
  const upperCategories = [
    "Aces",
    "Deuces",
    "Threes",
    "Fours",
    "Fives",
    "Sixes",
  ];
  const upperScores = upperCategories.reduce(
    (sum, category) => sum + (currentPlayer.scores[category] || 0),
    0
  );
  const remainingForBonus = 63 - upperScores;

  // Yacht 확인
  if (scores["Yacht"] === 50 && currentPlayer.scores["Yacht"] === undefined) {
    return "Yacht";
  }

  if (scores["Sixes"] > 18 && currentPlayer.scores["Sixes"] === undefined) {
    return "Sixes";
  }

  if (scores["Fives"] > 15 && currentPlayer.scores["Fives"] === undefined) {
    return "Fives";
  }

  if (scores["Fours"] > 16 && currentPlayer.scores["Fours"] === undefined) {
    return "Fours";
  }

  // 4 of a Kind 확인
  if (
    scores["4 of a Kind"] > 19 &&
    currentPlayer.scores["4 of a Kind"] === undefined
  ) {
    return "4 of a Kind";
  }

  //Fours 확인
  if (scores["Fours"] > 12 && currentPlayer.scores["Fours"] === undefined) {
    return "Fours";
  }

  // 4 of a Kind 확인
  if (
    scores["4 of a Kind"] > 14 &&
    currentPlayer.scores["4 of a Kind"] === undefined
  ) {
    return "4 of a Kind";
  }

  if (scores["Threes"] > 9 && currentPlayer.scores["Threes"] === undefined) {
    return "Threes";
  }

  // Full House 확인
  if (
    scores["Full House"] > 0 &&
    currentPlayer.scores["Full House"] === undefined
  ) {
    return "Full House";
  }

  // Large Straight 확인
  if (
    scores["L. Straight"] === 30 &&
    currentPlayer.scores["L. Straight"] === undefined
  ) {
    return "L. Straight";
  }

  // Small Straight 확인
  if (
    scores["S. Straight"] === 15 &&
    currentPlayer.scores["S. Straight"] === undefined
  ) {
    return "S. Straight";
  }

  if (scores["Deuces"] > 4 && currentPlayer.scores["Deuces"] === undefined) {
    return "Deuces";
  }

  if (scores["Threes"] > 6 && currentPlayer.scores["Threes"] === undefined) {
    return "Threes";
  }

  if (scores["Fours"] > 8 && currentPlayer.scores["Fours"] === undefined) {
    return "Fours";
  }

  if (scores["Fives"] > 10 && currentPlayer.scores["Fives"] === undefined) {
    return "Fives";
  }

  if (scores["Sixes"] > 12 && currentPlayer.scores["Sixes"] === undefined) {
    return "Sixes";
  }

  // 보너스를 먹을 수 있는 상황에서 숫자 카테고리 확인
  if (remainingForBonus <= 6) {
    if (
      scores["Sixes"] >= remainingForBonus &&
      currentPlayer.scores["Sixes"] === undefined
    ) {
      return "Sixes";
    }
    if (
      scores["Fives"] >= remainingForBonus &&
      currentPlayer.scores["Fives"] === undefined
    ) {
      return "Fives";
    }
    if (
      scores["Fours"] >= remainingForBonus &&
      currentPlayer.scores["Fours"] === undefined
    ) {
      return "Fours";
    }
    if (
      scores["Threes"] >= remainingForBonus &&
      currentPlayer.scores["Threes"] === undefined
    ) {
      return "Threes";
    }
    if (
      scores["Deuces"] >= remainingForBonus &&
      currentPlayer.scores["Deuces"] === undefined
    ) {
      return "Deuces";
    }
    if (
      scores["Aces"] >= remainingForBonus &&
      currentPlayer.scores["Aces"] === undefined
    ) {
      return "Aces";
    }
  }

  // Choice 확인
  if (currentPlayer.scores["Choice"] === undefined && scores["Choice"] >= 20) {
    return "Choice";
  }

  // Aces 확인
  if (currentPlayer.scores["Aces"] === undefined) {
    return "Aces";
  }

  // Choice 확인
  if (currentPlayer.scores["Choice"] === undefined) {
    return "Choice";
  }

  // Large Straight 확인
  if (currentPlayer.scores["L. Straight"] === undefined) {
    return "L. Straight";
  }

  // 4 of a Kind 확인
  if (currentPlayer.scores["4 of a Kind"] === undefined) {
    return "4 of a Kind";
  }

  // Full House 확인
  if (currentPlayer.scores["Full House"] === undefined) {
    return "Full House";
  }

  // Small Straight 확인
  if (currentPlayer.scores["S. Straight"] === undefined) {
    return "S. Straight";
  }

  // 할거 없으면 야추 떼기
  if (currentPlayer.scores["Yacht"] === undefined) {
    return "Yacht";
  }

  if (currentPlayer.scores["Deuces"] === undefined) {
    return "Deuces";
  }

  if (currentPlayer.scores["Threes"] === undefined) {
    return "Threes";
  }

  if (currentPlayer.scores["Fours"] === undefined) {
    return "Fours";
  }

  if (currentPlayer.scores["Fives"] === undefined) {
    return "Fives";
  }

  if (currentPlayer.scores["Sixes"] === undefined) {
    return "Sixes";
  }

  // 빈 카테고리에 점수 기록
  for (const category in scores) {
    if (currentPlayer.scores[category] === undefined) {
      return category;
    }
  }
}

let isGameStarted = false;

const playerNameForm = document.getElementById("playerNameForm");
const player1NameInput = document.getElementById("player1Name");
const player2NameInput = document.getElementById("player2Name");
const startGameButton = document.getElementById("startGameButton");

// 게임 시작 버튼 클릭 이벤트 처리
startGameButton.addEventListener("click", () => {
  const player1Name = player1NameInput.value.trim();
  const player2Name = player2NameInput.value.trim();

  if (player1Name !== "" && player2Name !== "") {
    player1.name = player1Name;
    player2.name = player2Name;

    // 플레이어 이름이 5글자를 넘어가면 뒷부분을 "..."으로 대체
    const displayPlayer1Name =
      player1Name.length > 5 ? player1Name.slice(0, 5) + "..." : player1Name;
    const displayPlayer2Name =
      player2Name.length > 5 ? player2Name.slice(0, 5) + "..." : player2Name;

    document.querySelector(".player1").textContent = displayPlayer1Name;
    document.querySelector(".player2").textContent = displayPlayer2Name;
    document.getElementById(
      "currentPlayer"
    ).textContent = `${currentPlayer.name.slice(0, 10)}${
      currentPlayer.name.length > 10 ? "..." : ""
    }`;
    playerNameForm.style.display = "none"; // 플레이어 이름 입력 폼 숨기기
    isGameStarted = true;
    renderScoreBoard();
  }
});

// 플레이어 생성
const player1 = new Player(player1name);
const player2 = new Player(player2name);
let currentPlayer = player1;

// 턴 관리 변수
let rollCount = 0;
let turnEnded = false;

// 점수판 렌더링 함수 추가
function renderScoreBoard() {
  const scoreBoard = document.querySelector("#scoreBoard tbody");
  scoreBoard.innerHTML = "";

  const scores = judge.scoreBoard(diceMeshes.map(findTopFace).map(Number));

  const upperCategories = [
    "Aces",
    "Deuces",
    "Threes",
    "Fours",
    "Fives",
    "Sixes",
  ];
  const lowerCategories = [
    "Choice",
    "4 of a Kind",
    "Full House",
    "S. Straight",
    "L. Straight",
    "Yacht",
  ];

  const player1nameCell = document.querySelector(".player1");

  const player2nameCell = document.querySelector(".player2");

  upperCategories.forEach((category) => {
    const score = scores[category];
    const player1Score = player1.scores[category];
    const player2Score = player2.scores[category];

    const row = document.createElement("tr");

    const categoryCell = document.createElement("td");
    let iconClass = "";
    switch (category) {
      case "Aces":
        iconClass = "fa-dice-one";
        break;
      case "Deuces":
        iconClass = "fa-dice-two";
        break;
      case "Threes":
        iconClass = "fa-dice-three";
        break;
      case "Fours":
        iconClass = "fa-dice-four";
        break;
      case "Fives":
        iconClass = "fa-dice-five";
        break;
      case "Sixes":
        iconClass = "fa-dice-six";
        break;
    }
    categoryCell.innerHTML = `<i class="fas ${iconClass}"></i> ${category}`;
    categoryCell.classList.add("category");
    row.appendChild(categoryCell);

    const player1ScoreCell = document.createElement("td");
    if (player1Score === undefined && rollCount > 0) {
      if (currentPlayer === player1 && rollState === "ready") {
        player1ScoreCell.textContent = score;
        player1ScoreCell.classList.add("selectable");
        if (!isComputerTurn) {
          player1ScoreCell.addEventListener("click", () => {
            selectScore(category, score);
          });
        }
      } else {
        player1ScoreCell.textContent = "";
      }
    } else {
      player1ScoreCell.textContent = player1Score;
    }
    if (
      player1Score !== undefined &&
      lastClickedScore &&
      lastClickedScore.player === player1 &&
      lastClickedScore.category === category
    ) {
      player1ScoreCell.classList.add("score-stamp");
      lastClickedScore = null;
    }
    if (currentPlayer === player1) {
      player1ScoreCell.classList.add("current-player");
    }

    player1ScoreCell.classList.add("user-score");
    row.appendChild(player1ScoreCell);

    const player2ScoreCell = document.createElement("td");
    if (player2Score === undefined && rollCount > 0) {
      if (currentPlayer === player2 && rollState === "ready") {
        player2ScoreCell.textContent = score;
        player2ScoreCell.classList.add("selectable");
        if (!isComputerTurn) {
          player2ScoreCell.addEventListener("click", () => {
            selectScore(category, score);
          });
        }
      } else {
        player2ScoreCell.textContent = "";
      }
    } else {
      player2ScoreCell.textContent = player2Score;
    }
    if (
      player2Score !== undefined &&
      lastClickedScore &&
      lastClickedScore.player === player2 &&
      lastClickedScore.category === category
    ) {
      player2ScoreCell.classList.add("score-stamp");
      lastClickedScore = null;
    }
    if (currentPlayer === player2) {
      player2ScoreCell.classList.add("current-player");
    }

    player2ScoreCell.classList.add("user-score");
    row.appendChild(player2ScoreCell);

    scoreBoard.appendChild(row);
  });

  const subtotalRow = document.createElement("tr");
  subtotalRow.classList.add("subtotal-row");

  const player1Subtotal = upperCategories.reduce(
    (sum, category) => sum + (player1.scores[category] || 0),
    0
  );
  const player2Subtotal = upperCategories.reduce(
    (sum, category) => sum + (player2.scores[category] || 0),
    0
  );

  subtotalRow.innerHTML = `
  <td class="category">Subtotal</td>
  <td class="subtotal">${player1Subtotal} / 63</td>
  <td class="subtotal">${player2Subtotal} / 63</td>
`;
  scoreBoard.appendChild(subtotalRow);

  const bonusRow = document.createElement("tr");
  bonusRow.classList.add("bonus-row");

  const player1BonusCell = document.createElement("td");
  const player2BonusCell = document.createElement("td");

  player1BonusCell.classList.add("bonus");
  player2BonusCell.classList.add("bonus");

  if (player1Subtotal >= 63 && !player1.bonusAnimationPlayed) {
    player1.bonusScore = 35;
    player1.bonusAnimationPlayed = true;
    player1BonusCell.style.animation = "bonus 2s ease-in-out";
  }
  if (player2Subtotal >= 63 && !player2.bonusAnimationPlayed) {
    player2.bonusScore = 35;
    player2.bonusAnimationPlayed = true;
    player2BonusCell.style.animation = "bonus 2s ease-in-out";
  }

  player1BonusCell.textContent = player1.bonusScore ? "+35" : "";
  player2BonusCell.textContent = player2.bonusScore ? "+35" : "";

  bonusRow.innerHTML = `
    <td class="category">+35 Bonus</td>
  `;
  bonusRow.appendChild(player1BonusCell);
  bonusRow.appendChild(player2BonusCell);

  scoreBoard.appendChild(bonusRow);
  //
  // player1BonusCell.style.animation = "bonus 2s ease-in-out";
  //

  const choiceSpacerRow = document.createElement("tr");
  choiceSpacerRow.innerHTML = `<td colspan="3" class="space"></td>`;
  scoreBoard.appendChild(choiceSpacerRow);

  lowerCategories.forEach((category) => {
    const score = scores[category];
    const player1Score = player1.scores[category];
    const player2Score = player2.scores[category];

    const row = document.createElement("tr");

    const categoryCell = document.createElement("td");
    let iconClass = "";
    switch (category) {
      case "Choice":
        iconClass = "fa-hand-pointer";
        break;
      case "4 of a Kind":
        iconClass = "fa-vector-square";
        break;
      case "Full House":
        iconClass = "fa-cubes";
        break;
      case "S. Straight":
        iconClass = "fa-ellipsis-h";
        break;
      case "L. Straight":
        iconClass = "fa-stairs";
        break;
      case "Yacht":
        iconClass = "fa-dice-d20";
        break;
    }
    categoryCell.innerHTML = `<i class="fas ${iconClass}"></i> ${category}`;
    categoryCell.classList.add("category");
    row.appendChild(categoryCell);

    const player1ScoreCell = document.createElement("td");
    if (player1Score === undefined && rollCount > 0) {
      if (currentPlayer === player1 && rollState === "ready") {
        player1ScoreCell.textContent = score;
        player1ScoreCell.classList.add("selectable");
        if (!isComputerTurn) {
          player1ScoreCell.addEventListener("click", () => {
            selectScore(category, score);
          });
        }
      } else {
        player1ScoreCell.textContent = "";
      }
    } else {
      player1ScoreCell.textContent = player1Score;
    }
    if (
      player1Score !== undefined &&
      lastClickedScore &&
      lastClickedScore.player === player1 &&
      lastClickedScore.category === category
    ) {
      player1ScoreCell.classList.add("score-stamp");
      lastClickedScore = null;
    }
    if (currentPlayer === player1) {
      player1ScoreCell.classList.add("current-player");
    }

    player1ScoreCell.classList.add("user-score");
    row.appendChild(player1ScoreCell);

    const player2ScoreCell = document.createElement("td");
    if (player2Score === undefined && rollCount > 0) {
      if (currentPlayer === player2 && rollState === "ready") {
        player2ScoreCell.textContent = score;
        player2ScoreCell.classList.add("selectable");
        if (!isComputerTurn) {
          player2ScoreCell.addEventListener("click", () => {
            selectScore(category, score);
          });
        }
      } else {
        player2ScoreCell.textContent = "";
      }
    } else {
      player2ScoreCell.textContent = player2Score;
    }
    if (
      player2Score !== undefined &&
      lastClickedScore &&
      lastClickedScore.player === player2 &&
      lastClickedScore.category === category
    ) {
      player2ScoreCell.classList.add("score-stamp");
      lastClickedScore = null;
    }
    if (currentPlayer === player2) {
      player2ScoreCell.classList.add("current-player");
    }

    player2ScoreCell.classList.add("user-score");
    row.appendChild(player2ScoreCell);

    scoreBoard.appendChild(row);
    if (category === "Choice") {
      const choiceSpacerRow = document.createElement("tr");
      choiceSpacerRow.innerHTML = `<td colspan="3" class="space"></td>`;
      scoreBoard.appendChild(choiceSpacerRow);
    }
  });

  const results = diceMeshes
    .map((diceMesh) => findTopFace(diceMesh))
    .map(Number)
    .sort((a, b) => a - b);

  const cat_scores = judge.scoreBoard(results);
  const categories = [
    "4 of a Kind",
    "Full House",
    "S. Straight",
    "L. Straight",
    "Yacht",
  ];
  const categoryScores = categories.map((category) => cat_scores[category]);
  const maxScore = Math.max(...categoryScores);

  if (maxScore > 0 && rollCount !== 0) {
    const maxScoreCategories = categories.filter(
      (category) => cat_scores[category] > 0
    );

    // 점수를 기준으로 카테고리 정렬
    const sortedCategories = maxScoreCategories.sort(
      (a, b) => cat_scores[b] - cat_scores[a]
    );

    for (const category of sortedCategories) {
      if (currentPlayer.scores[category] === undefined) {
        const categoryElement = document.querySelector(
          ".category-notification"
        );
        const canvasRect = renderer.domElement.getBoundingClientRect();
        const canvasCenterX = canvasRect.left + canvasRect.width / 2;
        categoryElement.style.left = `${canvasCenterX}px`;
        categoryElement.textContent = category;

        if (category === "Yacht") {
          categoryElement.style.animation = "stamp 3s ease-in-out";

          // 파티클 효과 추가
          particleSystem = new ParticleSystem(scene, 300, 0xffffff, 0.05);

          setTimeout(() => {
            categoryElement.style.animation = "";
            // 3초 후에 파티클 효과 제거
            if (particleSystem) {
              particleSystem.destroy();
              particleSystem = null;
            }
          }, 3000);
        } else {
          categoryElement.style.animation = "stamp 3s ease-in-out";
          setTimeout(() => {
            categoryElement.style.animation = "";
          }, 3000);
        }
        break;
      }
    }
  }

  document.getElementById("player1Total").textContent =
    player1.totalScore + player1.bonusScore;
  document.getElementById("player2Total").textContent =
    player2.totalScore + player2.bonusScore;

  document.getElementById("remainingRolls").textContent = `${
    3 - rollCount
  } Left`;
}

let IsGameover = false;
let lastClickedScore = null;
let lastScoreClickTime = 0;
let isComputerTurn = false;

// 점수 선택 함수 수정
function selectScore(category, score) {
  if (diceStopped) {
    lastScoreClickTime = new Date().getTime();
    currentPlayer.addScore(category, score);
    lastClickedScore = { player: currentPlayer, category: category };
    rollCount = 0;
    document.getElementById("rollDiceButton").style.display = "none";
    currentPlayer = currentPlayer === player1 ? player2 : player1;
    turnEnded = true;
    keptDice.length = 0;
    renderScoreBoard();
    checkGameOver();
    document.getElementById("remainingRolls").textContent = `${0} Left`;

    if (!IsGameover) {
      setTimeout(() => {
        rollDiceButton.disabled = false; // 버튼 활성화

        document.getElementById(
          "currentPlayer"
        ).textContent = `${currentPlayer.name.slice(0, 10)}${
          currentPlayer.name.length > 10 ? "..." : ""
        }`;
        document.getElementById("rollDiceButton").style.display = "block";
        const categoryElement = document.querySelector(
          ".category-notification"
        );
        categoryElement.style.opacity = "0";
        const nextPlayerElement = document.querySelector(".nextplayer");
        nextPlayerElement.textContent = `${currentPlayer.name.slice(0, 10)}${
          currentPlayer.name.length > 10 ? "..." : ""
        } Turn`;
        nextPlayerElement.style.opacity = "1";
        setTimeout(() => {
          nextPlayerElement.style.opacity = "0";
        }, 1200);
        rollState = "ready";
        resetAndRollDice();
        if (currentPlayer.name === "Computer") {
          isComputerTurn = true;
          computerTurn();
        } else {
          isComputerTurn = false;
        }
      }, 1000); // 1초(1000ms) 후에 resetAndRollDice 함수 호출
    }
  }
}

// 게임 종료 확인 함수 추가
function checkGameOver() {
  if (
    Object.keys(player1.scores).length === 12 &&
    Object.keys(player2.scores).length === 12
  ) {
    IsGameover = true;
    const winner =
      player1.totalScore + player1.bonusScore >
      player2.totalScore + player2.bonusScore
        ? player1
        : player2;
    const gameoverElement = document.querySelector(".category-notification");
    gameoverElement.classList.add(".gameover");
    gameoverElement.innerHTML = `Game Over!<br>Winner: ${winner.name}`;
    gameoverElement.style.animation = "stamp 10s ease-in-out";
    particleSystem = new ParticleSystem(scene, 400, 0xffffff, 0.05);
    rollCount = 3;
    rollDiceButton.disabled = true;
  }
}

// 텍스처 로더 생성
const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();

// 벽의 재질 설정
const wallMaterial = new CANNON.Material();
// 옆면 벽의 물리적 속성을 위한 Material 생성
const sideWallMaterial = new CANNON.Material();
// 벽 생성 함수 수정
function createWall(
  width,
  height,
  depth,
  position,
  rotation,
  color = 0x888888,
  texturePath = "",
  metalness,
  roughness,
  phy_material = wallMaterial
) {
  let material;
  if (texturePath !== "") {
    const texture = textureLoader.load(texturePath);
    material = new THREE.MeshStandardMaterial({
      map: texture,
      metalness: metalness,
      roughness: roughness,
    });
  } else {
    material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: metalness,
      roughness: roughness,
    });
  }

  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.rotation.copy(rotation);
  scene.add(mesh);
  mesh.receiveShadow = true;

  const shape = new CANNON.Box(
    new CANNON.Vec3(width / 2, height / 2, depth / 2)
  );
  const body = new CANNON.Body({
    mass: 0,
    shape: shape,
    position: position,
    quaternion: new CANNON.Quaternion().setFromEuler(
      rotation.x,
      rotation.y,
      rotation.z,
      "XYZ"
    ),
    material: phy_material,
    receiveShadow: true,
  });
  world.addBody(body);
}

createWall(
  1000,
  1000,
  0.1,
  new CANNON.Vec3(0, 0, -1.2),
  new CANNON.Vec3(0, 0, 0),
  // wallMaterial,
  0xe8cf9b,
  "",
  0.3,
  0.5
); // world 바닥

createWall(
  25,
  25,
  0.1,
  new CANNON.Vec3(0, 0, -1),
  new CANNON.Vec3(0, 0, 0),
  // wallMaterial,
  0x9c804f,
  "./model/wood.jpg",
  0.1,
  1
); // 최하단 나무판

createWall(
  10,
  10,
  0.1,
  new CANNON.Vec3(0, 0, 0),
  new CANNON.Vec3(0, 0, 0),
  // wallMaterial,
  0xff3d3d,
  "model/carpet-1.jpg",
  CarpetTexture[0],
  CarpetTexture[1]
); // 카펫바닥

// 벽 생성 코드 수정
createWall(
  10.5,
  0.5,
  3.5,
  new CANNON.Vec3(0, 5, 1),
  new CANNON.Vec3(0, 0, 0),
  // sideWallMaterial,
  null,
  "model/wall.jpg",
  WallTexture[0],
  WallTexture[1],
  sideWallMaterial
); // 앞쪽 벽
createWall(
  10.5,
  0.5,
  3.5,
  new CANNON.Vec3(0, -5, 1),
  new CANNON.Vec3(0, 0, 0),
  // sideWallMaterial,
  null,
  "model/wall.jpg",
  WallTexture[0],
  WallTexture[1],
  sideWallMaterial
); // 뒤쪽 벽
createWall(
  0.5,
  10.5,
  3.5,
  new CANNON.Vec3(5, 0, 1),
  new CANNON.Vec3(0, 0, 0),
  // sideWallMaterial,
  null,
  "model/wall.jpg",
  WallTexture[0],
  WallTexture[1],
  sideWallMaterial
); // 오른쪽 벽
createWall(
  0.5,
  10.5,
  3.5,
  new CANNON.Vec3(-5, 0, 1),
  new CANNON.Vec3(0, 0, 0),
  // sideWallMaterial,
  null,
  "model/wall.jpg",
  WallTexture[0],
  WallTexture[1],
  sideWallMaterial
); // 왼쪽 벽

// 주사위 생성 함수
const params = {
  numberOfDice: 2,
  segments: 40,
  edgeRadius: 0.07,
  notchRadius: 0.12,
  notchDepth: 0.1,
};

function createDiceMesh() {
  const boxMaterialOuter = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
  });
  const boxMaterialInner = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0,
    metalness: 1,
    side: THREE.DoubleSide,
  });

  const diceMesh = new THREE.Group();
  const innerMesh = new THREE.Mesh(createInnerGeometry(), boxMaterialInner);
  const outerMesh = new THREE.Mesh(createBoxGeometry(), boxMaterialOuter);
  outerMesh.castShadow = true;
  diceMesh.add(innerMesh, outerMesh);
  diceMesh.outline = null;

  return diceMesh;
}

function createInnerGeometry() {
  const baseGeometry = new THREE.PlaneGeometry(
    1 - 2 * params.edgeRadius,
    1 - 2 * params.edgeRadius
  );
  const offset = 0.48;
  return BufferGeometryUtils.mergeBufferGeometries(
    [
      baseGeometry.clone().translate(0, 0, offset),
      baseGeometry.clone().translate(0, 0, -offset),
      baseGeometry
        .clone()
        .rotateX(0.5 * Math.PI)
        .translate(0, -offset, 0),
      baseGeometry
        .clone()
        .rotateX(0.5 * Math.PI)
        .translate(0, offset, 0),
      baseGeometry
        .clone()
        .rotateY(0.5 * Math.PI)
        .translate(-offset, 0, 0),
      baseGeometry
        .clone()
        .rotateY(0.5 * Math.PI)
        .translate(offset, 0, 0),
    ],
    false
  );
}

function createBoxGeometry() {
  let boxGeometry = new THREE.BoxGeometry(
    1,
    1,
    1,
    params.segments,
    params.segments,
    params.segments
  );

  const positionAttr = boxGeometry.attributes.position;
  const subCubeHalfSize = 0.5 - params.edgeRadius;

  for (let i = 0; i < positionAttr.count; i++) {
    let position = new THREE.Vector3().fromBufferAttribute(positionAttr, i);

    const subCube = new THREE.Vector3(
      Math.sign(position.x),
      Math.sign(position.y),
      Math.sign(position.z)
    ).multiplyScalar(subCubeHalfSize);
    const addition = new THREE.Vector3().subVectors(position, subCube);

    if (
      Math.abs(position.x) > subCubeHalfSize &&
      Math.abs(position.y) > subCubeHalfSize &&
      Math.abs(position.z) > subCubeHalfSize
    ) {
      addition.normalize().multiplyScalar(params.edgeRadius);
      position = subCube.add(addition);
    } else if (
      Math.abs(position.x) > subCubeHalfSize &&
      Math.abs(position.y) > subCubeHalfSize
    ) {
      addition.z = 0;
      addition.normalize().multiplyScalar(params.edgeRadius);
      position.x = subCube.x + addition.x;
      position.y = subCube.y + addition.y;
    } else if (
      Math.abs(position.x) > subCubeHalfSize &&
      Math.abs(position.z) > subCubeHalfSize
    ) {
      addition.y = 0;
      addition.normalize().multiplyScalar(params.edgeRadius);
      position.x = subCube.x + addition.x;
      position.z = subCube.z + addition.z;
    } else if (
      Math.abs(position.y) > subCubeHalfSize &&
      Math.abs(position.z) > subCubeHalfSize
    ) {
      addition.x = 0;
      addition.normalize().multiplyScalar(params.edgeRadius);
      position.y = subCube.y + addition.y;
      position.z = subCube.z + addition.z;
    }

    const notchWave = (v) => {
      v = (1 / params.notchRadius) * v;
      v = Math.PI * Math.max(-1, Math.min(1, v));
      return params.notchDepth * (Math.cos(v) + 1) * 1.3;
    };
    const notch = (pos) => notchWave(pos[0]) * notchWave(pos[1]);

    const offset = 0.25;

    if (position.y === 0.5) {
      position.y -= notch([position.x + offset, position.z + offset]);
      position.y -= notch([position.x + offset, position.z - offset]);
      position.y -= notch([position.x, position.z]);
      position.y -= notch([position.x - offset, position.z + offset]);
      position.y -= notch([position.x - offset, position.z - offset]);
    } else if (position.x === 0.5) {
      position.x -= notch([position.y + offset, position.z + offset]);
      position.x -= notch([position.y + offset, position.z - offset]);
      position.x -= notch([position.y - offset, position.z + offset]);
      position.x -= notch([position.y - offset, position.z - offset]);
    } else if (position.z === 0.5) {
      position.z -= notch([position.x + offset, position.y + offset]);
      position.z -= notch([position.x + offset, position.y]);
      position.z -= notch([position.x + offset, position.y - offset]);
      position.z -= notch([position.x - offset, position.y + offset]);
      position.z -= notch([position.x - offset, position.y]);
      position.z -= notch([position.x - offset, position.y - offset]);
    } else if (position.z === -0.5) {
      position.z += notch([position.x, position.y]);
    } else if (position.x === -0.5) {
      position.x += notch([position.y, position.z]);
      position.x += notch([position.y - offset, position.z - offset]);
      position.x += notch([position.y + offset, position.z + offset]);
    } else if (position.y === -0.5) {
      position.y += notch([position.x + offset, position.z + offset]);
      position.y += notch([position.x - offset, position.z - offset]);
    }

    positionAttr.setXYZ(i, position.x, position.y, position.z);
  }

  boxGeometry.deleteAttribute("normal");
  boxGeometry.deleteAttribute("uv");
  boxGeometry = BufferGeometryUtils.mergeVertices(boxGeometry);

  boxGeometry.computeVertexNormals();

  return boxGeometry;
}

// 주사위 면 방향을 나타내는 로컬 벡터 정의
const diceFacesDirections = [
  { face: "6", vector: new THREE.Vector3(0, 0, 1) }, // 상단 면
  { face: "1", vector: new THREE.Vector3(0, 0, -1) }, // 하단 면
  { face: "5", vector: new THREE.Vector3(0, 1, 0) }, // 전면
  { face: "2", vector: new THREE.Vector3(0, -1, 0) }, // 후면
  { face: "4", vector: new THREE.Vector3(1, 0, 0) }, // 우측면
  { face: "3", vector: new THREE.Vector3(-1, 0, 0) }, // 좌측면
];

// 가장 위에 있는 주사위 면을 찾는 함수
function findTopFace(diceMesh) {
  let maxDot = -Infinity;
  let topFaceValue = null;

  diceFacesDirections.forEach((face) => {
    // 주사위의 현재 회전 상태를 고려하여 면의 방향 벡터를 월드 좌표계로 변환
    const worldDirection = face.vector
      .clone()
      .applyQuaternion(diceMesh.quaternion);

    // 카메라 방향과의 내적 계산
    const dot = worldDirection.dot(camera.position.clone().normalize());

    // 가장 큰 내적 값을 가진 면이 위쪽 면
    if (dot > maxDot) {
      maxDot = dot;
      topFaceValue = face.face;
    }
  });

  return topFaceValue;
}

// 주사위의 물리적 속성을 위한 Material 생성
const diceMaterial = new CANNON.Material();

// 주사위 생성
const diceBodies = [];
const diceMeshes = [];
for (let i = 0; i < 5; i++) {
  const diceMesh = createDiceMesh();
  scene.add(diceMesh);
  diceMesh.castShadow = true;
  diceMeshes.push(diceMesh);

  const diceShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
  const diceBody = new CANNON.Body({ mass: DiceMass });
  diceBody.addShape(diceShape);
  const spacing = 1.3;
  const startY = (4 * spacing) / 2;
  // 주사위의 초기 위치 설정 (박스 중앙쪽으로 떨어지도록)
  diceBody.type = CANNON.Body.KINEMATIC;
  diceBody.position.set(4, i * spacing - startY, 4);

  world.addBody(diceBody);
  diceBodies.push(diceBody);
}

// 주사위 간 마찰 없음을 설정
const diceDiceContactMaterial = new CANNON.ContactMaterial(
  diceMaterial,
  diceMaterial,
  {
    friction: Dice2Dice[0], // 마찰 계수를 0으로 설정
    restitution: Dice2Dice[1], // 탄성 계수 설정(선택적으로 조정 가능)
  }
);
world.addContactMaterial(diceDiceContactMaterial);

// 주사위와 벽 사이의 접촉 재질 설정
const diceWallContactMaterial = new CANNON.ContactMaterial(
  diceMaterial,
  wallMaterial,
  {
    friction: Dice2Floor[0], // 적절한 마찰 계수 설정
    restitution: Dice2Floor[1], // 탄성 계수 설정 (0.7은 예시 값으로, 필요에 따라 조정)
  }
);
world.addContactMaterial(diceWallContactMaterial);

// 주사위와 옆면 벽 사이의 접촉 재질 설정
const diceSideWallContactMaterial = new CANNON.ContactMaterial(
  diceMaterial,
  sideWallMaterial,
  {
    friction: Dice2Wall[0],
    restitution: Dice2Wall[1], // 옆면 벽에 대한 탄성 계수 설정
  }
);
world.addContactMaterial(diceSideWallContactMaterial);

// 각 주사위 본체에 Material 할당
for (let diceBody of diceBodies) {
  diceBody.material = diceMaterial;
}

let diceStopped = false;

let previousTimestamp = 0;

function updatePhysics(timestamp) {
  const deltaTime = (timestamp - previousTimestamp) / 1000; // 초 단위로 변환
  previousTimestamp = timestamp;

  // 최대 0.1초로 제한 (10fps 이하로 떨어지지 않도록)
  const maxDeltaTime = 0.1;
  const clampedDeltaTime = Math.min(deltaTime, maxDeltaTime);

  world.step(clampedDeltaTime);

  for (let i = 0; i < diceMeshes.length; i++) {
    diceMeshes[i].position.copy(diceBodies[i].position);
    diceMeshes[i].quaternion.copy(diceBodies[i].quaternion);
  }

  // const allDiceStopped = diceBodies.every(
  //   (diceBody) => diceBody.velocity.length() < 0.01
  // );

  const allDiceStopped = diceBodies.every(
    (diceBody) =>
      diceBody.velocity.length() < 0.01 &&
      diceBody.angularVelocity.length() < 0.01
  );

  if (allDiceStopped && !diceStopped) {
    setTimeout(() => {
      diceStopped = true;
    }, DiceStopDelay);
  }
}

let resultsDisplayed = false;
let sortedDiceIndices = [];

function showDiceResults() {
  isKeptDiceSelected = false;
  diceStopped = false;
  let results;

  if (DebugMode) {
    // 디버그 모드에서는 주사위 값을 사용자로부터 입력받음
    const userInput = prompt("Enter dice values (comma-separated):");
    if (userInput === null) {
      // 사용자가 입력을 취소한 경우, 기본값인 [1, 2, 3, 4, 5]를 사용
      results = [1, 2, 3, 4, 5];
    } else {
      results = userInput.split(",").map(Number);
    }

    // 입력받은 주사위 값을 실제로 적용
    results.forEach((value, index) => {
      const diceMesh = diceMeshes[index];
      const diceBody = diceBodies[index];
      const targetRotation = getRotationByValue(value);

      diceMesh.rotation.copy(targetRotation);
      diceBody.quaternion.setFromEuler(
        targetRotation.x,
        targetRotation.y,
        targetRotation.z,
        "XYZ"
      );
    });
  } else {
    // 일반 모드에서는 실제 주사위 값을 사용
    results = diceMeshes.map((diceMesh) => findTopFace(diceMesh)).map(Number);
  }

  if (!resultsDisplayed) {
    resultsDisplayed = true;
  }

  const keptResults = keptDice
    .map((index) => Number(findTopFace(diceMeshes[index])))
    .sort((a, b) => a - b)
    .join(", ");

  const remainingDice = diceMeshes.filter(
    (_, index) => !keptDice.includes(index)
  );

  const sortedRemainingDice = remainingDice.slice().sort((a, b) => {
    const aValue = Number(findTopFace(a));
    const bValue = Number(findTopFace(b));
    return aValue - bValue;
  });

  sortedDiceIndices = sortedRemainingDice.map((diceMesh) =>
    diceMeshes.indexOf(diceMesh)
  );

  const spacing = 1.3;
  const startX = (-(sortedRemainingDice.length - 1) * spacing) / 2;
  sortedRemainingDice.forEach((diceMesh, index) => {
    const diceBody = diceBodies[diceMeshes.indexOf(diceMesh)];
    const topFaceValue = Number(findTopFace(diceMesh));
    const targetPosition = new THREE.Vector3(startX + index * spacing, 0, 4);
    const targetRotation = getRotationByValue(topFaceValue);

    diceBody.type = CANNON.Body.KINEMATIC;
    const tweenRotation = new TWEEN.Tween(diceMesh.rotation)
      .to(targetRotation, 200)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => {
        diceBody.quaternion.setFromEuler(
          diceMesh.rotation.x,
          diceMesh.rotation.y,
          diceMesh.rotation.z,
          "XYZ"
        );
      })
      .onComplete(() => {})
      .start();
    const tweenPosition = new TWEEN.Tween(diceMesh.position)
      .to(targetPosition, 300)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => {
        diceBody.position.copy(diceMesh.position);
      })
      .onComplete(() => {
        diceBody.velocity.set(0, 0, 0);
        diceBody.angularVelocity.set(0, 0, 0);
      })
      .start();
  });
  rollState = "ready";
  if (rollCount >= 3) {
    document.getElementById("rollDiceButton").style.display = "none";
  } else {
    if (isComputerTurn) {
      document.getElementById("rollDiceButton").style.display = "none";
    } else {
      document.getElementById("rollDiceButton").style.display = "block";
    }
  }
  renderScoreBoard();
  diceStopped = true;
  highlightSelectedDice();
}

function getRotationByValue(value) {
  const rotations = {
    1: new THREE.Euler(Math.PI, 0, 0, "XYZ"),
    2: new THREE.Euler(-Math.PI / 2, 0, 0, "XYZ"),
    3: new THREE.Euler(0, Math.PI / 2, 0, "XYZ"),
    4: new THREE.Euler(0, -Math.PI / 2, 0, "XYZ"),
    5: new THREE.Euler(Math.PI / 2, 0, 0, "XYZ"),
    6: new THREE.Euler(0, 0, 0, "XYZ"),
  };
  return rotations[value];
}

const keptDice = []; // Array to store kept dice indices

function onDiceClick(event) {
  if (!isComputerTurn) {
    diceMeshes.forEach((diceMesh) => {
      if (diceMesh && diceMesh.children.length > 1) {
        const outerMesh = diceMesh.children[1];
        if (outerMesh && outerMesh.material) {
          outerMesh.material.color.setHex(0xeeeeee); // 기본 색상으로 설정
        }
      }
    });
    const scoreBoard = document.querySelector(".user");
    const scoreBoardWidth = scoreBoard.offsetWidth;

    const canvasRect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1,
      -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      const clickedDice = findParentDice(clickedObject);

      if (clickedDice && diceStopped && rollCount > 0) {
        const index = diceMeshes.indexOf(clickedDice);
        const keptIndex = keptDice.indexOf(index);

        rollState = "ready";
        rollDiceButton.innerText = "Roll ready";
        const keptResults = keptDice
          .map((index) => Number(findTopFace(diceMeshes[index])))
          .sort((a, b) => a - b)
          .join(", ");

        if (keptIndex !== -1) {
          // 킵된 주사위를 다시 누르면 킵 해제
          keptDice.splice(keptIndex, 1);
        } else if (!keptDice.includes(index)) {
          keptDice.push(index);
        }
        positionKeptDice();
      }
    }
  }
}

function findParentDice(object) {
  if (diceMeshes.includes(object)) {
    return object;
  } else if (object.parent) {
    return findParentDice(object.parent);
  }
  return null;
}

function positionKeptDice() {
  rollState = "ready";
  const spacing = 1.4;
  const startX = (-(keptDice.length - 1) * spacing) / 2;
  keptDice.forEach((index, i) => {
    const diceMesh = diceMeshes[index];
    const diceBody = diceBodies[index];
    if (diceMesh) {
      const targetPosition = new THREE.Vector3(startX + i * spacing, 4.2, 3);

      diceBody.collisionResponse = false;
      const tweenPosition = new TWEEN.Tween(diceMesh.position)
        .to(targetPosition, 300)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
          // 애니메이션 완료 후, CANNON.js 바디의 위치 업데이트
          diceBody.position.copy(targetPosition);
          diceBody.velocity.set(0, 0, 0);
          diceBody.angularVelocity.set(0, 0, 0);
          diceBody.type = CANNON.Body.KINEMATIC;
        })
        .start();

      // Three.js 메쉬의 위치 업데이트
      diceMesh.position.copy(targetPosition);
    }
    if (keptDice.length === 5) {
      rollDiceButton.disabled = true; // 버튼 비활성화
      rollDiceButton.innerText = "All dice kept";
    } else {
      rollDiceButton.disabled = false; // 버튼 활성화
      rollDiceButton.innerText = "Roll ready";
    }
  });

  // 킵하지 않은 주사위 정렬
  const remainingDiceIndices = diceMeshes
    .map((_, index) => index)
    .filter((index) => !keptDice.includes(index));

  // 정렬된 주사위 순서대로 sortedDiceIndices 업데이트
  sortedDiceIndices = remainingDiceIndices.slice().sort((a, b) => {
    const aValue = Number(findTopFace(diceMeshes[a]));
    const bValue = Number(findTopFace(diceMeshes[b]));
    return aValue - bValue;
  });

  const remainingSpacing = 1.3;
  const remainingStartX =
    (-(sortedDiceIndices.length - 1) * remainingSpacing) / 2;

  sortedDiceIndices.forEach((index, i) => {
    const diceMesh = diceMeshes[index];
    const diceBody = diceBodies[index];
    const targetPosition = new THREE.Vector3(
      remainingStartX + i * remainingSpacing,
      0,
      4
    );

    const tweenPosition = new TWEEN.Tween(diceMesh.position)
      .to(targetPosition, 300)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => {
        diceBody.position.copy(diceMesh.position);
      })
      .onComplete(() => {
        diceBody.velocity.set(0, 0, 0);
        diceBody.angularVelocity.set(0, 0, 0);
        diceBody.type = CANNON.Body.KINEMATIC;
      })
      .start();
  });
}

window.addEventListener("click", onDiceClick);

let selectedDiceIndex = 0;
let isKeptDiceSelected = false;
let isCategorySelected = false; // 카테고리 선택 모드 여부를 추적하는 변수
let selectedCategoryIndex = 0; // 선택된 카테고리 인덱스

const categories = [
  "Aces",
  "Deuces",
  "Threes",
  "Fours",
  "Fives",
  "Sixes",
  "Choice",
  "4 of a Kind",
  "Full House",
  "S. Straight",
  "L. Straight",
  "Yacht",
];

function handleKeyDown(event) {
  if (diceStopped && rollCount > 0 && !isComputerTurn) {
    const remainingDiceIndices = sortedDiceIndices.filter(
      (index) => !keptDice.includes(index)
    );

    if (event.key === "a" || event.key === "A" || event.key === "ArrowLeft") {
      if (isKeptDiceSelected) {
        selectedDiceIndex = Math.max(0, selectedDiceIndex - 1);
      } else if (isCategorySelected) {
        selectedCategoryIndex = Math.max(0, selectedCategoryIndex - 0);
        highlightSelectedCategory();
      } else {
        selectedDiceIndex = Math.max(-1, selectedDiceIndex - 1);
        if (selectedDiceIndex < 0) {
          isCategorySelected = true;
          selectedCategoryIndex = categories.findIndex(
            (category) => currentPlayer.scores[category] === undefined
          );
          if (selectedCategoryIndex === -1) {
            selectedCategoryIndex = 0;
          }
          highlightSelectedCategory();
        }
      }
    } else if (
      event.key === "d" ||
      event.key === "D" ||
      event.key === "ArrowRight"
    ) {
      if (isKeptDiceSelected) {
        selectedDiceIndex = Math.min(
          keptDice.length - 1,
          selectedDiceIndex + 1
        );
      } else if (isCategorySelected) {
        isCategorySelected = false;
        // console.log("isCategorySelected = false;");
        selectedDiceIndex = 0;
        clearCategoryHighlight();
      } else {
        selectedDiceIndex = Math.min(
          remainingDiceIndices.length - 1,
          selectedDiceIndex + 1
        );
      }
    } else if (
      event.key === "w" ||
      event.key === "W" ||
      event.key === "ArrowUp"
    ) {
      if (isCategorySelected) {
        let prevSelectedCategoryIndex = selectedCategoryIndex;
        do {
          selectedCategoryIndex =
            (selectedCategoryIndex - 1 + categories.length) % categories.length;
        } while (
          selectedCategoryIndex !== prevSelectedCategoryIndex &&
          currentPlayer.scores[categories[selectedCategoryIndex]] !== undefined
        );
        highlightSelectedCategory();
      } else {
        if (keptDice.length !== 0) {
          isKeptDiceSelected = true;
          selectedDiceIndex = Math.min(keptDice.length - 1, selectedDiceIndex);
          if (keptDice.length > 0) {
            selectedDiceIndex = 0;
          }
        }
      }
    } else if (
      event.key === "s" ||
      event.key === "S" ||
      event.key === "ArrowDown"
    ) {
      if (isCategorySelected) {
        let prevSelectedCategoryIndex = selectedCategoryIndex;
        do {
          selectedCategoryIndex =
            (selectedCategoryIndex + 1) % categories.length;
        } while (
          selectedCategoryIndex !== prevSelectedCategoryIndex &&
          currentPlayer.scores[categories[selectedCategoryIndex]] !== undefined
        );
        highlightSelectedCategory();
      } else {
        if (keptDice.length !== 5) {
          isKeptDiceSelected = false;
          selectedDiceIndex = Math.min(
            remainingDiceIndices.length - 1,
            selectedDiceIndex
          );
          if (remainingDiceIndices.length > 0) {
            selectedDiceIndex = 0;
          }
        }
      }
    } else if (event.key === "Enter") {
      if (isCategorySelected) {
        const selectedCategory = categories[selectedCategoryIndex];
        const score = judge.scoreBoard(diceMeshes.map(findTopFace).map(Number))[
          selectedCategory
        ];
        if (currentPlayer.scores[selectedCategory] === undefined) {
          selectScore(selectedCategory, score);
          isCategorySelected = false;
        }
      } else if (isKeptDiceSelected) {
        if (keptDice.length > 0) {
          const index = keptDice[selectedDiceIndex];
          const keptIndex = keptDice.indexOf(index);
          keptDice.splice(keptIndex, 1);
          selectedDiceIndex = Math.min(selectedDiceIndex, keptDice.length - 1);
        }
      } else {
        if (remainingDiceIndices.length > 0) {
          const index = remainingDiceIndices[selectedDiceIndex];
          if (!keptDice.includes(index)) {
            keptDice.push(index);
            selectedDiceIndex = Math.min(
              selectedDiceIndex,
              remainingDiceIndices.length - 2
            );
          }
        }
      }
      if (!turnEnded) {
        positionKeptDice();
      }
    }

    highlightSelectedDice();
  }
}

function highlightSelectedDice() {
  diceMeshes.forEach((diceMesh) => {
    if (diceMesh && diceMesh.children.length > 1) {
      const outerMesh = diceMesh.children[1];
      if (outerMesh && outerMesh.material) {
        outerMesh.material.color.setHex(0xeeeeee); // 기본 색상으로 설정
      }
    }
  });

  if (isKeptDiceSelected && keptDice.length > 0) {
    const selectedKeptDiceIndex = keptDice[selectedDiceIndex];
    const selectedDiceMesh = diceMeshes[selectedKeptDiceIndex];
    if (selectedDiceMesh && selectedDiceMesh.children.length > 1) {
      const outerMesh = selectedDiceMesh.children[1];
      if (outerMesh && outerMesh.material) {
        outerMesh.material.color.setHex(0xffff00); // 선택된 주사위 색상 변경
      }
    }
  } else {
    const remainingDiceIndices = sortedDiceIndices.filter(
      (index) => !keptDice.includes(index)
    );
    if (remainingDiceIndices.length > 0) {
      const selectedRemainingDiceIndex =
        remainingDiceIndices[selectedDiceIndex];
      const selectedDiceMesh = diceMeshes[selectedRemainingDiceIndex];
      if (selectedDiceMesh && selectedDiceMesh.children.length > 1) {
        const outerMesh = selectedDiceMesh.children[1];
        if (outerMesh && outerMesh.material) {
          outerMesh.material.color.setHex(0xffff00); // 선택된 주사위 색상 변경
        }
      }
    }
  }
}

function highlightSelectedCategory() {
  const categories = [
    "Aces",
    "Deuces",
    "Threes",
    "Fours",
    "Fives",
    "Sixes",
    "Choice",
    "4 of a Kind",
    "Full House",
    "S. Straight",
    "L. Straight",
    "Yacht",
  ];

  const categoryScoreCells = document.querySelectorAll(".user-score");
  categoryScoreCells.forEach((cell) => {
    const categoryText = cell.parentNode.firstChild.textContent.trim();
    if (cell.classList.contains("current-player")) {
      if (categories[selectedCategoryIndex] === categoryText) {
        cell.classList.add("category-selected");
      } else {
        cell.classList.remove("category-selected");
      }
    } else {
      cell.classList.remove("category-selected");
    }
  });
}

function clearCategoryHighlight() {
  const categoryScoreCells = document.querySelectorAll(".user-score");
  categoryScoreCells.forEach((cell) => {
    cell.classList.remove("category-selected");
  });
}

document.addEventListener("keydown", handleKeyDown);

// 버튼 찾기
const rollDiceButton = document.getElementById("rollDiceButton");

// 주사위를 다시 굴리는 함수
let rollState = "ready"; // 주사위 굴리기 상태: 'ready', 'prepare', 'roll'

document.getElementById("currentPlayer").textContent = `${currentPlayer.name}`;
// 주사위를 다시 굴리는 함수
function resetAndRollDice() {
  if (diceStopped) {
    if (turnEnded) {
      turnEnded = false;
    }
    diceMeshes.forEach((diceMesh) => {
      if (diceMesh && diceMesh.children.length > 1) {
        const outerMesh = diceMesh.children[1];
        if (outerMesh && outerMesh.material) {
          outerMesh.material.color.setHex(0xeeeeee); // 기본 색상으로 설정
        }
      }
    });

    if (rollCount < 3 && keptDice.length < 5) {
      document.getElementById("remainingRolls").textContent = `${
        3 - rollCount
      } Left`;
      const categoryElement = document.querySelector(".category-notification");
      categoryElement.style.animation = "";
      const diceSpacing = 1.7;
      const diceOffsetX = 4;
      const diceOffsetZ = ((diceBodies.length - 1) * diceSpacing) / 2;
      if (rollState === "ready") {
        rollState = "prepare";
        diceBodies.forEach((diceBody, index) => {
          if (!keptDice.includes(index)) {
            const targetPosition = new THREE.Vector3(
              diceOffsetX,
              index * diceSpacing - diceOffsetZ,
              4
            );

            diceBody.position.set(
              diceOffsetX + 8,
              index * diceSpacing - diceOffsetZ,
              4
            );

            new TWEEN.Tween(diceBody.position)
              .to(targetPosition, 300)
              .easing(TWEEN.Easing.Quadratic.Out)
              .onComplete(() => {})
              .start();
          }
        });
        rollDiceButton.innerText = "Reroll"; // 버튼 텍스트 변경
      } else if (rollState === "prepare") {
        clearCategoryHighlight();
        rollState = "roll";
        rollCount++;

        const div_categoryElement = document.querySelector(".category-noti");
        div_categoryElement.style.opacity = "0";

        document.getElementById("rollDiceButton").style.display = "none"; // 버튼 숨기기

        const selectableCells = document.querySelectorAll(".selectable");
        selectableCells.forEach((cell) => {
          cell.textContent = "";
          cell.classList.remove("selectable");
          cell.removeEventListener("click", selectScore);
        });

        diceBodies.forEach((diceBody, index) => {
          if (!keptDice.includes(index)) {
            diceBody.wakeUp();
            diceBody.collisionResponse = true;
            diceBody.type = CANNON.Body.DYNAMIC;
            diceBody.position.set(
              diceOffsetX,
              index * diceSpacing - diceOffsetZ,
              4
            );
            // 주사위의 초기 속도를 왼쪽 벽의 중앙을 향하도록 설정
            const targetY = 0;
            const directionX = targetX - diceBody.position.x;
            const directionY = targetY - diceBody.position.y;
            const magnitude = Math.sqrt(
              directionX * directionX + directionY * directionY
            );
            const normalizedX = directionX / magnitude;
            const normalizedY = directionY / magnitude;
            const velocityX = normalizedX * 20;
            const velocityY = normalizedY * 15;
            diceBody.velocity.set(velocityX, velocityY, -2.0);

            // 주사위의 초기 각속도를 랜덤하게 설정
            diceBody.angularVelocity.set(
              Math.random() * 10,
              Math.random() * 10 + 10,
              Math.random() * 10
            );
          }
        });
        diceStopped = false;
        resultsDisplayed = false;
        rollDiceButton.innerText = "Roll ready"; // 버튼 텍스트 변경
      }
    }
    // else if (rollCount === 3 && keptDice.length < 5) {
    //   // 주사위를 3번 모두 굴렸고 킵한 주사위가 5개 미만인 경우
    //   // 모든 주사위를 킵 상태로 변경
    //   const remainingDiceIndices = diceMeshes
    //     .map((_, index) => index)
    //     .filter((index) => !keptDice.includes(index));

    //   keptDice.push(...remainingDiceIndices);
    //   positionKeptDice();
    // }
  }
}

let lastButtonClick = 0;
const buttonCooldown = CoolTime; // 쿨타임 (ms)
// 버튼 클릭 이벤트에 함수 연결
rollDiceButton.addEventListener("click", function (event) {
  if (isGameStarted && !isComputerTurn) {
    const currentTime = new Date().getTime();
    if (currentTime - lastButtonClick > buttonCooldown) {
      lastButtonClick = currentTime;
      resetAndRollDice();
    }
  }
});

let lastSpacebarPress = 0;
const spacebarCooldown = CoolTime; // 쿨타임 (ms)

// 스페이스바 누르면 주사위 굴리기 버튼 클릭 이벤트 발생
document.addEventListener("keydown", function (event) {
  if (
    isGameStarted &&
    event.code === "Space" &&
    diceStopped &&
    !isComputerTurn
  ) {
    const currentTime = new Date().getTime();
    if (
      currentTime - lastSpacebarPress > spacebarCooldown &&
      currentTime - lastScoreClickTime > 1000
    ) {
      lastSpacebarPress = currentTime;
      resetAndRollDice();
    }
  }
});

function animate(timestamp) {
  requestAnimationFrame(animate);

  updatePhysics(timestamp);
  TWEEN.update();

  if (particleSystem) {
    particleSystem.update();
  }

  if (diceStopped && !resultsDisplayed) {
    showDiceResults();
    resultsDisplayed = true;
  }

  renderer.render(scene, camera);
}
animate(60); // 초기 timestamp 값을 0으로 설정

const judge = {
  getOnes: function (dices) {
    var score = 0;
    for (let i of dices) {
      if (i == 1) {
        score += 1;
      }
    }
    return score;
  },

  getTwos: function (dices) {
    var score = 0;
    for (let i of dices) {
      if (i == 2) {
        score += 2;
      }
    }
    return score;
  },

  getThrees: function (dices) {
    var score = 0;
    for (let i of dices) {
      if (i == 3) {
        score += 3;
      }
    }
    return score;
  },

  getFours: function (dices) {
    var score = 0;
    for (let i of dices) {
      if (i == 4) {
        score += 4;
      }
    }
    return score;
  },

  getFives: function (dices) {
    var score = 0;
    for (let i of dices) {
      if (i == 5) {
        score += 5;
      }
    }
    return score;
  },

  getSixes: function (dices) {
    var score = 0;
    for (let i of dices) {
      if (i == 6) {
        score += 6;
      }
    }
    return score;
  },

  getChoice: function (dices) {
    var score = 0;
    for (let i of dices) score += i;
    return score;
  },

  getFourOfAKind: function (dices) {
    var score = 0;
    const duplicates = {};
    dices.forEach((dice) => {
      duplicates[dice] = duplicates[dice] ? duplicates[dice] + 1 : 1;
    });
    let maxCount = 0;
    Object.values(duplicates).forEach((count) => {
      if (count > maxCount) {
        maxCount = count;
      }
    });
    if (maxCount >= 4 || maxCount === 5) {
      for (let i of dices) score += i;
    }
    return score;
  },

  getFullHouse: function (dices) {
    const counts = {};
    var score = 0;
    for (let i of dices) {
      counts[i] = (counts[i] || 0) + 1;
    }
    const countValues = Object.values(counts);
    if (
      (countValues.includes(3) && countValues.includes(2)) ||
      countValues.includes(5)
    ) {
      for (let i of dices) {
        score += i;
      }
    }
    return score;
  },

  getSmallStraight: function (dices) {
    var score = 0;
    const uniqueDices = [...new Set(dices)];
    const sortedDices = uniqueDices.sort((a, b) => a - b);

    if (
      (sortedDices.length >= 4 && sortedDices[3] - sortedDices[0] === 3) ||
      (sortedDices.length >= 5 &&
        ((sortedDices.includes(1) &&
          sortedDices.includes(2) &&
          sortedDices.includes(3) &&
          sortedDices.includes(4)) ||
          (sortedDices.includes(2) &&
            sortedDices.includes(3) &&
            sortedDices.includes(4) &&
            sortedDices.includes(5)) ||
          (sortedDices.includes(3) &&
            sortedDices.includes(4) &&
            sortedDices.includes(5) &&
            sortedDices.includes(6))))
    ) {
      score = 15;
    }

    return score;
  },

  getLargeStraight: function (dices) {
    var score = 0;
    const uniqueDices = [...new Set(dices)];
    const sortedDices = uniqueDices.sort((a, b) => a - b);

    if (
      (sortedDices.length === 5 && sortedDices[4] - sortedDices[0] === 4) ||
      (sortedDices.length === 6 &&
        ((sortedDices[0] === 1 && sortedDices[4] === 5) ||
          (sortedDices[1] === 2 && sortedDices[5] === 6)))
    ) {
      score = 30;
    }

    return score;
  },

  getYacht: function (dices) {
    var score = dices.every((num) => num == dices[0]) ? 50 : 0;
    return score;
  },

  scoreBoard: function (dices) {
    const scoreObj = {
      Aces: this.getOnes(dices),
      Deuces: this.getTwos(dices),
      Threes: this.getThrees(dices),
      Fours: this.getFours(dices),
      Fives: this.getFives(dices),
      Sixes: this.getSixes(dices),
      Choice: this.getChoice(dices),
      "4 of a Kind": this.getFourOfAKind(dices),
      "Full House": this.getFullHouse(dices),
      "S. Straight": this.getSmallStraight(dices),
      "L. Straight": this.getLargeStraight(dices),
      Yacht: this.getYacht(dices),
    };
    return scoreObj;
  },

  scoreBoardPrint: function (dices) {
    const score = this.scoreBoard(dices);
    console.log("Ones :", score.ones);
    console.log("Twos :", score.twos);
    console.log("Threes :", score.threes);
    console.log("Fours :", score.fours);
    console.log("Fives :", score.fives);
    console.log("Sixes :", score.sixes);
    console.log("Choice :", score.choice);
    console.log("4 of a kind :", score.four_of_a_kind);
    console.log("Full House:", score.full_house);
    console.log("Small Straight :", score.small_straight);
    console.log("Large Straight :", score.large_straight);
    console.log("Yacht :", score.yacht);
    return score;
  },
};
