import { useEffect, useState } from "react";

type UseAudioWaveformParams = {
  src: string;
  barCount: number;
};

type UseAudioWaveformReturn = {
  peaks: number[];
};

const useAudioWaveform = ({
  src,
  barCount,
}: UseAudioWaveformParams): UseAudioWaveformReturn => {
  const [peaks, setPeaks] = useState<number[]>([]);

  useEffect(() => {
    let isActive = true;
    setPeaks([]);

    const buildWaveform = async () => {
      const response = await fetch(src);
      if (!response.ok) return;

      const buffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      try {
        const audioBuffer = await audioContext.decodeAudioData(buffer);
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
      if (isActive) setPeaks([]);
    });

    return () => {
      isActive = false;
    };
  }, [src, barCount]);

  return { peaks };
};

export default useAudioWaveform;
