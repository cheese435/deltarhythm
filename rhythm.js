// Made for Terra! (https://terra.hackclub.com/) Built in ~11hrs
let stopLoops = false;
let notes = ["1;H;L1;f1", "1;H;L2;f1", "1;H;L3;f1", "1;H;L4;f1", "1;H;L5;f1", "1;H;L6;f1", "1;V;L1;f1", "1;V;L2;f1", "1;V;L3;f1", "1;V;L4;f1", "1;V;L5;f1", "1;V;L6;f1", "end;f5"];
let listOfNotes = { 'OchameKinouDemo': ['1;H;L4;f0', '1;H;L6;f10', '1;V;L1;f24', '1;H;L6;f32', '1;H;L4;f35', '1;H;L6;f36', '1;H;L4;f49', '1;H;L6;f52', '1;V;L1;f58', '1;H;L4;f62', '1;H;L6;f67', '1;V;L1;f70', '1;H;L4;f79', '1;V;L3;f80', '1;H;L6;f85', '1;V;L1;f89', '1;H;L6;f101', '1;H;L3;f106', '1;H;L1;f107', '1;V;L1;f122', '1;V;L3;f139', '1;H;L4;f152', '1;V;L1;f168', '1;H;L3;f173'], };
let songInfo = { 'OchameKinouDemo': { name: "Ochame Kinou [DEMO]", creator: "jellyfish", stars: 1, songOwner: "Lamaze-P", songSrc: "maps/Ochame Kinou [DEMO]/sng.mp3", imgSrc: "maps/Ochame Kinou [DEMO]/art/cover.png" }, };
const noteKey = {
  0: "blank",
  1: "halfNote",
  2: "fullNote",
};
const infoKey = {
  V: "verticalLane",
  H: "horizontalLane",
  L1: "3.5%",
  L2: "36%",
  L3: "69%",
  L4: "3.5%",
  L5: "36%",
  L6: "69%",
};
const dodgeMode = false;
let decodedNotes = [];
const soul = document.getElementById("soul");
let soulHealth = 100;
let frame = 0;
let lastTimeCounted = 0;
let spawnedNotes = 0;
let misses = 0;
let hits = 0;
let score = 0;
let combo = 0;
let accuracy = 100;
const maxPerNote = 100;
let drumrollPlayed = false;
let lastTimeCountedEnding = 0;
let timeElapsedEnding = 0;
let hitsBeforeMove = 0;
let wastedMoves = 0;
let moveActive = false;
let noJudge = false;
const drumroll = new Audio("assets/snd/drumroll.mp3");

const radius = 300;
const mouse = {};
addEventListener('mousemove', (event) => {
  mouse.x = event.clientX
  mouse.y = event.clientY
  //ui mouse scaling
  for (song of document.querySelectorAll(".songHolder")) {
    let bounding = song.getBoundingClientRect()
    const disX = mouse.x - (bounding.left + bounding.width / 2)
    const disY = mouse.y - (bounding.top + bounding.height / 2)
    let distance = 1 - Math.sqrt(disX * disX + disY * disY) / radius
    if (distance > 1) {
      distance = 1
    } else if (distance < 0) {
      distance = 0
    }
    let max = 1.2
    let min = 1
    let scale = min + distance * (max - min)
    song.style.transform = "scale("+scale+")"
  }
})

