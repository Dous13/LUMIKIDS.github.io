# Firebase security rollout

## Local verification

Put an up-to-date Node.js 22 release on `PATH` and confirm it with `node --version`. Run `npm ci` in the app directory and `npm --prefix backend/functions ci --engine-strict` for Functions. Keep `JAVA_HOME` set to a Firebase CLI-compatible JDK. The Functions deployment target is Node 22. The Functions manifest pins the Admin SDK's database compatibility dependency to a version that supports Node 22. The rules test library is pinned by the app lockfile.

- `npm run test:firebase` compiles the existing curriculum for Node, starts Auth, Firestore and Functions under `demo-lumikids`, and runs the real SDK authorization tests.
- `npm run test:regressions` runs the SQLite, offline, curriculum and worksheet tests.

## Run the student demo on Windows

Start the Android Emulator in Android Studio. Run these commands from the `Lumikids` directory after installing the app and Functions dependencies. Make Node.js 22, a compatible Java installation, and the Android SDK available. The first Android debug build may need to download Gradle and Android dependencies.

1. Run `npm run demo:emulators`. Leave this terminal open after Auth, Firestore, and Functions are ready. All three listen on Windows loopback for `demo-lumikids`. The launcher prints the separate directory for this run's logs.
2. Run `npm run demo:seed` in another terminal. It creates the demo teacher, classroom, and both student enrollments and adds any missing access grants in the local emulator. You can run the seed again in the same session without resetting progress or re-enabling a disabled grant.
3. With the Android Emulator running, run `npm run demo:android`. It builds and opens a local debug app with native SQLite support and sets `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=10.0.2.2` for Expo. If Android asks for nearby-device access, tap **Allow** so the debug app can reach the Windows host. Restart the demo launcher after editing app code.
4. On **Student Login**, enter **Mira** or **Leo** and classroom code **LUMI26**. On **Teacher Login**, use `teacher@lumikids.example` and `Lumikids-Demo-482!`. These credentials are for the local demo.

If sign-in fails, check that both terminals are still running, the seed finished, and you launched the app from `npm run demo:android`. Run the seed again after starting a fresh emulator session. Keep the same session running to retain its cloud progress during the demo. A remembered student can reopen saved work offline. Sign in again with the demo emulators running to sync it.

