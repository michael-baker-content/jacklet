// Jacklet - After Hours
setcpm(20)
const chords = "<Dm7 G7 C^7 A7 Dm7 Bb^7 Em7b5 A7>";
stack(
  chord(chords).dict('lefthand').voicing()
    .struct("~ x ~ x ~ ~ x ~").gain(.25),
  chords.rootNotes(2).note()
    .struct("x ~ ~ x ~ ~ x ~").gain(.35),
  note("<[a4 ~ c5 e5 ~ d5 ~ a4] [b4 ~ a4 ~ g4 e4 ~ ~] [g4 ~ b4 d5 ~ e5 ~ d5] [c#5 ~ bb4 a4 ~ g4 ~ ~] [f4 a4 ~ c5 ~ a4 e5 ~] [d5 ~ c5 ~ a4 f4 ~ ~] [g4 ~ bb4 d5 ~ e5 d5 ~] [c#5 ~ b4 a4 ~ e4 ~ c#5]>")
    .gain(.3)
).piano().room(.12)
