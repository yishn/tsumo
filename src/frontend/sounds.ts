import "howler";

export function prepareAudio(url: string): () => void {
  const sound = new Howl({
    src: [url],
  });

  return () => {
    sound.play();
  };
}

export const playTileSound = prepareAudio("./assets/sounds/tile.mp3");

export const playPopSound = prepareAudio("./assets/sounds/pop.mp3");
