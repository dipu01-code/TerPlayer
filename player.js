#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Box,
  Text,
  render,
  useApp,
  useInput,
} from "ink";

import audio from "audio";
import { parseFile } from "music-metadata";

import {
  SUPPORTED_EXTENSIONS,
  clamp,
  wrapIndex,
  formatTime,
  formatDuration,
  makeProgressBar,
  stripExtension,
  repeatLabel,
  playbackLabel,
  getVisibleTracks,
  decideNextTrackIndex,
  randomIndex,
} from "./src/player-core.js";

const h = React.createElement;

const SONGS_DIR = path.join(process.cwd(), "songs");

const PROGRESS_WIDTH = 36;
const MENU_VIEW_SIZE = 8;

const SPINNER_FRAMES = [
  "|",
  "/",
  "-",
  "\\",
];

const TITLE_BLOCK = [
  "TTTTT EEEEE RRRR  PPPP  L      A   Y   Y EEEEE RRRR ",
  "  T   E     R   R P   P L     A A   Y Y  E     R   R",
  "  T   EEEE  RRRR  PPPP  L    AAAAA   Y   EEEE  RRRR ",
  "  T   E     R  R  P     L    A   A   Y   E     R  R ",
  "  T   EEEEE R   R P     LLLLLA   A   Y   EEEEE R   R",
];

const ACCENT_COLORS = [
  "cyan",
  "magenta",
  "yellow",
  "blue",
  "green",
  "red",
];

const THEMES = [
  {
    name: "Aurora",
    headerBorder: "cyan",
    menuBorder: "magenta",
    statusBorder: "yellow",
    helpBorder: "blue",
    title: "cyan",
    selected: "cyan",
    active: "green",
    keyHint: "magenta",
  },

  {
    name: "Sunset",
    headerBorder: "red",
    menuBorder: "yellow",
    statusBorder: "magenta",
    helpBorder: "cyan",
    title: "red",
    selected: "yellow",
    active: "green",
    keyHint: "cyan",
  },

  {
    name: "Ocean",
    headerBorder: "blue",
    menuBorder: "cyan",
    statusBorder: "green",
    helpBorder: "magenta",
    title: "blue",
    selected: "cyan",
    active: "green",
    keyHint: "blue",
  },
];


// ==================================================
// LOAD TRACKS
// ==================================================

const loadTracks = async () => {
  if (!fs.existsSync(SONGS_DIR)) {
    throw new Error(
      `Songs folder not found at ${SONGS_DIR}`
    );
  }

  const files = fs
    .readdirSync(SONGS_DIR)
    .filter((file) =>
      SUPPORTED_EXTENSIONS.has(
        path.extname(file).toLowerCase()
      )
    );

  if (files.length === 0) {
    throw new Error(
      "No supported audio files found in songs/. Add at least one song."
    );
  }

  const tracks = files
    .sort((a, b) =>
      a.localeCompare(
        b,
        undefined,
        {
          sensitivity: "base",
        }
      )
    )
    .map((file, index) => {
      const absolutePath = path.join(
        SONGS_DIR,
        file
      );

      return {
        id: `${index}-${file}`,
        index,
        file,
        title: stripExtension(file),
        absolutePath,
        durationSec: null,
      };
    });

  return tracks;
};


// ==================================================
// MAIN APPLICATION
// ==================================================

