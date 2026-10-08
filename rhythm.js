let stopLoops = false;
let notes = ["1;H;L1;f9", "2;V;L2;f6", "3;H;L5;f12"];
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

let decodedNotes = []
function loadSongData() {
  let noteCounter = 0;
  while (noteCounter != notes.length) {
    decodedNotes[noteCounter] = {
      id: noteCounter,
      noteType: noteKey[notes[noteCounter].split(';')[0]],
      laneType: infoKey[notes[noteCounter].split(';')[1]],
      trackType: notes[noteCounter].split(';')[2],
      frame: notes[noteCounter].split(';')[3].split('f')[1],
    }
    noteCounter++;
  }
}

let frame = 0;
let lastTimeCounted = 0;

function songLoop(timeStamp) {
  const timeElapsed = timeStamp - lastTimeCounted;
  if (timeElapsed >= 100) {
    let noteCounter = 0;
    while (noteCounter != notes.length) {
      if (decodedNotes[noteCounter].frame == frame) {
        let clone = document.getElementById('templateNoteHolder').cloneNode(true);
        clone.style.visibility = "visible"
        document.getElementById(decodedNotes[noteCounter].laneType).appendChild(clone)

        if (decodedNotes[noteCounter].laneType == "horizontalLane") {
          clone.style.top = infoKey[decodedNotes[noteCounter].trackType]
          if (Number(decodedNotes[noteCounter].trackType.split("")[1]) > 3) {
            clone.style.left = "91.5%"
          }
        } else {
          clone.style.left = infoKey[decodedNotes[noteCounter].trackType]
          if (Number(decodedNotes[noteCounter].trackType.split("")[1]) > 3) {
            clone.style.top = "84%"
          }
        }
        document.getElementById(decodedNotes[noteCounter].laneType).appendChild(clone)
      }
      noteCounter++
    }
    lastTimeCounted = timeStamp;
    frame++
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

const fileInput = document.getElementById("fileInput");
fileInput.addEventListener("change", previewFile);
function previewFile() {
  const file = fileInput.files[0]; //grab first (and only) file
  const reader = new FileReader(); //setup reader

  reader.addEventListener("load", () => {
    //reader script
    notes = reader.result.replace("\n", "").split(",");
    noteInfo = notes[0].split(";");
    spawnNotes();
  });

  if (file) {
    //if file, run reader
    reader.readAsText(file);
  }
}

let soul = document.getElementById("soul");
let counterNumber = 0;
loadSongData()
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

requestAnimationFrame(songLoop);