function findDirection(noteNum, sngName) {
  if (infoKey[listOfNotes[sngName][noteNum].split(';')[1]] == "horizontalLane") {
    if (Number(listOfNotes[sngName][noteNum].split(';')[2].split("")[1]) > 3) {
      return ("right")
    } else {
      return ("left")
    }
  } else {
    if (Number(listOfNotes[sngName][noteNum].split(';')[2].split("")[1]) > 3) {
      return ("bottom")
    } else {
      return ("top")
    }
  }
}
let text;
let stopEnding = false;
let music = new Audio();
let volume = 0.2;
const fileInput = document.getElementById("fileInput");
fileInput.addEventListener("change", async function () {
  try {
    for (const file of fileInput.files) {
      const zip = await JSZip.loadAsync(file);
      if (
        "notes.txt" in zip.files &&
        "art/cover.png" in zip.files &&
        "sng.mp3" in zip.files &&
        "fileInfo.txt" in zip.files
      ) {
        //load cover art url
        const blob = await zip.file("art/cover.png").async("blob")
        //load songinfo
        text = await zip.file("fileInfo.txt").async("string")
        text = text.split(",")
        //load notes
        let outputNotes = await zip.file("notes.txt").async("string")
        listOfNotes[text[0].split(":")[1].split("\n")[0]] = outputNotes.split(",")
        //load song
        const raw = await zip.file("sng.mp3").async("blob")
        let sngBlob = new Blob([raw], { type: "audio/mpeg" })
        sngBlob = URL.createObjectURL(sngBlob)
        songInfo[text[0].split(":")[1].split("\n")[0]] = {
          name: text[0].split(":")[1].split("\n")[0],
          creator: text[1].split(":")[1].split("\n")[0],
          stars: text[2].split(":")[1].split("\n")[0],
          songOwner: text[3].split(":")[1].split("\n")[0],
          songSrc: sngBlob,
          imgSrc: URL.createObjectURL(blob),
        }
        //load into ui
        let clone = document.getElementById('templateSongHolder').cloneNode(true);
        clone.style.visibility = "visible"
        //clone.style.top = songInfo.length - 1 * 10
        clone.querySelector(".cover").src = URL.createObjectURL(blob)
        clone.onclick = () => loadSong(text[0].split(":")[1].split("\n")[0]);
        clone.querySelector(".sngName").textContent = text[0].split(":")[1].split("\n")[0]
        clone.querySelector(".starValue").textContent = text[2].split(":")[1].split("\n")[0]
        document.getElementById("uiHolder").appendChild(clone)
      } else {
        console.log("JSZip ERROR: missing files!")
        //showError("We can't seem to decode that file!")
      }
    }
  } catch (err) {
    console.log("JSZip ERROR:", err);
  }
});
function loadSong(songName) {
  document.getElementById("gameOver").style.visibility = "hidden"
  document.getElementById("displayResults").style.visibility = "hidden"
  let noteCounter = 0;
  spawnedNotes = 0
  moveActive = false
  misses = 0
  wastedMoves = 0
  accuracy = 100
  stopEnding = true
  noJudge = false
  hits = 0
  decodedNotes = []
  if (music) {
    music.pause()
  }
  music = new Audio(songInfo[songName].songSrc)
  music.volume = volume
  while (noteCounter != listOfNotes[songName].length) {
    if (listOfNotes[songName][noteCounter].split(";")[0] == "end") {
      decodedNotes[noteCounter] = {
        id: "end",
        frame: listOfNotes[songName][noteCounter].split(';')[1].split('f')[1],
      }
    } else {
      decodedNotes[noteCounter] = {
        id: noteCounter,
        noteType: noteKey[listOfNotes[songName][noteCounter].split(';')[0]],
        laneType: infoKey[listOfNotes[songName][noteCounter].split(';')[1]],
        trackType: infoKey[listOfNotes[songName][noteCounter].split(';')[2]],
        frame: listOfNotes[songName][noteCounter].split(';')[3].split('f')[1],
        moveDirection: findDirection(noteCounter, songName),
      }
    }
    noteCounter++;
  }
  if (decodedNotes) {
    music.play()
    stopLoops = true
    frame = 0;
    soulHealth = 100
    score = 0
    combo = 0
    updateHealth()
    lastTimeCounted = 0;
    removeNotes()
    stopLoops = false
    requestAnimationFrame(songLoop);
  }
}
const healthBar = document.getElementById("healthBar")
const fullHealth = Number(healthBar.style.width.split("vw")[0])
function updateHealth() {
  healthBar.style.width = (soulHealth / 100) * fullHealth + "vw";
  if (soulHealth <= 0) {
    stopEnding = false
    requestAnimationFrame(showEndScreen)
    drumrollPlayed = false
    lastTimeCountedEnding = 0
    timeElapsedEnding = 0
  }
}