const App = ({ tracks }) => {
  const { exit } = useApp();


  // -----------------------------------------------
  // STATE
  // -----------------------------------------------

  const [
    selectedIndex,
    setSelectedIndex,
  ] = useState(0);

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(null);

  const [
    isPlaying,
    setIsPlaying,
  ] = useState(false);

  const [
    isPaused,
    setIsPaused,
  ] = useState(false);

  const [
    spinnerIndex,
    setSpinnerIndex,
  ] = useState(0);

  const [
    elapsedSec,
    setElapsedSec,
  ] = useState(0);

  const [
    themeIndex,
    setThemeIndex,
  ] = useState(0);

  const [
    shuffle,
    setShuffle,
  ] = useState(false);

  const [
    repeatMode,
    setRepeatMode,
  ] = useState("off");

  const [
    showHelp,
    setShowHelp,
  ] = useState(false);

  const [
    activityFeed,
    setActivityFeed,
  ] = useState([
    "Welcome to TerPlayer.",
  ]);

  const [
    trackDurations,
    setTrackDurations,
  ] = useState({});

  const [
    statusMessage,
    setStatusMessage,
  ] = useState(
    "Select a track and press Enter to play."
  );


  // -----------------------------------------------
  // REFS
  // -----------------------------------------------

  const audioRef = useRef(null);

  const currentIndexRef =
    useRef(currentIndex);

  const shuffleRef =
    useRef(shuffle);

  const repeatModeRef =
    useRef(repeatMode);

  const shouldExitRef =
    useRef(false);

  const manualStopRef =
    useRef(false);


  // -----------------------------------------------
  // SYNC REFS
  // -----------------------------------------------

  useEffect(() => {
    currentIndexRef.current =
      currentIndex;
  }, [currentIndex]);


  useEffect(() => {
    shuffleRef.current =
      shuffle;
  }, [shuffle]);


  useEffect(() => {
    repeatModeRef.current =
      repeatMode;
  }, [repeatMode]);


  // -----------------------------------------------
  // ACTIVITY FEED
  // -----------------------------------------------

  const pushActivity = useCallback(
    (message) => {
      setActivityFeed(
        (previous) =>
          [message, ...previous].slice(0, 3)
      );
    },
    []
  );


  // =================================================
  // LOAD DURATIONS
  // =================================================

  useEffect(() => {
    let cancelled = false;

    const loadDurationsInBackground =
      async () => {

        for (const track of tracks) {

          if (cancelled) {
            return;
          }

          if (
            trackDurations[track.id] !==
            undefined
          ) {
            continue;
          }

          try {
            const metadata =
              await parseFile(
                track.absolutePath
              );

            if (cancelled) {
              return;
            }

            const durationSec =
              metadata.format.duration ??
              null;

            setTrackDurations(
              (previous) => ({
                ...previous,
                [track.id]:
                  durationSec,
              })
            );

          } catch {

            if (cancelled) {
              return;
            }

            setTrackDurations(
              (previous) => ({
                ...previous,
                [track.id]: null,
              })
            );
          }
        }
      };

    loadDurationsInBackground();

    return () => {
      cancelled = true;
    };

  }, [tracks, trackDurations]);


  // =================================================
  // PLAY TRACK
  // =================================================

  const playTrack = useCallback(
    async (index) => {

      if (tracks.length === 0) {
        return;
      }


      const safeIndex =
        clamp(
          index,
          0,
          tracks.length - 1
        );


      const track =
        tracks[safeIndex];


      // Stop current player

      if (audioRef.current) {

        manualStopRef.current = true;

        try {
          audioRef.current.stop();
        } catch {
          // Ignore stop errors
        }

        try {
          audioRef.current.dispose();
        } catch {
          // Ignore dispose errors
        }

        audioRef.current = null;
      }


      try {

        // Create audio object

        const player =
          audio(
            track.absolutePath
          );


        audioRef.current =
          player;


        manualStopRef.current =
          false;


        // Wait until the audio is decoded

        await player;


        // If another track replaced this one
        // while loading, do nothing.

        if (
          audioRef.current !==
          player
        ) {
          return;
        }


        // Start playback

        player.play();


        setCurrentIndex(
          safeIndex
        );

        setSelectedIndex(
          safeIndex
        );

        setElapsedSec(0);

        setIsPlaying(true);

        setIsPaused(false);


        setStatusMessage(
          `Playing: ${track.title}`
        );

        pushActivity(
          `Playing: ${track.title}`
        );


        // -------------------------------------------
        // TIME UPDATE
        // -------------------------------------------

        player.on(
          "timeupdate",
          (currentTime) => {

            // Important:
            // Update only if this is still
            // the active audio instance.

            if (
              audioRef.current !==
              player
            ) {
              return;
            }

            setElapsedSec(
              Number(currentTime) || 0
            );
          }
        );


        // -------------------------------------------
        // PLAY EVENT
        // -------------------------------------------

        player.on(
          "play",
          () => {

            if (
              audioRef.current !==
              player
            ) {
              return;
            }

            setIsPlaying(true);

            setIsPaused(false);
          }
        );


        // -------------------------------------------
        // PAUSE EVENT
        // -------------------------------------------

        player.on(
          "pause",
          () => {

            if (
              audioRef.current !==
              player
            ) {
              return;
            }

            setIsPaused(true);
          }
        );


        // -------------------------------------------
        // TRACK ENDED
        // -------------------------------------------

        player.on(
          "ended",
          () => {

            if (
              audioRef.current !==
              player
            ) {
              return;
            }


            if (
              manualStopRef.current
            ) {
              return;
            }


            setIsPlaying(false);

            setIsPaused(false);

            setElapsedSec(0);


            if (
              shouldExitRef.current
            ) {

              exit();

              return;
            }


            const nextIndex =
              decideNextTrackIndex({

                justFinishedIndex:
                  safeIndex,

                tracksLength:
                  tracks.length,

                repeatMode:
                  repeatModeRef.current,

                shuffle:
                  shuffleRef.current,

              });


            // No next song

            if (
              nextIndex == null
            ) {

              setCurrentIndex(null);

              setStatusMessage(
                "Playback finished."
              );

              pushActivity(
                "Reached end of queue."
              );

              return;
            }


            // Play next song

            playTrack(
              nextIndex
            );
          }
        );


      } catch (error) {

        if (
          audioRef.current ===
          null
        ) {
          return;
        }


        setIsPlaying(false);

        setIsPaused(false);

        setCurrentIndex(null);


        setStatusMessage(
          `Playback error: ${
            error?.message ??
            "Unable to load audio."
          }`
        );


        pushActivity(
          "Playback error."
        );
      }
    },

    [
      exit,
      pushActivity,
      tracks,
    ]
  );


  // =================================================
  // PAUSE / RESUME
  // =================================================

  const togglePause = useCallback(
    () => {

      const player =
        audioRef.current;


      if (!player) {
        return;
      }


      if (isPaused) {

        player.play();

        setIsPlaying(true);

        setIsPaused(false);


        setStatusMessage(
          "Resumed playback."
        );

        pushActivity(
          "Playback resumed."
        );

      } else {

        player.pause();

        setIsPaused(true);


        setStatusMessage(
          "Paused playback."
        );

        pushActivity(
          "Playback paused."
        );
      }

    },

    [
      isPaused,
      pushActivity,
    ]
  );


  // =================================================
  // STOP
  // =================================================

  const stopPlayback =
    useCallback(() => {

      manualStopRef.current =
        true;


      if (audioRef.current) {

        try {
          audioRef.current.stop();
        } catch {
          // Ignore errors
        }


        try {
          audioRef.current.dispose();
        } catch {
          // Ignore errors
        }


        audioRef.current =
          null;
      }


      setCurrentIndex(null);

      setIsPlaying(false);

      setIsPaused(false);

      setElapsedSec(0);


      setStatusMessage(
        "Stopped playback."
      );

      pushActivity(
        "Playback stopped."
      );

    }, [pushActivity]);


  // =================================================
  // NEXT TRACK
  // =================================================

  const nextTrack = useCallback(
    () => {

      if (tracks.length === 0) {
        return;
      }


      const base =
        currentIndexRef.current ??
        selectedIndex;


      const target =
        shuffleRef.current

          ? randomIndex(
              tracks.length,
              base
            )

          : decideNextTrackIndex({

              justFinishedIndex:
                base,

              tracksLength:
                tracks.length,

              repeatMode:
                "all",

              shuffle:
                false,

            }) ?? 0;


      playTrack(
        target
      );

    },

    [
      playTrack,
      selectedIndex,
      tracks.length,
    ]
  );


  // =================================================
  // PREVIOUS TRACK
  // =================================================

  const previousTrack =
    useCallback(() => {

      if (tracks.length === 0) {
        return;
      }


      const base =
        currentIndexRef.current ??
        selectedIndex;


      const target =
        shuffleRef.current

          ? randomIndex(
              tracks.length,
              base
            )

          : wrapIndex(
              base - 1,
              tracks.length
            );


      playTrack(
        target
      );

    },

    [
      playTrack,
      selectedIndex,
      tracks.length,
    ]
  );


  // =================================================
  // SPINNER
  // =================================================

  useEffect(() => {

    if (
      !isPlaying ||
      isPaused
    ) {
      return;
    }


    const spinnerTimer =
      setInterval(() => {

        setSpinnerIndex(
          (previous) =>
            (
              previous + 1
            ) %
            SPINNER_FRAMES.length
        );

      }, 180);


    return () => {
      clearInterval(
        spinnerTimer
      );
    };

  }, [
    isPlaying,
    isPaused,
  ]);


  // =================================================
  // CLEANUP
  // =================================================

  useEffect(() => {

    return () => {

      shouldExitRef.current =
        true;

      manualStopRef.current =
        true;


      if (audioRef.current) {

        try {
          audioRef.current.stop();
        } catch {
          // Ignore errors
        }


        try {
          audioRef.current.dispose();
        } catch {
          // Ignore errors
        }


        audioRef.current =
          null;
      }
    };

  }, []);


  // =================================================
  // KEYBOARD INPUT
  // =================================================

  useInput(
    (input, key) => {


      // UP

      if (
        key.upArrow ||
        input === "k"
      ) {

        setSelectedIndex(
          (previous) =>
            wrapIndex(
              previous - 1,
              tracks.length
            )
        );

        return;
      }


      // DOWN

      if (
        key.downArrow ||
        input === "j"
      ) {

        setSelectedIndex(
          (previous) =>
            wrapIndex(
              previous + 1,
              tracks.length
            )
        );

        return;
      }


      // PREVIOUS

      if (
        key.leftArrow
      ) {

        previousTrack();

        return;
      }


      // NEXT

      if (
        key.rightArrow
      ) {

        nextTrack();

        return;
      }


      // PLAY

      if (
        key.return
      ) {

        playTrack(
          selectedIndex
        );

        return;
      }


      // PAUSE / RESUME

      if (
        input === " "
      ) {

        togglePause();

        return;
      }


      // NEXT

      if (
        input === "n"
      ) {

        nextTrack();

        return;
      }


      // PREVIOUS

      if (
        input === "b"
      ) {

        previousTrack();

        return;
      }


      // SHUFFLE

      if (
        input === "s"
      ) {

        setShuffle(
          (previous) => {

            const next =
              !previous;


            setStatusMessage(
              `Shuffle ${
                next
                  ? "enabled"
                  : "disabled"
              }.`
            );


            pushActivity(
              `Shuffle ${
                next
                  ? "ON"
                  : "OFF"
              }.`
            );


            return next;
          }
        );

        return;
      }


      // REPEAT

      if (
        input === "t"
      ) {

        setRepeatMode(
          (previous) => {


            if (
              previous === "off"
            ) {

              setStatusMessage(
                "Repeat mode: all tracks."
              );

              pushActivity(
                "Repeat: ALL."
              );

              return "all";
            }


            if (
              previous === "all"
            ) {

              setStatusMessage(
                "Repeat mode: current track."
              );

              pushActivity(
                "Repeat: ONE."
              );

              return "one";
            }


            setStatusMessage(
              "Repeat mode: off."
            );

            pushActivity(
              "Repeat: OFF."
            );

            return "off";

          }
        );

        return;
      }


      // THEME

      if (
        input === "c"
      ) {

        setThemeIndex(
          (previous) => {

            const next =
              (
                previous + 1
              ) %
              THEMES.length;


            setStatusMessage(
              `Theme switched to ${
                THEMES[next].name
              }.`
            );


            pushActivity(
              `Theme: ${
                THEMES[next].name
              }`
            );


            return next;
          }
        );

        return;
      }


      // FIRST TRACK

      if (
        input === "g"
      ) {

        setSelectedIndex(0);

        return;
      }


      // LAST TRACK

      if (
        input === "G"
      ) {

        setSelectedIndex(
          Math.max(
            0,
            tracks.length - 1
          )
        );

        return;
      }


      // HELP

      if (
        input === "?"
      ) {

        setShowHelp(
          (previous) =>
            !previous
        );

        pushActivity(
          "Toggled help panel."
        );

        return;
      }


      // STOP

      if (
        input === "x"
      ) {

        stopPlayback();

        return;
      }


      // QUIT

      if (
        input === "q" ||
        (
          key.ctrl &&
          input === "c"
        )
      ) {

        shouldExitRef.current =
          true;

        stopPlayback();

        exit();

      }

    }
  );


  // =================================================
  // UI VALUES
  // =================================================

  const currentTrack =
    currentIndex != null
      ? tracks[currentIndex]
      : null;


  const selectedTrack =
    tracks[selectedIndex] ??
    null;


  const displayTrack =
    currentTrack ??
    selectedTrack;


  const visibleTracks =
    getVisibleTracks(
      tracks,
      selectedIndex,
      currentIndex,
      MENU_VIEW_SIZE
    );


  const currentTrackDuration =
    currentTrack

      ? (
          trackDurations[
            currentTrack.id
          ] ??

          currentTrack.durationSec ??

          null
        )

      : null;


  const displayTrackDuration =
    displayTrack

      ? (
          trackDurations[
            displayTrack.id
          ] ??

          displayTrack.durationSec ??

          null
        )

      : null;


  const cappedElapsed =
    useMemo(() => {

      if (
        !currentTrackDuration
      ) {
        return elapsedSec;
      }


      return clamp(
        elapsedSec,
        0,
        currentTrackDuration
      );

    }, [
      currentTrackDuration,
      elapsedSec,
    ]);


  const progressBar =
    makeProgressBar(
      cappedElapsed,
      displayTrackDuration,
      PROGRESS_WIDTH
    );


  const elapsedLabel =
    formatTime(
      cappedElapsed
    );


  const durationLabel =
    formatDuration(
      displayTrackDuration
    );


  const trackCountLabel =
    `${selectedIndex + 1}/${tracks.length}`;


  const stateLabel =
    playbackLabel(
      isPlaying,
      isPaused
    );


  const repeatModeLabel =
    repeatLabel(
      repeatMode
    );


  const stateColor =
    !isPlaying
      ? "red"
      : isPaused
        ? "yellow"
        : "green";


  const spinner =
    isPlaying &&
    !isPaused

      ? SPINNER_FRAMES[
          spinnerIndex
        ]

      : " ";


  const theme =
    THEMES[
      themeIndex
    ];


  const accentColor =
    ACCENT_COLORS[
      spinnerIndex %
      ACCENT_COLORS.length
    ];


  // =================================================
  // UI
  // =================================================

  return h(

    Box,

    {
      flexDirection:
        "column",

      paddingX: 1,

      paddingY: 1,
    },


    // ===============================================
    // HEADER
    // ===============================================

    h(

      Box,

      {
        borderStyle:
          "round",

        borderColor:
          theme.headerBorder,

        paddingX: 1,

        flexDirection:
          "column",
      },


      ...TITLE_BLOCK.map(
        (line, idx) =>

          h(

            Text,

            {
              key:
                `title-${idx}`,

              bold: true,

              color:
                idx % 2 === 0
                  ? theme.title
                  : accentColor,
            },

            line
          )
      ),


      h(
        Text,

        {
          color: "gray",
        },

        "Terminal music player"
      ),


      h(
        Text,

        {
          color:
            stateColor,
        },

        `${spinner} State ${stateLabel}`
      ),


      h(
        Text,

        {
          color: "gray",
        },

        `Theme ${theme.name} | ` +
        `Shuffle ${
          shuffle
            ? "ON"
            : "OFF"
        } | ` +
        `Repeat ${repeatModeLabel}`
      ),


      h(
        Text,

        {
          color: "white",
        },

        `Now Playing: ${
          currentTrack
            ? currentTrack.title
            : "None"
        }`
      ),


      h(
        Text,

        {
          color: "blue",
        },

        `Selected: ${
          selectedTrack
            ? selectedTrack.title
            : "None"
        } (${trackCountLabel})`
      ),


      h(
        Text,

        {
          color: "green",
        },

        `${progressBar} ` +
        `${elapsedLabel} / ` +
        `${durationLabel}`
      )
    ),


    h(
      Text,
      null,
      ""
    ),


    // ===============================================
    // MUSIC MENU
    // ===============================================

    h(

      Box,

      {
        borderStyle:
          "round",

        borderColor:
          theme.menuBorder,

        paddingX: 1,

        flexDirection:
          "column",
      },


      h(

        Text,

        {
          bold: true,

          color:
            theme.menuBorder,
        },

        `Music Menu (${tracks.length} tracks)`
      ),


      visibleTracks.start > 0

        ? h(
            Text,

            {
              color: "gray",
            },

            "..."
          )

        : null,


      ...visibleTracks.items.map(
        (track, offset) => {

          const index =
            visibleTracks.start +
            offset;


          const selected =
            index ===
            selectedIndex;


          const active =
            index ===
            currentIndex;


          const pointer =
            selected
              ? ">"
              : " ";


          const marker =
            active
              ? "P"
              : " ";


          const itemDuration =
            formatDuration(

              trackDurations[
                track.id
              ] ??

              track.durationSec ??

              null
            );


          const line =
            `${pointer}${marker} ` +
            `${String(
              index + 1
            ).padStart(
              2,
              "0"
            )}. ` +
            `${track.title} ` +
            `(${itemDuration})`;


          const color =
            active
              ? theme.active
              : selected
                ? theme.selected
                : "white";


          return h(

            Text,

            {
              key:
                track.id,

              color,

              bold:
                selected ||
                active,
            },

            line
          );
        }
      ),


      visibleTracks.end <
      tracks.length

        ? h(
            Text,

            {
              color: "gray",
            },

            "..."
          )

        : null
    ),


    h(
      Text,
      null,
      ""
    ),


    // ===============================================
    // STATUS
    // ===============================================

    h(

      Box,

      {
        borderStyle:
          "round",

        borderColor:
          theme.statusBorder,

        paddingX: 1,

        flexDirection:
          "column",
      },


      h(

        Text,

        {
          color:
            "yellow",
        },

        statusMessage
      ),


      h(

        Text,

        {
          color:
            theme.keyHint,
        },

        "Keys: Arrows or j/k navigate | " +
        "Enter play | " +
        "Space pause/resume | " +
        "n/b next/back | " +
        "g/G top/bottom | " +
        "c theme | " +
        "s shuffle | " +
        "t repeat | " +
        "x stop | " +
        "? help | " +
        "q quit"
      )
    ),


    h(
      Text,
      null,
      ""
    ),


    // ===============================================
    // ACTIVITY
    // ===============================================

    h(

      Box,

      {
        borderStyle:
          "round",

        borderColor:
          "green",

        paddingX: 1,

        flexDirection:
          "column",
      },


      h(

        Text,

        {
          bold: true,

          color:
            "green",
        },

        "Live Activity"
      ),


      ...activityFeed.map(
        (entry, idx) =>

          h(

            Text,

            {
              key:
                `${idx}-${entry}`,

              color:
                idx === 0
                  ? "white"
                  : "gray",
            },

            `${
              idx === 0
                ? ">"
                : "-"
            } ${entry}`
          )
      )
    ),


    // ===============================================
    // HELP
    // ===============================================

    showHelp

      ? h(

          Box,

          {
            marginTop: 1,

            borderStyle:
              "round",

            borderColor:
              theme.helpBorder,

            paddingX: 1,

            flexDirection:
              "column",
          },


          h(

            Text,

            {
              bold: true,

              color:
                theme.helpBorder,
            },

            "Help"
          ),


          h(
            Text,

            {
              color: "white",
            },

            "Use Up/Down or j/k to move through songs."
          ),


          h(
            Text,

            {
              color: "white",
            },

            "Press Enter to play the selected song."
          ),


          h(
            Text,

            {
              color: "white",
            },

            "Use Left/Right or b/n for previous/next playback."
          ),


          h(
            Text,

            {
              color: "white",
            },

            "Press Space to pause or resume."
          ),


          h(
            Text,

            {
              color: "white",
            },

            "Press ? again to close this help box."
          )
        )

      : null
  );
};


