// const { spawn } = require("child_process");
// const songs = ["Queen", "Redbone", "Sample", "Dhurandhar"];

// let selected = 1;
// showSongs();

// process.stdin.setEncoding("utf-8");
// process.stdin.setRawMode(true);

// process.stdin.on("data", (input) => {
//   if (input === "q") {
//     process.stdin.setRawMode(false);
//     process.exit(0);
//   }

//   // Up Arrow
//   if (input === "\u001b[A") {
//     selected = Math.max(1, selected - 1);
//     console.clear();
//     showSongs();
//   }

//   // Down Arrow
//   if (input === "\u001b[B") {
//     selected = Math.min(songs.length, selected + 1);
//     console.clear();
//     showSongs();
//   }

//   }
// );

// function showSongs() {
//   for (let i = 0; i < songs.length; i++) {
//       console.log(`->${i + 1}: ${songs[i]}`);
//   }
// }





const songs = ["Queen", "Redbone", "Sample", "Dhurandhar"];

let selected = 0; // Array starts from index 0

showSongs();

process.stdin.setEncoding("utf-8");
process.stdin.setRawMode(true);

process.stdin.on("data", (input) => {

  if (input === "q") {
    process.stdin.setRawMode(false);
    process.exit(0);
  }


  if (input === "\u001b[A") {
    selected = Math.max(0, selected - 1);
    console.clear();
    showSongs();
  }


  if (input === "\u001b[B") {
    selected = Math.min(songs.length - 1, selected + 1);
    console.clear();
    showSongs();
  }


  if (input === "\r") {
    playSong(selected);
  }
});

function showSongs() {
  for (let i = 0; i < songs.length; i++) {
    if (i === selected) {
      console.log(`-> ${i + 1}: ${songs[i]}`);
    } else {
      console.log(`   ${i + 1}: ${songs[i]}`);
    }
  }

  console.log("\n Use Arrow Keys | Enter = Play | q = Quit");
}

function playSong(index) {
  console.clear();

  console.log(`🎵 Playing: ${songs[index]}`);


  spawn("afplay", [`songs/${songs[index]}.mp3`]);
}