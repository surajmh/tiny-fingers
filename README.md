# TinyFingers

A fast fullscreen keyboard, pointer, and touch toy for toddlers, built with Astro and the Canvas API.

## Development and production checks

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
```

## Tablet installation

TinyFingers now includes a web-app manifest, iPad home-screen metadata, tablet app icons, and an offline fallback. Deploy the contents of `dist/` over HTTPS, then install it before enabling the device kiosk control.

| Device | Install TinyFingers | Apply the OS containment control |
|---|---|---|
| Family iPad | Open the deployed site in Safari, then **Share → Add to Home Screen**. | Enable **Settings → Accessibility → Guided Access** with a separate parent passcode. Launch TinyFingers, start Guided Access, and disable Top Button, Volume Buttons, Motion, and Software Keyboards. Keep Touch enabled. |
| Dedicated iPad | Use a managed native wrapper or a managed kiosk-browser app set to the TinyFingers URL. | Supervise the iPad and apply **Single App Mode** through Apple Configurator or MDM. Do not lock ordinary Safari alone; Single App Mode protects an app, not a particular Safari tab. |
| Family Android tablet | Install the site from Chrome as an app where the browser offers that action, or keep it open in Chrome. | Turn on **Settings → Security → App pinning**, set a parent-only device PIN, then pin the TinyFingers app/browser task from Overview. |
| Dedicated Android tablet | Use a managed native wrapper or kiosk-browser app set to the TinyFingers URL. | Factory-reset and enrol as an Android Enterprise dedicated device, then use **Lock Task mode** with only the kiosk app allowlisted. |

The device-level setting—not browser JavaScript—is the security boundary. Test the parent exit route, restart behaviour, and offline recovery before handing the tablet to a child.

## References

- [Apple: Guided Access](https://support.apple.com/guide/ipad/lock-ipad-to-one-app-ipada16d1374/ipados)
- [Apple: Single App Mode](https://support.apple.com/guide/apple-configurator-mac/set-single-app-mode-cadbf9c172/mac)
- [Google: Screen pinning](https://support.google.com/android/answer/9455138?hl=en)
- [Android Enterprise: Dedicated devices](https://developer.android.com/work/dpc/dedicated-devices)
