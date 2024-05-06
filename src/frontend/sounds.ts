let ctx: AudioContext | undefined;

export function prepareAudio(url: string): () => void {
  const buffer = fetch(url).then((res) => res.arrayBuffer());

  let audioBuffer: AudioBuffer | undefined;

  return async () => {
    if (ctx == null) {
      ctx = new AudioContext();
    }
    if (audioBuffer == null) {
      audioBuffer = await ctx.decodeAudioData(await buffer);
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
  };
}

export const playTileSound = prepareAudio("./assets/sounds/tile.mp3");

export const playPopSound = prepareAudio("./assets/sounds/pop.mp3");