function songLoop(timeStamp) {
  const timeElapsed = timeStamp - lastTimeCounted;
  if (timeElapsed >= 100) {
    let noteCounter = 0;
    //spawn new notes
    while (noteCounter != decodedNotes.length) {
      if (decodedNotes[noteCounter].frame == frame) {
        spawnedNotes++
        let clone = document.getElementById('templateNoteHolder').cloneNode(true);
        clone.style.visibility = "visible"
        clone.id = "note" + decodedNotes[noteCounter].id
        if (decodedNotes[noteCounter].laneType == "horizontalLane") {
          clone.style.top = decodedNotes[noteCounter].trackType
        } else {
          clone.style.left = decodedNotes[noteCounter].trackType
        }
        document.getElementById(decodedNotes[noteCounter].laneType).appendChild(clone)
      }
      noteCounter++
    }
    lastTimeCounted = timeStamp;
    frame++
    //move notes
    for (let elementToMove of Array.from(
      document.getElementsByClassName("noteHolder"),
    )) {
      if (elementToMove.id != "templateNoteHolder") {
        let noteNum = elementToMove.id.split("note")[1]
        if (Number(elementToMove.style[decodedNotes[noteNum].moveDirection].split("%")[0]) >= 100) {
          if (dodgeMode == false) {
              soulHealth -= 10
              misses++
              updateHealth()
            }
              elementToMove.remove()
            } else {
              elementToMove.style[decodedNotes[noteNum].moveDirection] = (Number(elementToMove.style[decodedNotes[noteNum].moveDirection].split("%")[0]) + 2) + "%"
            }
          //check if notes are touching the soul (player)
        const soulBoundingBox = soul.getBoundingClientRect()
        const elementBoundingBox = elementToMove.getBoundingClientRect()
        if (
            elementBoundingBox.x + elementBoundingBox.width >= soulBoundingBox.x &&
            elementBoundingBox.x <= soulBoundingBox.x + soulBoundingBox.width &&
            elementBoundingBox.y + elementBoundingBox.height >= soulBoundingBox.y &&
            elementBoundingBox.y <= soulBoundingBox.y + soulBoundingBox.height
        ) {
            combo++
            hits++
            accuracyBoundingBox = elementToMove.querySelector(".noteAccuracy").getBoundingClientRect()
            if (
            accuracyBoundingBox.x + accuracyBoundingBox.width >= soulBoundingBox.x &&
            accuracyBoundingBox.x <= soulBoundingBox.x + soulBoundingBox.width &&
            accuracyBoundingBox.y + accuracyBoundingBox.height >= soulBoundingBox.y &&
            accuracyBoundingBox.y <= soulBoundingBox.y + soulBoundingBox.height
            ) {
              score += maxPerNote
            } else {
              score += maxPerNote / 2
            }
            elementToMove.remove()
          }
        }
      }
    updateCounters()
  }
  if (hits + misses >= decodedNotes.length) {
    stopEnding = false
    requestAnimationFrame(showEndScreen)
    drumrollPlayed = false
    lastTimeCountedEnding = 0
    timeElapsedEnding = 0
  }
  if (stopLoops != true) {
    requestAnimationFrame(songLoop);
  } else {
    lastTimeCounted = timeStamp;
  }
}

function removeNotes() {
  for (let elementToHide of Array.from(
    document.getElementsByClassName("noteHolder"),
  )) {
    if (elementToHide.id != "templateNoteHolder") {
      elementToHide.remove();
    }
  }
}

function updateCounters() {
  if (hits + misses + wastedMoves > 0) {
    accuracy = Math.floor(score / (hits + misses + wastedMoves) / maxPerNote * 100)
  }
  document.getElementById("accuracyCounter").textContent = accuracy + "%"
  document.getElementById("missCounter").textContent = misses
  document.getElementById("scoreCounter").textContent = Math.round(score)
  document.getElementById("comboCounter").textContent = combo
}

function settings(toDo) {
  console.log(music.volume)
  if (toDo == "volumeUp") {
    if (music.volume < 1.0) {
      music.volume = Math.min(1.0, music.volume + 0.1);
    }
  } else if (toDo == "volumeDown") {
    if (music.volume > 0.0) {
      music.volume = Math.max(0.0, music.volume - 0.1);
    }
  }
  volume = music.volume
  drumroll.volume = volume
}