// ==================================================
// BOOTSTRAP
// ==================================================

const Bootstrap = () => {

  const [
    state,
    setState,
  ] = useState({

    loading: true,

    tracks: [],

    error: null,

  });


  useEffect(() => {

    let mounted = true;


    loadTracks()

      .then(
        (tracks) => {

          if (mounted) {

            setState({

              loading:
                false,

              tracks,

              error:
                null,

            });
          }
        }
      )

      .catch(
        (error) => {

          if (mounted) {

            setState({

              loading:
                false,

              tracks:
                [],

              error:
                error.message,

            });
          }
        }
      );


    return () => {

      mounted = false;

    };

  }, []);


  // -----------------------------------------------
  // LOADING
  // -----------------------------------------------

  if (
    state.loading
  ) {

    return h(

      Box,

      {
        paddingX: 1,
      },


      h(

        Text,

        {
          color:
            "cyan",
        },

        `Scanning songs in ${SONGS_DIR} ...`
      )
    );
  }


  // -----------------------------------------------
  // ERROR
  // -----------------------------------------------

  if (
    state.error
  ) {

    return h(

      Box,

      {
        flexDirection:
          "column",

        paddingX: 1,
      },


      h(

        Text,

        {
          color:
            "red",

          bold:
            true,
        },

        "Unable to start player"
      ),


      h(
        Text,
        null,
        state.error
      )
    );
  }


  return h(
    App,
    {
      tracks:
        state.tracks,
    }
  );
};


// ==================================================
// START APPLICATION
// ==================================================

render(
  h(Bootstrap)
);