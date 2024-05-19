import { LazyCell } from "../shared/utils.ts";

const audioContext = new LazyCell(async () => new AudioContext());

export function prepareAudio(url: string): () => void {
  const buffer = fetch(url).then((res) => res.arrayBuffer());
  const audioBuffer = audioContext
    .get(false)
    .then((ctx) => buffer.then((buffer) => ctx.decodeAudioData(buffer)));

  let blocked = false;

  return async () => {
    // Deduplicate calls
    if (blocked) return;
    blocked = true;
    setTimeout(() => (blocked = false));

    const ctx = await audioContext.get();
    const source = ctx.createBufferSource();
    source.buffer = await audioBuffer;
    source.connect(ctx.destination);
    source.start();
  };
}

export const playPlaceSound = prepareAudio("./assets/sounds/place.mp3");

export const playDiceSound = prepareAudio("./assets/sounds/dice.mp3");

export const playShuffleSound = prepareAudio("./assets/sounds/shuffle.mp3");

export const playPopSound = prepareAudio("./assets/sounds/pop.mp3");

export const playCoinSound = prepareAudio("./assets/sounds/coin.mp3");

export const playClackSound = prepareAudio("./assets/sounds/clack.mp3");
