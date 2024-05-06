export function prepareAudio(url: string): () => void {
  let audioContext: AudioContext | undefined;
  const audio = new Audio(url);

  return () => {
    if (!audioContext) {
      audioContext = new AudioContext();
      audioContext
        .createMediaElementSource(audio)
        .connect(audioContext.destination);
    }

    audio.pause();
    audio.currentTime = 0;
    audio.play();
  };
}

export const playTileSound = prepareAudio("./assets/sounds/tile.mp3");

export const playPopSound = prepareAudio("./assets/sounds/pop.mp3");
