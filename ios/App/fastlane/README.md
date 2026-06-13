# NutriQ — iOS build & submit with Fastlane

One command takes the web app → archived → uploaded to TestFlight or the App Store.
Everything here runs **on a Mac** (Xcode is macOS-only). On Windows these files are
just committed and ready — there's nothing to run until you're on a Mac.

## One-time setup (on the Mac, ~15 min)

1. **Install the toolchain**
   ```bash
   xcode-select --install                 # Xcode command line tools
   sudo gem install bundler               # if you don't have it
   cd ios/App
   bundle install                         # installs fastlane from the Gemfile
   ```

2. **Create an App Store Connect API key**
   - Go to https://appstoreconnect.apple.com/access/integrations/api
   - Generate a key with the **App Manager** role.
   - Download the `.p8` file (you only get one chance) and move it somewhere safe
     outside the repo, e.g. `~/.appstoreconnect/private/AuthKey_XXXX.p8`.

3. **Fill in your secrets**
   ```bash
   cp fastlane/.env.example fastlane/.env
   ```
   Edit `fastlane/.env` with the Key ID, Issuer ID, the path to the `.p8`, and your
   Team ID. This file is gitignored.

4. **Make sure the app record exists** in App Store Connect with bundle ID
   `com.nutriq.app` (that's the "Create the app record" launch task).

## Everyday commands

Run from the `ios/App` directory:

```bash
bundle exec fastlane beta       # build + upload to TestFlight
bundle exec fastlane release    # build + upload to App Store Connect (for review)
bundle exec fastlane build      # just produce output/NutriQ.ipa, no upload
```

Each lane automatically runs `npm run build && npx cap sync ios` first, so the
latest web code is always bundled — you don't sync manually.

## What each lane does

| Lane      | Steps |
|-----------|-------|
| `sync_web`| `vite build` + `cap sync ios` (called by the others) |
| `build`   | sync → archive → export a signed `app-store` `.ipa` |
| `beta`    | sync → bump build number → archive → upload to TestFlight |
| `release` | `build` → upload binary + metadata to App Store Connect |

`release` uses `submit_for_review: false` so it uploads but doesn't auto-submit —
flip that to `true` in the Fastfile once your screenshots and metadata are final.

## Signing

Lanes use **automatic signing** with your `ASC_TEAM_ID` and pass
`-allowProvisioningUpdates`, so Xcode creates/refreshes the provisioning profile
on first run. No manual certificate juggling.

If you later want reproducible CI signing across machines, switch to
[`match`](https://docs.fastlane.tools/actions/match/) — but automatic signing is
the right call for a solo first launch.

## Troubleshooting

- **"No profiles found"** → open `App.xcodeproj` in Xcode once, select the App
  target → Signing & Capabilities → check "Automatically manage signing" and pick
  your team. Then retry the lane.
- **"Authentication credentials are missing"** → check the four `ASC_*` values in
  `fastlane/.env` and that `ASC_KEY_PATH` points at the real `.p8` file.
- **Build number already used** → the `beta` lane handles this automatically; for
  `release` bump `MARKETING_VERSION` in Xcode for a new public version.
