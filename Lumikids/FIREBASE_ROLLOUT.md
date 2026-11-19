# Firebase compatibility and offline sessions

## Student login and data paths

Students enter their registered name and classroom code. The app reads the classroom from Firestore, matches the roster's normalized preferred name, then loads the existing root student record by ID. Older root-only records use an exact-name query scoped to the selected classroom. Current roster records require their roster entry. Student sign-in creates no Firebase Auth account and uses no custom claims.

Teacher accounts still use Firebase Authentication. The teacher service creates `teachers/{uid}`, `classes/{code}`, and matching roster and root student documents. The dashboard scopes reads by the classroom's existing `teacherId`. Worksheet history lives at `students/{studentId}/worksheetResults/{instanceId}`.

## Proposed teacher rules and deployment constraint

The checked-in rule proposal restricts direct reads and writes to authenticated, assigned teachers. **The proposal on its own blocks the existing student's direct Firestore lookups and synchronization.** The current app keeps the original student Firestore access path and relies on the project's existing permissions. The deployed rules and production documents were outside this verification.

Firestore rules evaluate the authenticated request and document fields. A remember-me value stored on a device cannot give the server a student identity. Publishing teacher-only rules alongside the current direct student client would require a trusted student access path that verifies enrollment server-side and scopes reads and writes to the selected record. That boundary can retain the same name-and-code interface. Keep the rule proposal undeployed until student access is covered and tested. [Firestore guidance on rules and queries](https://firebase.google.com/docs/firestore/security/rules-query)

### Teacher rule emulator matrix

| Actor | Operation | Expected |
| --- | --- | --- |
| Signed-out user, including a local student session | Read a class, roster, student progress or worksheet by path or query | Deny |
| Teacher A | Create a class and paired student entries, then list classes and rosters filtered to A | Allow |
| Teacher A | Read Teacher B's roster or student, write B's progress, or finalize B's worksheet | Deny |
| Teacher A | Change student or class ownership through a progress write | Deny |
| Assigned teacher | Update matching root and roster progress and advance the root profile revision in one commit | Allow |
| Assigned teacher | Update progress on one document so the two copies disagree | Deny |
| Assigned teacher | Publish a captured worksheet with the teacher's UID, then read the finalized result on retry | Allow |
| Any direct client | Change a finalized worksheet or switch its worksheet identity | Deny |

Teacher enrollment and dashboard queries use the current document fields. When testing or preparing to deploy, verify that root and roster records agree on student ID, classroom code, and the assigned teacher's Auth UID. When changing a wallet or equipment through a trusted administration tool, advance `profileRevision`, retain `profileReceipts`, and update the root and roster together.

## Offline session behavior

Fresh sign-in and account switching require an online lookup. A remembered session can reopen the same locally saved student for up to 30 days after verification. A surviving session from an older build is eligible for a one-day transition period when its student record exists locally. The next successful online check upgrades it to the current format. The saved session contains the student ID, class, and expiry in app-private storage. Logout clears that session and leaves the student's SQLite records and queued changes available for the next valid login.

The app checks restored enrollment before sending queued student work and rechecks it during online use. A missing classroom, roster entry for a roster-based account, missing student profile, or denied access invalidates the session when verified online. During an outage, changes to enrollment cannot be detected until connectivity returns or the saved session expires.

The existing SQLite migration retains student profiles, progress, owned mascots, worksheets, and queued changes. Signed coin spending, awards, and account-specific sync receipts still apply. If two devices spend their separate offline balances on different items, preserving both debits can yield a negative combined balance.

Teachers open the assigned student from their roster before reviewing a saved worksheet. The reviewing teacher must be signed in to publish a new final result from the app. A finalized result uploads before its dependent progress snapshot. Local capture and paper review remain available using the original worksheet workflow.
