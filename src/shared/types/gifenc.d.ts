declare module "gifenc" {
  export type GifPalette = [number, number, number][];

  /** @apiContract gifenc の公開API */
  export type GifEncoder = {
    writeFrame: (
      pixels: Uint8Array,
      width: number,
      height: number,
      options: {
        palette: GifPalette;
        delay: number;
        repeat: number;
        dispose: number;
        transparent: boolean;
        transparentIndex: number;
      },
    ) => void;
    finish: () => void;
    bytes: () => Uint8Array<ArrayBuffer>;
  };

  export function GIFEncoder(): GifEncoder;
  export function quantize(
    pixels: Uint8ClampedArray,
    maxColors: number,
  ): GifPalette;
  export function applyPalette(
    pixels: Uint8ClampedArray,
    palette: GifPalette,
  ): Uint8Array;
}
