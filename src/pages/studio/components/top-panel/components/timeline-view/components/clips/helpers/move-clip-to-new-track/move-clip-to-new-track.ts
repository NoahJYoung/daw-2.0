import {
  audioBufferCache,
  AudioClip,
  Mixer,
} from "@/pages/studio/audio-engine/components";
import { Clip } from "@/pages/studio/audio-engine/components/types";
import { waveformCache } from "@/pages/studio/audio-engine/components/waveform-cache";
import { UndoManager } from "mobx-keystone";

export const moveClipToNewTrack = (
  oldClip: Clip,
  mixer: Mixer,
  undoManager: UndoManager,
  oldTrackIndex: number,
  newTrackIndex: number
) => {
  if (
    oldTrackIndex !== newTrackIndex &&
    newTrackIndex >= 0 &&
    newTrackIndex < mixer.tracks.length
  ) {
    undoManager.withGroup("MOVE CLIP TO NEW TRACK", () => {
      if (oldClip.type === "audio") {
        const newTrackId = mixer.tracks[newTrackIndex].id;
        const newClip = new AudioClip({
          start: oldClip.start,
          type: "audio",
          fadeInSamples: oldClip.fadeInSamples,
          fadeOutSamples: oldClip.fadeOutSamples,
          trackId: newTrackId,
          loopSamples: oldClip.loopSamples,
        });

        audioBufferCache.copy(oldClip.id, newClip.id);
        newClip.setBuffer(oldClip.buffer!);
        waveformCache.copy(oldClip.id, newClip.id);
        mixer.tracks[oldTrackIndex].deleteClip(oldClip);
        mixer.tracks[newTrackIndex].createAudioClip(newClip);
      }
    });
  }
};