function judgeMove() {
  if (!noJudge) {
    if (moveActive && hits == hitsBeforeMove) {
      wastedMoves++
    }
    moveActive = false
  }
}
let paused = false;
let counterNumber = 0;
let keysDown = [];
let fadeIntro = false;
const allowedKeys = [37, 38, 39, 40, 27];
const introDiv = document.getElementById("introDiv");
$(document).ready(function () {
  //run code when document has finished loading
  ($(document).keydown(function (event) {
    //when a key is pressed, run the following code
    if (allowedKeys.includes(event.which)) {
      const isFreshPress = keysDown.includes(event.which) == false;
      if (isFreshPress) {
        keysDown[keysDown.length] = event.which;
      }
      if (event.which == 27) {
        let screen = document.getElementById("pauseScreen")
        if (paused == true) {
          screen.style.visibility = "hidden"
          paused = false
        } else {
          screen.style.visibility = "visible"
          paused = true
        }
      } else {
        if (paused == false) {
          if (isFreshPress) {
            judgeMove()
            hitsBeforeMove = hits
            moveActive = true
          }
        if (event.which == 38) {
          soul.style.top = "13.5%";
          soul.style.left = "45%";
          if (introDiv) {
            document.getElementById("keyUp").src = "assets/img/keys/upPressed.png"
          }
        } else if (event.which == 40) {
          soul.style.top = "76.5%";
          soul.style.left = "45%";
          if (introDiv) {
            document.getElementById("keyDown").src = "assets/img/keys/downPressed.png"
          }
        } else if (event.which == 37) {
          soul.style.top = "45%";
          soul.style.left = "13.5%";
          if (introDiv) {
            document.getElementById("keyLeft").src = "assets/img/keys/leftPressed.png"
          }
        } else if (event.which == 39) {
          soul.style.top = "45%";
          soul.style.left = "76.5%";
          if (introDiv) {
            document.getElementById("keyRight").src = "assets/img/keys/rightPressed.png"
          }
        }
      }
    }
  }
  }),
    $(document).keyup(function (event) {
      if (paused == false) {
        if (keysDown.includes(event.which)) {
          if (introDiv) {
            if (event.which == 38) {
              document.getElementById("keyUp").src = "assets/img/keys/up.png"
            } else if (event.which == 40) {
              document.getElementById("keyDown").src = "assets/img/keys/down.png"
            } else if (event.which == 37) {
              document.getElementById("keyLeft").src = "assets/img/keys/left.png"
            } else if (event.which == 39) {
              document.getElementById("keyRight").src = "assets/img/keys/right.png"
            }
          }
          while (
            keysDown[counterNumber] != event.which &&
            counterNumber < keysDown.length
          ) {
            counterNumber++;
          }
          keysDown.splice(counterNumber, 1);
          counterNumber = 0;
          if (keysDown.length == 0) {
            soul.style.top = "45%";
            soul.style.left = "45%";
            judgeMove()
          }
        }
      }
      }));
});
let note = document.getElementById("displayNote");
let pauseTimer = 0;
let stopIntro = false;
function animateIntro() {
  if (fadeIntro == true) {
    document.getElementById('okKey').src = 'assets/img/keys/okPressed.png'
    introDiv.style.bottom = (parseFloat(introDiv.style.bottom) + 3) + "%"
    if (introDiv.style.bottom.split("%")[0] >= 100) {
      stopIntro = true
    }
  } else {
    if (pauseTimer == 0) {
      if (parseFloat(note.style.top) <= 38) {
        pauseTimer = 50
      } else {
        note.style.top = (parseFloat(note.style.top) - 0.1) + "%"
      }
    } else {
      pauseTimer -= 1
      if (pauseTimer == 0) {note.style.top = "55%"}
    }
  }
  if (stopIntro == false) {
    requestAnimationFrame(animateIntro)
  }
}
requestAnimationFrame(animateIntro)

function showEndScreen(endingTimeStamp) {
  if (!stopEnding) {
    timeElapsedEnding = endingTimeStamp - lastTimeCountedEnding
    if (drumrollPlayed == false) {
      noJudge = true
      lastTimeCountedEnding = endingTimeStamp
      timeElapsedEnding = endingTimeStamp - lastTimeCountedEnding
      drumroll.play()
      stopLoops = true
      music.volume = volume / 2
      soulHealth = 100
      removeNotes()
      drumrollPlayed = true
      document.getElementById("gameOver").style.visibility = "visible"
    }
    if (timeElapsedEnding >= 2000) {
      let accuracyText
      // should have done this in a table but i'm too sleepy
      if (accuracy > 0) {
        accuracyText = "meh.."
        if (accuracy >= 40) {
          accuracyText = "ok."
        }
        if (accuracy >= 60) {
          accuracyText = "alright"
        }
        if (accuracy >= 80) {
          accuracyText = "good!"
        }
        if (accuracy >= 90) {
          accuracyText = "amazing!!"
        }
        if (accuracy >= 95) {
          accuracyText = "so close!!!"
        }
        if (accuracy == 100) {
          accuracyText = "PERFECT!"
        }
      } else {
        accuracyText = "horrible..."
      }
      document.getElementById("displayResults").textContent = accuracyText
      document.getElementById("displayResults").style.visibility = "visible"
    } else {
      requestAnimationFrame(showEndScreen)
    }
  }
}
