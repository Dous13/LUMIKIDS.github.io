# Physical worksheet integration report

Workspace: `F:\Aldous\LUMIKIDS.github.io\Lumikids`

## Findings and changes

The three-question limit came from `QUESTIONS_PER_WORKSHEET = 3` and slicing in the generator. Reading's digital quiz has only four randomized questions, so raising the constant alone would fail. The camera analyzer independently contained three prototype bubble rows that did not match the printed HTML. Math sheets did not supply bubble-layout metadata. The capture screen displayed experimental detections but had no persisted worksheet identity, correction flow, saved result, or progression integration. There was no existing worksheet-specific teacher review flow to preserve.

Reading now generates five stable, distinct, lesson-specific questions covering letter recognition, vocabulary, picture association, lowercase matching and picture-to-word matching. This leaves digital Reading quizzes unchanged. All five Math levels use five questions from their existing level-specific curriculum. The compatibility `createMathWorksheet` export also requires exactly five distinct questions. Each question retains its corresponding correct answer. Invalid counts, duplicate IDs and unrelated custom Math question IDs are rejected.

Writing remains a tracing/writing worksheet, with five manual-review activities: uppercase, lowercase, word tracing, independent letter writing, and independent word writing. Its five expected targets are saved in its tracing metadata. It does not masquerade as a bubble quiz or automatic handwriting recognition. The existing Writing subject ID and uppercase/lowercase/word metadata are retained.

These changes cover the existing Reading, Math and Writing worksheet generators. Science and social-skills names occur in a type declaration but have no existing generator or screen flow; no new curriculum was invented. The existing ages 3–5 metadata and difficulty 1 are retained. No age-category or difficulty selector existed in this checkout. Learning levels still come from the selected lesson.

## Print and scanner contract

`worksheetLayout.ts` defines the shared A4 dimensions, five card positions, bubble centers/radii, alignment squares and identity-code cells. HTML uses those same measurements; the scanner projects from those same physical coordinates into the captured image. Card outlines do not shift the coordinate origin. Five 35 mm cards end at 259 mm; the footer starts at 264 mm. Bubble interiors are sampled separately from printed ring outlines. The worksheet template ID remains visible, with an additional unique copy ID and template version.

Four black alignment squares and a 192-bit local identity code were added because the prototype printed no machine-readable worksheet identity or page-alignment markers. The code binds the saved copy to its student, subject, lesson, questions/expected answers, age metadata and layout version. It includes a checksum; it is not an authentication signature or a QR code. Map-key ordering is canonicalized so cloud serialization cannot change a copy's identity. The separate learning-card QR scanner is unchanged.

The existing local JPEG analyzer now detects square components, estimates a four-point projective mapping, samples normalized page regions, and requires all page corners to remain in the photo. It rejects missing/cropped markers, unclear or mismatched identity, small images, dark/washed-out images, low edge sharpness and heavily shadowed answer regions. Background-relative darkness and separation thresholds distinguish blank, ambiguous, multiple-mark and recognized responses across all five questions. Handwriting is reviewed manually. Unsupported/damaged/old prototype pages must be reprinted with version 2 markers; they are not graded using guessed coordinates.

Camera capture waits for readiness, requests oriented JPEGs, selects a supported moderate resolution when available, prevents repeated simultaneous captures, handles mount errors, and unmounts the camera when unfocused or backgrounded. Analysis buffers are bounded. Accepted photos are copied to app document storage before saving the capture record.

## Review, persistence and synchronization

Each issued copy and its exact question ordering are saved before printing. Reopening the preview reuses a saved copy; users can select older copies or explicitly create a new one. Generation and scanning require no network.

Two additive SQLite tables store worksheet records and cached worksheet-review access. No student rows, old templates, progress records or database tables are deleted/reset. Captures, review drafts and final results remain separate. A capture cannot award progress. All five answers—including blanks—must be confirmed by a reviewing teacher. The corrected answers determine the final score. Draft corrections survive restart.

The teacher portal caches worksheet-review access only after its existing student document identifies the signed-in teacher as the student's teacher. The review screen verifies the current teacher session and cached student access before changing or finalizing answers. Students can view their own history without finalization rights. Teachers access the same review screen through the existing student detail page. A teacher must first open the student's roster entry on the device before offline review. The student must also have a local account/progress record before finalization; otherwise the screen reports an error instead of inventing or replacing a student record.

Finalization, progression, rewards and queue insertion use one SQLite transaction. Reading and Math use the unchanged shared quiz rule evaluator. Writing requires all five activities to be manually marked complete, preserving its all-required-work completion restriction. Existing completion checks prevent repeat rewards across both repeat finalization and newly issued worksheet attempts. The Math completion function has an optional enclosing-transaction mode so worksheet finalization does not nest SQLite transactions; digital Math retains its default transaction behavior.

Worksheet upload jobs use stable student/copy document paths under `students/{studentId}/worksheetResults/{instanceId}`. Retry writes do not create new result IDs. Finalized uploads use a Firestore transaction to prevent overwriting a different finalized result. Conflicts retain the local result and pending job for manual resolution. An interrupted progress upload keeps the worksheet job pending as well. Existing student-progress synchronization remains responsible for cloud/local progress merging. Restoring worksheet history never replaces an already finalized local result or existing local correction draft. Draft uploads omit finalized fields instead of clearing them.

