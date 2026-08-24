# TinyFingers

TinyFingers is a fast fullscreen keyboard, pointer, and touch toy for toddlers, built with Astro and the Canvas API. It can be deployed as a Progressive Web App or packaged as an offline native tablet app for iPad and Android tablets.

## Development and web build

```sh
pnpm install
pnpm test
pnpm build
```

The static web build is emitted to `dist/`. Deploy it with:

```sh
pnpm deploy
```

## Native tablet wrapper

The project now contains a lean Capacitor 8 native wrapper with the permanent application identifier **`dev.surajmh.tinyfingers`**. The wrapper packages the built files locally, so the core play experience does not require a network connection after installation. Capacitor’s `webDir` is set to `dist/`, the directory that contains the final `index.html`, as required by Capacitor’s configuration model.[1]

| Platform | Project location | Tablet-only policy | Current configuration |
|---|---|---|---|
| iPad | `ios/App/App.xcodeproj` | iPad only | Xcode target device family is set to `2`; iPhone builds are excluded. |
| Android | `android/` | Tablet-sized screens only | The manifest excludes `small` and `normal` screens and requires a smallest available width of at least `600dp`. This aligns with the common Android tablet threshold.[2] |

Both portrait and landscape orientations remain enabled because TinyFingers adapts its full-screen play surface to either tablet orientation. During active play on a tablet touch device, an on-screen keyboard—numbers, letters, Space, and Go—makes the game playable without a physical keyboard or the operating system keyboard. It remains hidden on the dashboard and in laptop or desktop browsers. Native scrolling and WebView zoom are disabled, and the existing TinyFingers icon is used for both native targets.

> Android display classifications differ across devices. The manifest provides the application-level device filter; before publishing, use the Play Console device catalog to confirm the exact Android tablet models you intend to support.

### Daily native workflow

After any change to `src/` or `public/`, run the following command before opening Xcode or Android Studio. It rebuilds Astro and synchronizes the current `dist/` content into each native project.

```sh
pnpm native:sync
```

The other project commands are:

```sh
pnpm ios:open
pnpm android:open
```

The app icon sources are kept in `assets/icon-only.png`. To regenerate the native icon variants after changing that file, run:

```sh
pnpm exec capacitor-assets generate --ios --android
```

Capacitor’s supported asset workflow uses a minimum 1024 × 1024 icon source to generate the iOS and Android variants.[3]

### Release preparation

| Store | Recommended release path |
|---|---|
| App Store / TestFlight | Run `pnpm native:sync`, open the iOS project, select your Apple Developer team under **Signing & Capabilities**, then use **Product → Archive** and distribute the archive through App Store Connect. |
| Google Play | Run `pnpm native:sync`, open the Android project, configure your release signing key, then use **Build → Generate Signed Bundle / APK → Android App Bundle**. Upload the resulting signed `.aab` to Play Console. |

The iOS project has been validated as an unsigned debug build for an **iPad Pro 13-inch (M5)** simulator. The Android project has been validated as a debug build using the Android Studio Java runtime. Signing, store accounts, provisioning profiles, and production release uploads deliberately remain under your control.

## Browser/PWA installation

| Device | Install TinyFingers | Apply the OS containment control |
|---|---|---|
| Family iPad | Open the deployed site in Safari, then **Share → Add to Home Screen**. | Enable **Settings → Accessibility → Guided Access** with a separate parent passcode. Launch TinyFingers, start Guided Access, and disable Top Button, Volume Buttons, Motion, and Software Keyboards. Keep Touch enabled. |
| Dedicated iPad | Use the native wrapper in this repository or a managed kiosk-browser app set to the TinyFingers URL. | Supervise the iPad and apply **Single App Mode** through Apple Configurator or MDM. Do not lock ordinary Safari alone; Single App Mode protects an app, not a particular Safari tab. |
| Family Android tablet | Install the site from Chrome as an app where the browser offers that action, or keep it open in Chrome. | Turn on **Settings → Security → App pinning**, set a parent-only device PIN, then pin the TinyFingers app/browser task from Overview. |
| Dedicated Android tablet | Use the native wrapper in this repository or a managed kiosk-browser app set to the TinyFingers URL. | Factory-reset and enrol as an Android Enterprise dedicated device, then use **Lock Task mode** with only the kiosk app allowlisted. |

The device-level setting—not browser JavaScript—is the security boundary. Apple documents Guided Access and Single App Mode for iPad containment, while Android documents screen pinning and dedicated-device Lock Task mode.[4] [5] [6] [7] Test the parent exit route, restart behaviour, and offline recovery before handing the tablet to a child.

## References

[1]: https://capacitorjs.com/docs/config "Capacitor Configuration"
[2]: https://developer.android.com/guide/topics/manifest/supports-screens-element "Android Developers: supports-screens"
[3]: https://capacitorjs.com/docs/guides/splash-screens-and-icons "Capacitor: Splash Screens and Icons"
[4]: https://support.apple.com/guide/ipad/lock-ipad-to-one-app-ipada16d1374/ipados "Apple: Guided Access"
[5]: https://support.apple.com/guide/apple-configurator-mac/set-single-app-mode-cadbf9c172/mac "Apple: Single App Mode"
[6]: https://support.google.com/android/answer/9455138?hl=en "Google: Screen pinning"
[7]: https://developer.android.com/work/dpc/dedicated-devices "Android Enterprise: Dedicated devices"
