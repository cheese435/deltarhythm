let stopLoops = false;
let notes = ["1;H;L1;f1", "1;H;L2;f1", "1;H;L3;f1", "1;H;L4;f1", "1;H;L5;f1", "1;H;L6;f1", "1;V;L1;f1", "1;V;L2;f1", "1;V;L3;f1", "1;V;L4;f1", "1;V;L5;f1", "1;V;L6;f1", "end;f5"];
let listOfNotes = {}
let songInfo = {}
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
const song = { bpm: 60 }
const dodgeMode = false
let decodedNotes = []
const soul = document.getElementById("soul")
let soulHealth = 100
const scriptUrl = document.currentScript.src;
const map = new URL('./deltarhythm/maps/OchameKiou[DEMO].deltazip', scriptUrl);

async function loadZipFromRoot(path = map) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Couldn't fetch ${path}: ${res.status}`);

  const data = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(data);
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
    document.getElementById("uiHolder").appendChild(clone)
  } else {
    console.log("JSZip ERROR: missing files!")
    //showError("We can't seem to decode that file!")
  }
}
loadZipFromRoot()
const mouse = {}
addEventListener('mousemove', (event) => {
  mouse.x = event.clientX
  mouse.y = event.clientY
})

function findDirection(noteNum) {
  if (infoKey[notes[noteNum].split(';')[1]] == "horizontalLane") {
    if (Number(notes[noteNum].split(';')[2].split("")[1]) > 3) {
      return ("right")
    } else {
      return ("left")
    }
  } else {
    if (Number(notes[noteNum].split(';')[2].split("")[1]) > 3) {
      return ("bottom")
    } else {
      return ("top")
    }
  }
}
let text;
let music;
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
  let noteCounter = 0;
  decodedNotes = []
  if (music) {
    music.pause()
  }
  music = new Audio(songInfo[songName].songSrc)
  music.volume = 0.2;
  while (noteCounter != listOfNotes[songName].length) {
    if (notes[noteCounter].split(";")[0] == "end") {
      decodedNotes[noteCounter] = {
        id: "end",
        frame: notes[noteCounter].split(';')[1].split('f')[1],
      }
    } else {
      decodedNotes[noteCounter] = {
        id: noteCounter,
        noteType: noteKey[notes[noteCounter].split(';')[0]],
        laneType: infoKey[notes[noteCounter].split(';')[1]],
        trackType: infoKey[notes[noteCounter].split(';')[2]],
        frame: notes[noteCounter].split(';')[3].split('f')[1],
        moveDirection: findDirection(noteCounter),
      }
    }
    noteCounter++;
  }
  if (decodedNotes) {
    music.play()
    requestAnimationFrame(songLoop);
  }
}
let frame = 0;
let lastTimeCounted = 0;
function songLoop(timeStamp) {
  const timeElapsed = timeStamp - lastTimeCounted;
  if (timeElapsed >= 100) {
    let noteCounter = 0;
    //spawn new notes
    while (noteCounter != decodedNotes.length) {
      if (decodedNotes[noteCounter].frame == frame) {
        let clone = document.getElementById('templateNoteHolder').cloneNode(true);
        clone.style.visibility = "visible"
        clone.id = "note" + decodedNotes[noteCounter].id

        //if (Number(decodedNotes[noteCounter].trackType.split("")[1]) > 3) {
          //  clone.style.right = "0%"
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
          if (dodgeMode == true) {
            soulHealth -= 20
          }
            elementToMove.remove()
          }
        }
    }
    if (soulHealth <= 0) {
      console.log("dead!")
    }
  }
  if (stopLoops != true) {
    requestAnimationFrame(songLoop);
  } else {
    lastTimeCounted = timeStamp;
  }
}

function removeNotes() {
  //removeNotes
  for (let elementToHide of Array.from(
    document.getElementsByClassName("noteHolder"),
  )) {
    if (elementToHide.id != "noteHolder") {
      elementToHide.remove();
    }
  }
}

let counterNumber = 0;
let keysDown = [];
const allowedKeys = [37, 38, 39, 40];
$(document).ready(function () {
  //run code when document has finished loading
  ($(document).keydown(function (event) {
    //when a key is pressed, run the following code
    if (allowedKeys.includes(event.which)) {
      if (keysDown.includes(event.which) == false) {
        keysDown[keysDown.length] = event.which;
      }
      if (event.which == 38) {
        soul.style.top = "13.5%";
        soul.style.left = "45%";
      } else if (event.which == 40) {
        soul.style.top = "76.5%";
        soul.style.left = "45%";
      } else if (event.which == 37) {
        soul.style.top = "45%";
        soul.style.left = "13.5%";
      } else if (event.which == 39) {
        soul.style.top = "45%";
        soul.style.left = "76.5%";
      }
    }
  }),
    $(document).keyup(function (event) {
      if (keysDown.includes(event.which)) {
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
        }
      }
    }));
});
