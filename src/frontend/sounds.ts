import { LazyCell } from "../shared/utils.ts";

const audioContext = new LazyCell(async () => new AudioContext());

function prepareSound(url: string): () => void {
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

function prepareMusic(
  url: string,
  loopStart: number = 0,
  loopEnd?: number
): { start(): void; stop(): void } {
  const buffer = fetch(url).then((res) => res.arrayBuffer());
  const audioBuffer = audioContext
    .get(false)
    .then((ctx) => buffer.then((buffer) => ctx.decodeAudioData(buffer)));

  let source: AudioBufferSourceNode | undefined;

  return {
    async start() {
      if (source != null) return;

      const ctx = await audioContext.get();
      source = ctx.createBufferSource();
      source.buffer = await audioBuffer;
      source.loopStart = loopStart;
      source.loopEnd = loopEnd ?? source.buffer.duration;
      source.loop = true;
      source.connect(ctx.destination);
      source.start();
    },
    async stop() {
      source?.stop();
      source = undefined;
    },
  };
}

export const playPlaceSound = prepareSound("./assets/sounds/place.mp3");

export const playDiceSound = prepareSound("./assets/sounds/dice.mp3");

export const playShuffleSound = prepareSound("./assets/sounds/shuffle.mp3");

export const playPopSound = prepareSound("./assets/sounds/pop.mp3");

export const playCoinSound = prepareSound("./assets/sounds/coin.mp3");

export const playClackSound = prepareSound("./assets/sounds/clack.mp3");

export const playWhooshSound = prepareSound("./assets/sounds/whoosh.mp3");

export const playStampSound = prepareSound("./assets/sounds/stamp.mp3");

export const playTurnSound = prepareSound("./assets/sounds/turn.mp3");

export const playRevealSound = prepareSound("./assets/sounds/reveal.mp3");

export const playScrollSound = prepareSound("./assets/sounds/scroll.mp3");

export const playDingSound = prepareSound("./assets/sounds/ding.mp3");

const backgroundMusic = prepareMusic("./assets/sounds/bg.mp3", 10.7567);

export const playBackgroundMusic = backgroundMusic.start;

export const stopBackgroundMusic = backgroundMusic.stop;

const fanfareMusic = prepareMusic("./assets/sounds/fanfare.mp3", 6.67002);

export const playFanfareMusic = fanfareMusic.start;

export const stopFanfareMusic = fanfareMusic.stop;
