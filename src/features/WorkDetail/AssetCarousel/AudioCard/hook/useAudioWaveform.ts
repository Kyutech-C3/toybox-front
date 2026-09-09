import { useEffect, useState } from "react";

type UseAudioWaveformParams = {
  src: string;
  barCount: number;
  isEnabled: boolean;
};

type UseAudioWaveformReturn = {
  peaks: number[];
  playbackURL?: string;
  isLoadError: boolean;
};

const useAudioWaveform = ({
  src,
  barCount,
  isEnabled,
}: UseAudioWaveformParams): UseAudioWaveformReturn => {
  const [peaks, setPeaks] = useState<number[]>([]);
  const [playbackURL, setPlaybackURL] = useState<string>();
  const [isLoadError, setIsLoadError] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;

    let isActive = true;
    let objectURL: string | undefined;
    const controller = new AbortController();
    setPeaks([]);
    setPlaybackURL(undefined);
    setIsLoadError(false);

    const buildWaveform = async () => {
      const response = await fetch(src, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Failed to load audio: ${response.status}`);
      }

      const blob = await response.blob();
      if (!isActive) return;

      objectURL = URL.createObjectURL(blob);
      setPlaybackURL(objectURL);

      const audioContext = new AudioContext();
      try {
        const audioBuffer = await audioContext.decodeAudioData(
          await blob.arrayBuffer(),
        );
        if (!isActive) return;

        const samples = audioBuffer.getChannelData(0);
        const blockSize = Math.floor(samples.length / barCount) || 1;
        const nextPeaks = Array.from({ length: barCount }, (_, index) => {
          let peak = 0;
          const start = index * blockSize;
          for (let offset = 0; offset < blockSize; offset += 1) {
            peak = Math.max(peak, Math.abs(samples[start + offset] ?? 0));
          }
          return peak;
        });

        const maxPeak = Math.max(...nextPeaks, 0.0001);
        setPeaks(nextPeaks.map((peak) => peak / maxPeak));
      } finally {
        void audioContext.close();
      }
    };

    buildWaveform().catch(() => {
      if (!isActive || controller.signal.aborted) return;

      setPeaks([]);
      if (!objectURL) setIsLoadError(true);
    });

    return () => {
      isActive = false;
      controller.abort();
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
  }, [src, barCount, isEnabled]);

  return { peaks, playbackURL, isLoadError };
};

export default useAudioWaveform;