If Ninja fails on a long path during the debug build, install CMake 3.31.6 in **Android Studio > SDK Manager > SDK Tools > Show Package Details**. The demo launcher selects that version on Windows when it finds it in the Android SDK. [Windows native build troubleshooting](https://docs.expo.dev/troubleshooting/windows-long-paths/)

## Run the standalone backend locally

The Node.js server runs the existing student login, learning sync, and worksheet callables. It uses Firebase Auth to authenticate users and Firestore to verify enrollments and save verified results. Expo SQLite still stores lessons, progress, and pending work on the device so students can continue learning offline. Worksheet photos and image processing stay on the device.

From the `Lumikids` directory, start `npm run demo:emulators` and run `npm run demo:seed` as above. In another PowerShell terminal, start the standalone server.

```powershell
$env:LUMIKIDS_BACKEND_MODE = 'emulator'
npm --prefix backend/functions start
```

Wait for the server to print that **demo-lumikids** is listening on **127.0.0.1:5002**. In another terminal, launch the Android debug app through the standalone server.

```powershell
$env:EXPO_PUBLIC_LUMIKIDS_BACKEND_URL = 'http://10.0.2.2:5002'
npm run demo:android
```

Sign in as **Mira** or **Leo** with **LUMI26** on the existing Student Login screen. For the original Functions emulator, start Expo with `EXPO_PUBLIC_LUMIKIDS_BACKEND_URL` unset. If sign-in fails with the standalone URL, check that the standalone process and both the Auth and Firestore emulators are running. Fresh sign-in requires those services. A valid remembered session can open saved work while they are down.

| Setting | Use |
| --- | --- |
| `LUMIKIDS_BACKEND_MODE` | Required for the server. Use `emulator` for local testing. Live mode requires a separately approved setup and selects `lumikids-a94d8`. |
| `LUMIKIDS_BACKEND_PORT` | Optional server port. Defaults to `5002`. Match it in the local app URL during emulator testing or in the reverse proxy for a hosted release. |
| `FIREBASE_AUTH_EMULATOR_HOST`, `FIRESTORE_EMULATOR_HOST` | Optional in emulator mode. Defaults are `127.0.0.1:9099` and `127.0.0.1:8080`. The standalone server accepts loopback endpoints only. |
| `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` | Selects demo Auth and Firestore in development. The Android demo launcher sets it to `10.0.2.2`. |
| `EXPO_PUBLIC_LUMIKIDS_BACKEND_URL` | Public app setting. Local HTTP requires a matching emulator host. An approved live build will use the server's HTTPS origin and live Firebase Auth and Firestore. |
| `LUMIKIDS_ALLOWED_ORIGINS` | Optional comma-separated exact browser origins. Leave unset for Android. For local Expo web testing, allow its actual origin, such as `http://localhost:8081`. |

Run `npm run test:standalone` for the standalone HTTP server with separate local Auth and Firestore emulators. Run `npm run test:firebase` for the Functions emulator and `npm run test:regressions` for the SQLite, offline, and curriculum tests. The standalone suite uses separate ports and logs so you can keep a demo session running.

## Prepare the standalone backend for live Android builds

Get approval before starting live mode or publishing the hostname. Use Node.js 22 and Caddy on a trusted computer you control. With an existing computer, internet connection, and public hostname, this setup has no recurring hosting or certificate fee. Domain registration may cost money. Custom Auth and Firestore remain on `lumikids-a94d8` and use the existing Spark quotas. [Firebase Spark pricing](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans) · [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https)

1. On the host, run `npm ci --include=dev`, `npm --prefix backend/functions ci --engine-strict`, and `npm run build:firebase` from `Lumikids`. Build before starting the server so the callable handlers can load the generated curriculum.
2. Use a dedicated runtime identity with Firestore data access, Firebase Auth user reads for revocation checks, and custom-token signing. Provide server-only Application Default Credentials. Keep any approved credential file outside the repository and readable only by the server account. For Google-managed signing the server identity needs `iam.serviceAccounts.signBlob` on the signer. [Application Default Credentials](https://docs.cloud.google.com/docs/authentication/application-default-credentials) · [Firebase custom-token signing](https://firebase.google.com/docs/auth/admin/create-custom-tokens)
3. Set the server variables below and start it with `npm --prefix backend/functions start`. Run Node and Caddy as services on the same machine. Keep Node on `127.0.0.1:5002` and expose only Caddy on ports `80` and `443`. Point the public hostname directly at Caddy using a DNS-only record and keep Caddy's certificate data directory persistent.

| Server variable | Hosted value |
| --- | --- |
| `LUMIKIDS_BACKEND_MODE` | `live`, which selects `lumikids-a94d8`. |
| `LUMIKIDS_BACKEND_PORT` | Optional. Defaults to `5002` on loopback. Match the proxy upstream. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Server-only file path when approved ADC is provided through a file. Omit when ADC is supplied by the host runtime. |
| `LUMIKIDS_SERVICE_ACCOUNT_ID` | Set the approved signer email for Google-managed signing on this host. Omit when the SDK signs with an approved service-account key file. |
| `LOGIN_TRUSTED_SOURCE_HEADER` | `1` after Caddy is the only public ingress and overwrites `X-Lumikids-Client-IP`. |
| `LUMIKIDS_ALLOWED_ORIGINS` | Leave unset for native Android. For a browser client, set a comma-separated list of exact HTTPS origins. |

Leave `FUNCTIONS_EMULATOR`, `FIREBASE_AUTH_EMULATOR_HOST`, `FIRESTORE_EMULATOR_HOST`, `FIREBASE_EMULATOR_HUB`, and `FIREBASE_DEBUG_FEATURES` unset. If the host supplies `GCLOUD_PROJECT` or `GOOGLE_CLOUD_PROJECT`, the value must be `lumikids-a94d8`.

Replace `backend.example.edu` with the approved hostname in this Caddy configuration. Caddy replaces the private source header with the directly connected peer's IP. This preserves the existing per-source quotas. If the host cannot accept public connections, separately configure and validate the client-IP mapping for a named tunnel before using one. [Caddy reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy) · [Cloudflare Tunnel published applications](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/)

```caddyfile
backend.example.edu {
  reverse_proxy 127.0.0.1:5002 {
    header_up X-Lumikids-Client-IP {http.request.remote.host}
    header_up -X-Lumikids-Emulator-Source
    transport http {
      dial_timeout 3s
      response_header_timeout 60s
      max_conns_per_host 32
    }
  }
}
```

After the host is approved, `GET /healthz` over HTTPS should return `200` and `ok`. This checks the Node process and HTTPS route. Validate Firebase credentials and source-IP handling separately in an approved test. If health fails, check the Node service and proxy upstream for `502`, then check DNS and certificates for connection or trust errors. Keep the request paths `/loginStudent`, `/syncStudentLearning`, and `/syncWorksheet` at the HTTPS origin root.

Set `EXPO_PUBLIC_LUMIKIDS_BACKEND_URL` to the approved origin, such as `https://backend.example.edu`, in the environment that builds the Android app. Leave `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` unset and use the normal Android build or Metro launch. Restart Metro and fully reload a development build, or rebuild a release. Install the update in place using the same app identity to preserve SQLite progress and queued operations. [Expo environment variables](https://docs.expo.dev/guides/environment-variables/)

## Identity and writes

The student enters their registered name and classroom code. `loginStudent` checks the classroom, teacher, student record, roster and access grant. It returns the existing student ID and a Firebase custom token. The identity uses UID `student:<id>` and signed student, classroom and grant-version claims. Teacher email/password registration and classroom enrollment use restricted writes. A reserved student UID cannot use teacher privileges.

Login errors use the same message for unknown names, unknown classrooms and exhausted budgets. In each five-minute window the server counts up to 120 failed attempts per source, up to 12 failures for a name slot within that source, and up to 12 token issuances per source and enrolled student. Once a name slot is full, further attempts in that slot stop using the shared failure budget. A classroom has no shared budget. Students on one school network still share the source limit, and different names can share one of the 256 slots. Unknown classroom codes all charge the source's existing failure bucket. On Spark, plan bounded administrative cleanup of expired `loginLimits` entries within the Firestore quotas. Automatic TTL deletion requires billing. [Firestore quotas](https://firebase.google.com/docs/firestore/quotas#free_quota)

The Functions emulator uses the socket peer when available and a shared loopback quota when its worker receives a request over IPC without an IP peer. Tests can select a simulated source only in the `demo-lumikids` Functions emulator with Auth and Firestore on loopback. The standalone server ignores that test header and `X-Forwarded-For`. With the trusted-ingress option enabled, a missing, repeated, or invalid source header is denied. Before rollout, verify that caller-supplied headers cannot alter quotas and that distinct sources do not fall into one proxy bucket.

Firestore grants students reads of their own root profile and worksheet history while their enrollment and grant remain valid. Teachers can read only their assigned classrooms, rosters and students. Cloud score, balance, receipt and worksheet writes go through authenticated backend callables. The server checks Auth token revocation and enrollment, validates attempts against curriculum and tracing rules, derives outcomes and prices, and atomically mirrors progress to the root and roster. Student-operation receipts are private, match the exact operation on retry, and are committed with the corresponding progress. The assigned teacher submits worksheet review choices. The server validates worksheet identity, grades the choices, and commits the result and progress together. Photos remain on the device. Trace coordinates are carried in the local outbox and examined in the callable, then discarded on acknowledgement. The cloud receipt stores a digest.

## Offline behavior and existing records

Firebase Auth stays in memory for both roles. The saved offline session contains the student ID and expiry. A cold start can reopen saved learning and worksheets without granting cloud access. Use **Sign in to sync your saved progress** on Home to reauthenticate with the same name and code. Expired or revoked cloud credentials block uploads while preserving SQLite records and pending jobs. Logout clears the local session and signs out the student from Firebase.

SQLite adds an operation payload and rejection reason to the existing journal where needed, along with a blocked flag on queue jobs. The first successful reconciliation of an older wallet uses the confirmed server balance and avatar as the base and keeps legitimate pending purchases and equipment changes. Historical scores and XP without supporting attempts remain on the device. They need a trusted migration or a new validated attempt for cloud confirmation.

An invalid operation or conflicting receipt stays in SQLite with its rejection reason. A job with only quarantined rows or historical XP parks until a new local operation, an explicit correction, or a newer confirmed cloud profile makes another check useful. Temporary connection failures keep the original operations and receipt IDs available for retry. Work waiting for funds, ownership, or a lesson unlock stays eligible. A deferred equipment receipt cannot supersede a choice the server confirmed after it. For selections first seen on different offline devices, the server can order confirmed operations and previously observed dependencies. It cannot reconstruct the real-world order of actions it has never received.

Each device's wallet checkpoint stores its highest applied equipment sequence in `sequence` and its highest applied or superseded sequence in `terminalSequence`. Old checkpoints use `sequence` as their initial terminal floor. A superseded equip can advance the terminal sequence without changing the wallet. Sync accepts the existing positive decimal journal ID format through `Number.MAX_SAFE_INTEGER` and rejects larger or malformed values before processing the batch.

Offline worksheet dates are accepted. New dates may be up to five minutes ahead of the server clock. Draft ordering uses the server revision and the revision previously seen by the submitting device. A retry with the same capture content leaves the revision unchanged. A teacher publishes a result against the exact reviewed revision. If the server has moved on, reopen the worksheet review and use **Load Latest Copy**. The older local draft, photo reference, and any provisional review remain in the local archive. Local progress from the provisional review is retained. The server awards progress only once for the finalized result.

Existing cloud copies with invalid old timestamps keep their original identity and final result. The compatibility path checks that the submitted worksheet exactly matches the stored original. If the copy was never uploaded and its device clock was incorrect, correct the clock and issue a fresh copy. Keep the old local copy available for support. Keep the app and backend on the same worksheet revision protocol.

### Recover a quarantined operation

Use an authorized offline support session and a backup of the device SQLite database. Close the app before making a consistent copy. Run `node scripts/sync-recovery.cjs inspect <database> <studentId>` with Node 22 to see the original operation ID, payload, status, failure reason, and any queued replacement. Treat the output as student data.

If you have corrected evidence for the same activity or wallet item, run `npm run build:firebase`, then `node scripts/sync-recovery.cjs stage <working-copy> <studentId> <rowId> <correction.json>`. The tool validates the new payload, keeps the original row and ID, links a new operation ID, and wakes that student's queue. Use the supported device-data restoration process to return the reviewed copy to the same device. Sync still requires the student's authenticated session. If the original operation cannot be identified or corrected, retain it for support and use the normal app workflow to record a fresh attempt or equipment choice.

The backend accepts verified root-only legacy students only when the record has a matching teacher and classroom. Its first confirmed update can create the missing roster mirror. Reconcile any older records without verifiable ownership through a trusted administrative process.

## Before any production cutover

1. Get separate approval for the host, DNS, credentials, and live test. Exercise the full Android route with synthetic data before inviting students. Confirm the restrictive rules and callable backend are in place when the replacement build goes live. Older unsigned builds cannot sync through those rules.
2. Verify records that were writable under the prior open rules against a trusted backup or enrollment source. Resolve inconsistent teacher, classroom, and roster links before offering login to affected students. Preserve verified student IDs, progress, balances, and device queues.
3. Confirm the HTTPS route, server identity, source-IP quotas, and Spark usage before opening the service to a class. A healthy process can still have a credential or enrollment problem. Approve the first live sign-in separately from live synchronization because custom-token exchange can create an Auth user and signing in may resume the device queue. [Firebase custom-token configuration](https://firebase.google.com/docs/auth/admin/create-custom-tokens) · [Firestore quotas](https://firebase.google.com/docs/firestore/quotas)
4. For immediate student cloud revocation, disable the trusted `studentAccess/{id}` grant or increment its version. Revoke Auth refresh tokens as well. A disabled grant blocks fresh name/code login. Re-enabling the account with a newer version requires a new sign-in.

A registered name and shared classroom code can let someone who knows both impersonate the student. The custom token identifies the enrollment granted by the server. Bundled quiz answers and tracing templates can be extracted and used to fabricate attempts with a modified client. Server validation rejects arbitrary scores, XP and coin totals and enforces progression and reward limits. It cannot establish whether a child personally completed the activity.