Only metadata, detections and finalized answers/results are synchronized. Photo files stay on the capture device. A teacher on another device must inspect the original printed page; the app explicitly identifies an unavailable local photo.

## Executed verification

Final commands:

```powershell
npx.cmd tsc --noEmit
node --enable-source-maps --experimental-strip-types --test tests/activity-regressions.test.cjs tests/worksheets.test.cjs src/services/writing/tracingValidator.test.mjs
git diff --check
```

- TypeScript: passed, zero errors. The preceding Math/Writing bug fixes remain present; no Skia errors returned.
- Combined automated tests: **78 passed, 0 failed, 0 skipped**: 10 new worksheet/scanner tests, 7 preceding activity regressions, and 61 tracing regressions.
- Whitespace check: passed.
- Final source diff reviewed for unrelated changes. No dependencies, manifests, authentication implementation, Firestore security rules or unrelated visual styles were changed.

New tests check all 26 Reading, 5 Math and 26 Writing levels; five corresponding answers/targets; distinct questions; static A4 bounds; filled/cross-mark recognition; blank, partial, faint and multiple marks; slight rotation and perspective changes; missing/cropped markers; blur, dark/overexposed images; wrong copy/student/lesson/version; camera/review handlers; persisted corrections; SQLite close/reopen; account isolation; rollback on result-write failure; replay rewards; stale restoration; queued reconnect; interrupted result/progress upload; stable map ordering; and conflicting finalized uploads.

Image tests use deterministic synthetic, JPEG-compressed camera-like rasters with uneven lighting, printed-style rings/text strokes and irregular marks. SQLite tests use the real local SQL implementation through Node SQLite. Component handlers run in a hook harness. Camera, file-copy and Firebase boundaries are simulated. No prior worksheet/scanner test files were present.

## Verification limits and manual checks

- No physical worksheet was printed, no actual camera image was captured, and no emulator/native app build was run. The generated HTML and static geometry were checked; native PDF pagination, font/emoji metrics and physical printed positions were not visually rendered or measured.
- Print each subject on A4 at 100%, with print scaling/headers disabled. Check all five regions, name/identity areas, bottom margin, guides, answer-label wrapping and emoji availability on both Android and iOS print engines.
- Calibrate marker, blur, brightness, faint-mark and separation thresholds against real pencil/pen marks, erasures, shadows, glare, phone cameras and reasonable capture distances. Current thresholds have synthetic evidence only; failed captures must be retaken.
- Check real camera orientation, permission denial/recovery, focus, background/resume, supported picture sizes and memory/latency on target devices. Recognition remains synchronous local image processing.
- Exercise student capture → teacher sign-in/roster access → corrections → finalization, including offline restart. On another device, verify original-paper review and local student-record requirements.
- No live Firebase or Firebase emulator verification was performed. Confirm existing security rules permit the new worksheet-result subcollection reads, writes and transactions for the intended student/teacher roles before relying on cloud history. Rules and production data were not modified.
- Confirm real connectivity loss/reconnect and process termination during each upload stage. Conflicting finalized copies are preserved as pending jobs and require manual resolution; there is no conflict-resolution editor in this change.
- Old three-question prototype sheets lack the required identity/alignment code and are deliberately rejected. Reprint a newly issued copy for scanning. Stored student progress is retained.

## Exact files changed for this request

Paths below are relative to the workspace above. The first eleven are modified existing files; the next seven are new implementation/test files; this report is the nineteenth file.

1. `src/data/phygitalWorksheets.ts`
2. `src/navigation/AppNavigator.tsx`
3. `src/screens/phygital/WorksheetCaptureScreen.tsx`
4. `src/screens/phygital/WorksheetPreviewScreen.tsx`
5. `src/screens/teacher/TeacherStudentScreen.tsx`
6. `src/services/database/database.ts`
7. `src/services/database/localMath.ts` — adds enclosing-transaction support to the existing pending Math fix.
8. `src/services/phygital/worksheetAnalyzer.ts`
9. `src/services/phygital/worksheetTypes.ts`
10. `src/services/sync/processQueue.ts`
11. `src/types/navigation.ts`
12. `src/screens/phygital/WorksheetReviewScreen.tsx`
13. `src/services/phygital/worksheetLayout.ts`
14. `src/services/phygital/worksheetPrint.ts`
15. `src/services/phygital/worksheetStore.ts`
16. `src/services/sync/syncWorksheet.ts`
17. `tests/worksheet-fixtures.cjs`
18. `tests/worksheets.test.cjs`
19. `WORKSHEET_IMPROVEMENTS.md`

The pre-existing pending changes in `TracingCanvas.tsx`, `MathQuizScreen.tsx`, `restoreStudentProgress.ts`, `tests/activity-regressions.test.cjs`, and `tests/runtime.cjs` were preserved and not edited for this request. No commit, push, deployment, package installation or production-data operation was performed.
