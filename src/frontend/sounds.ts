export function prepareAudio(url: string): () => void {
  const audio = new Audio(url);
  audio.preload = "auto";

  return () => {
    audio.currentTime = 0;
    audio.play();
  };
}

export const playTileSound = prepareAudio("./assets/sounds/tile.mp3");

export const playPopSound = prepareAudio("./assets/sounds/pop.mp3");
