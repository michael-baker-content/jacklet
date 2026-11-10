# Jacklet music drafts

## After Hours

`after-hours.strudel.js` is an original, AI-assisted composition draft for Jacklet:
8 bars of warm piano at 80 BPM, approximately 24 seconds per repeat. Three piano
layers provide offbeat chords, a sparse bass part, and a higher melody. An A7
turnaround returns to D minor. This revision uses direct Strudel patterns instead
of JavaScript arrays and a pattern-building helper.

The reference was Felix Roos's "Festival of fingers": layered piano, syncopation,
and a jazz character. This draft uses newly written voicings, bass, melody, and
arrangement rather than editing or transposing the reference code. It contains no
Strudel engine source. No project-wide license change is made by adding this file.

### Audition

1. Open https://strudel.cc/ and replace the editor contents with the entire file.
2. Press Play; allow the default piano samples to load.
3. Listen through at least two repeats. Evaluate the balance, whether the melody
   distracts from play, and whether the final turnaround feels natural.
4. Adjust Strudel's output volume for overall level. The melody's `.gain(.3)`
   can be reduced if it needs to sit farther behind the chords.

This is an audition draft, not an approved soundtrack. The simplified revision
was evaluated in the Strudel website; an exported loop has not yet been verified.
Strudel is not a runtime dependency of Jacklet. A shared music toggle is prepared
for daily play and practice in `app/music-button.tsx`. It remains hidden behind
`MUSIC_READY = false` until the exported WAV is available and verified.

Export status: Strudel's browser console confirmed rendering cycles 0–24 at
48 kHz. The exported 24-second WAV is now included at
`public/music/after-hours.wav` and enabled in the game. The loop boundary is
the original render boundary; listen for a clean join during manual testing.

The control has a separate versioned preference, starts off, loads audio on demand,
pauses in hidden tabs, and cleans up when leaving the page. A remembered on
preference waits for interaction after loading. Muting effects does not mute music.
Sample credits are provided at `/music/credits.html`. Playback still needs testing
after the WAV is available.

### Render a loop

One cycle is one four-beat bar. At `setcpm(20)`, 8 cycles last exactly 24 seconds.
All note/gain patterns repeat within that span; no random or indefinitely evolving
patterns are used.

Use Strudel's Export tab to render WAV. Ideally render 24 cycles (72 seconds),
then extract the middle repeat from 24.000 to 48.000 seconds in an audio editor.
This supplies a lead-in for piano releases and reverb, and avoids a cold first bar.
Keep the exact 24-second length; do not add silence or a whole-track fade. Listen
to the join repeatedly and check for a click or change in ambience. If necessary,
use a short circular crossfade that preserves the musical length. Effects and
sample releases mean a repeating score alone does not guarantee a seamless file.

Retain a WAV master; decide on the browser delivery format after checking gapless
looping. Record the Strudel version, sample source/version, export settings, and
any mastering changes alongside the approved asset. If exporting fails, Strudel's
FAQ also describes recording the browser's stereo output in an audio editor.

### Piano sample credit

The default `piano` mapping is documented by Strudel's sample repository as
**Salamander Grand Piano V3**, by **Alexander Holm**, under **CC BY 3.0**.
Keep this attribution with any recording using that sample set; confirm the actual
mapping used when exporting, since upstream defaults can change.

Suggested in-game credit when the recording is added:

> Piano samples: Salamander Grand Piano V3 by Alexander Holm, CC BY 3.0.
> Sequenced, filtered, and mixed for Jacklet's "After Hours" soundtrack.

- Sample provenance: https://github.com/felixroos/dough-samples#piano
- Original sample collection: https://archive.org/details/SalamanderGrandPianoV3
- Sample license: https://creativecommons.org/licenses/by/3.0/
- Export help: https://strudel.cc/learn/faq/#how-to-record-or-export-audio

The sample credit is distinct from the composition's authorship. This draft does
not claim Felix Roos wrote or endorsed it, and does not copy the reference's
CC BY-NC-SA license onto this newly written pattern.
