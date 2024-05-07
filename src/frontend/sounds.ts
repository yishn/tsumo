let ctx: AudioContext | undefined;

export function prepareAudio(url: string): () => void {
  const buffer = fetch(url).then((res) => res.arrayBuffer());

  let audioBuffer: Promise<AudioBuffer> | undefined;
  let blocked = false;

  return async () => {
    if (ctx == null) {
      ctx = new AudioContext();
    }
    if (audioBuffer == null) {
      audioBuffer = buffer.then((buffer) => ctx!.decodeAudioData(buffer));
    }

    // Deduplicate calls
    if (blocked) return;
    blocked = true;
    setTimeout(() => (blocked = false));

    const source = ctx.createBufferSource();
    source.buffer = await audioBuffer;
    source.connect(ctx.destination);
    source.start();
  };
}

export const playTileSound = prepareAudio("./assets/sounds/tile.mp3");

export const playPopSound = prepareAudio("./assets/sounds/pop.mp3");
