# Background music experiment (paused)

Archived November 9, 2026. The daily and practice pages were restored to their
pre-music state at commit `00e3faa` (database integration). No game history,
database records, sound effects, or preferences were reset. No music dependencies
were added. These files are reference material, not active application code.

## Saved work

- `composition/after-hours.strudel.js`: the latest editable Strudel composition.
- `composition/after-hours.wav`: the user's shorter exported recording.
- `composition/README.md`: original working notes, retained as a historical snapshot.
  Its references to app paths, enable flags, and testing status describe the
  experiment at the time; they are not current setup instructions.
- `public-assets/`: the former public WAV and sample-credit page, preserved intact.
- `music-button.tsx.txt` and `music.css.txt`: draft shared music control, stored as
  text so it is neither compiled nor included in app styles.

## What we learned

Offline composition and rendering in Strudel lets Jacklet use an ordinary audio
file without shipping the Strudel engine. The preferred experience was an
independent music button beside the effects button, off by default, with a saved
preference. The draft loaded audio on demand, paused when the tab was hidden,
and released it when leaving the page. Browser autoplay restrictions still mean
a saved on preference may need a user gesture before playback.

The first composition approach was unnecessarily complex. The simplified version
uses direct mini-notation strings and three piano layers: chords, bass, and melody.
It was evaluated on the Strudel website. At `setcpm(20)`, eight cycles last 24
seconds; exporting cycles 0–24 is three repeats, not a required loop length.
The user supplied a shorter export. The recorded inspection measured 24 seconds,
48 kHz stereo, 16-bit PCM, approximately 4.6 MB, with no clipping detected.

A repeating composition does not guarantee a seamless recording: piano releases
and reverb can make the join audible. The exported boundary and in-game playback
were not fully auditioned. Rendering extra repeats and extracting a middle repeat
is one optional way to preserve the ambience across the join. Keep the precise
musical duration rather than appending silence. Browser delivery size and gapless
looping also need checking before release.

## Licensing research to revisit before release

The working approach was to render audio offline rather than embed the AGPL
Strudel runtime. Engine licensing and output licensing are separate questions;
composition and sample rights still matter. These are recorded research findings,
not a new license grant for this repository.

The inspiration was Felix Roos's “Festival of fingers” (CC BY-NC-SA 4.0). The
After Hours draft was written as a new arrangement, not a transposition of that
reference. Preserve that distinction when revising it. The default piano mapping
was documented as Salamander Grand Piano V3 by Alexander Holm, CC BY 3.0;
confirm the samples actually used and retain attribution with any published audio.

- [Strudel project guidance](https://strudel.cc/technical-manual/project-start/)
- [AGPL-3.0 text](https://opensource.org/license/agpl-3.0)
- [Reference composition license](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- [Piano sample mapping](https://github.com/felixroos/dough-samples#piano)
- [Sample collection](https://archive.org/details/SalamanderGrandPianoV3)
- [Sample license](https://creativecommons.org/licenses/by/3.0/)
- [Strudel export help](https://strudel.cc/learn/faq/#how-to-record-or-export-audio)

## If we return to music

1. Audition this recording and its repeat boundary before changing the composition.
2. Confirm sample provenance and choose a delivery format after testing looping.
3. Review the archived control before reusing it; restore assets and imports
   deliberately, rather than treating the draft as production-ready.
4. Test daily and practice playback, mobile header spacing, saved preferences,
   hidden tabs, navigation, failed audio loading, and independent effects muting.
5. Update public credits and current documentation, then run the usual checks.

Existing game effects remain the active audio experience. No Strudel runtime,
music toggle, or public music asset remains in the restored game.
