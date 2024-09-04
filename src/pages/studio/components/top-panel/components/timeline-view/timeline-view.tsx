import { observer } from "mobx-react-lite";
import { Grid, Playhead, TopBar } from "./components";
import { useAudioEngine, useRequestAnimationFrame } from "@/pages/studio/hooks";
import { useMemo, useCallback } from "react";
import * as Tone from "tone";
import {
  findSmallestSubdivision,
  subdivisionToQuarterMap,
} from "./helpers/calculate-grid-lines/calculate-grid-lines";
import { AudioEngineState } from "@/pages/studio/audio-engine/types";

interface TimelineViewProps {
  scrollRef: React.RefObject<HTMLDivElement>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const TimelineView = observer(
  ({ onScroll, scrollRef }: TimelineViewProps) => {
    const audioEngine = useAudioEngine();
    const { timeline, mixer } = audioEngine;
    const { pixels, measures, timeSignature } = timeline;

    const measureWidth = useMemo(() => pixels / measures, [pixels, measures]);

    const smallestSubdivision = useMemo(
      () => findSmallestSubdivision(timeline),
      [timeline, timeline.samplesPerPixel]
    );

    const subdivisionsPerBeat = useMemo(
      () => subdivisionToQuarterMap[smallestSubdivision],
      [smallestSubdivision, timeline.samplesPerPixel]
    );

    const subdivisionsPerMeasure = useMemo(
      () => subdivisionsPerBeat * timeSignature,
      [subdivisionsPerBeat, timeSignature, timeline.samplesPerPixel]
    );

    const subdivisionWidth = useMemo(
      () =>
        timeline.samplesToPixels(Tone.Time(smallestSubdivision).toSamples()),
      [timeline, smallestSubdivision, timeline.samplesPerPixel]
    );

    const generateArray = useCallback(
      (length: number) => Array.from({ length }, (_, i) => i),
      []
    );

    // Memoized measure and subdivision arrays
    const measuresArray = useMemo(
      () => generateArray(measures),
      [generateArray, measures, timeline.samplesPerPixel]
    );

    const subdivisionsArray = useMemo(
      () => generateArray(subdivisionsPerMeasure),
      [generateArray, subdivisionsPerMeasure, timeline.samplesPerPixel]
    );

    const beatWidth = useMemo(
      () => timeline.samplesToPixels(Tone.Time("4n").toSamples()),
      [timeline, timeline.samplesPerPixel]
    );

    const renderEveryFourthMeasure = beatWidth * timeSignature < 40;

    const handleClick = (e: React.MouseEvent) => {
      if (scrollRef.current) {
        const xOffset = scrollRef.current.getBoundingClientRect().x;
        const xValue = e.clientX - xOffset + scrollRef.current.scrollLeft;
        timeline.setSecondsFromPixels(xValue);
      }
    };

    useRequestAnimationFrame(
      () => {
        timeline.setSeconds(Tone.getTransport().seconds);
      },
      {
        enabled: audioEngine.state === AudioEngineState.playing,
      }
    );

    const playheadLeft = timeline.positionInPixels;

    return (
      <div
        onClick={handleClick}
        onScroll={onScroll}
        ref={scrollRef}
        style={{ width: pixels }}
        className="h-full bg-surface-0 z-10 overflow-auto relative"
      >
        <TopBar
          renderEveryFourthMeasure={renderEveryFourthMeasure}
          subdivisionsArray={subdivisionsArray}
          measuresArray={measuresArray}
          measureWidth={measureWidth}
          subdivisionWidth={subdivisionWidth}
          subdivisionsPerBeat={subdivisionsPerBeat}
        />

        <Grid
          subdivisionWidth={subdivisionWidth}
          subdivisionsArray={subdivisionsArray}
          renderEveryFourthMeasure={renderEveryFourthMeasure}
          measureWidth={measureWidth}
          measuresArray={measuresArray}
        />

        <Playhead height={mixer.topPanelHeight + 72} left={playheadLeft} />
      </div>
    );
  }
);
