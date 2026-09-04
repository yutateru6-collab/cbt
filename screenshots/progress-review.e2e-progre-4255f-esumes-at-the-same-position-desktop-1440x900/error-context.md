# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: progress-review.e2e.spec.cjs >> progress review is read-only, hides future questions, and resumes at the same position
- Location: qa/progress-review.e2e.spec.cjs:25:1

# Error details

```
Error: browser.newContext: Target page, context or browser has been closed
Browser logs:

<launching> /home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,BlockOriginHeaderModificationOnRedirect,Translate,AutoDeElevate,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --disable-updater-scheduler --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/tmp/playwright_chromiumdev_profile-47g4KC --remote-debugging-pipe --no-startup-window
<launched> pid=5462
[pid=5462][err] [0904/175727.012284:WARNING:media/gpu/vaapi/vaapi_wrapper.cc:1655] drmGetDevices2() has not found any devices
[pid=5462][err] [0904/175727.015275:WARNING:sandbox/policy/linux/sandbox_linux.cc:405] InitializeSandbox() called with multiple threads in process gpu-process.
[pid=5462][err] [0904/175727.491479:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175728.162970:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175728.752603:WARNING:media/audio/linux/audio_manager_linux.cc:53] Falling back to ALSA for audio output. PulseAudio is not available or could not be initialized.
[pid=5462][err] ALSA lib confmisc.c:855:(parse_card) cannot find card '0'
[pid=5462][err] ALSA lib conf.c:5208:(_snd_config_evaluate) function snd_func_card_inum returned error: No such file or directory
[pid=5462][err] ALSA lib confmisc.c:422:(snd_func_concat) error evaluating strings
[pid=5462][err] ALSA lib conf.c:5208:(_snd_config_evaluate) function snd_func_concat returned error: No such file or directory
[pid=5462][err] ALSA lib confmisc.c:1342:(snd_func_refer) error evaluating name
[pid=5462][err] ALSA lib conf.c:5208:(_snd_config_evaluate) function snd_func_refer returned error: No such file or directory
[pid=5462][err] ALSA lib conf.c:5731:(snd_config_expand) Evaluate error: No such file or directory
[pid=5462][err] ALSA lib pcm.c:2721:(snd_pcm_open_noupdate) Unknown PCM default
[pid=5462][err] [0904/175728.864917:ERROR:media/audio/alsa/alsa_util.cc:204] PcmOpen: default,No such file or directory
[pid=5462][err] ALSA lib confmisc.c:855:(parse_card) cannot find card '0'
[pid=5462][err] ALSA lib conf.c:5208:(_snd_config_evaluate) function snd_func_card_inum returned error: No such file or directory
[pid=5462][err] ALSA lib confmisc.c:422:(snd_func_concat) error evaluating strings
[pid=5462][err] ALSA lib conf.c:5208:(_snd_config_evaluate) function snd_func_concat returned error: No such file or directory
[pid=5462][err] ALSA lib confmisc.c:1342:(snd_func_refer) error evaluating name
[pid=5462][err] ALSA lib conf.c:5208:(_snd_config_evaluate) function snd_func_refer returned error: No such file or directory
[pid=5462][err] ALSA lib conf.c:5731:(snd_config_expand) Evaluate error: No such file or directory
[pid=5462][err] ALSA lib pcm.c:2721:(snd_pcm_open_noupdate) Unknown PCM default
[pid=5462][err] [0904/175728.869374:ERROR:media/audio/alsa/alsa_util.cc:204] PcmOpen: plug:default,No such file or directory
[pid=5462][err] [0904/175729.710218:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175729.890047:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175730.070296:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175730.248762:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175730.580084:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175731.531139:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175732.397218:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175732.837884:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175732.975755:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175733.108733:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175733.237101:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175733.550341:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175737.305892:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175741.059999:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175744.773734:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175748.856849:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175750.181823:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175750.871734:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175752.293741:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] [0904/175752.954113:INFO:CONSOLE:3] "Service Worker registration blocked by Playwright", source:  (3)
[pid=5462][err] Received signal 11 SEGV_MAPERR 0000000001b0
[pid=5462][err] #0 0x559387582413 (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4265412)
[pid=5462][err] #1 0x55938a868df4 (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x754bdf3)
[pid=5462][err] #2 0x7fb026e45330 (/usr/lib/x86_64-linux-gnu/libc.so.6+0x4532f)
[pid=5462][err] #3 0x559389e7619a (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x6b59199)
[pid=5462][err] #4 0x559389e3da29 (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x6b20a28)
[pid=5462][err] #5 0x559389c956d2 (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x69786d1)
[pid=5462][err] #6 0x559389c9117c (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x697417b)
[pid=5462][err] #7 0x5593869c3ead (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a6eac)
[pid=5462][err] #8 0x5593869c3ac4 (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a6ac3)
[pid=5462][err] #9 0x559388051474 (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4d34473)
[pid=5462][err] #10 0x5593869c3e1f (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a6e1e)
[pid=5462][err] #11 0x5593869be2de (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a12dd)
[pid=5462][err] #12 0x5593869bd5ed (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a05ec)
[pid=5462][err] #13 0x559389ded6f5 (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x6ad06f4)
[pid=5462][err] #14 0x559385180035 (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x1e63034)
[pid=5462][err] #15 0x559385184be1 (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x1e67be0)
[pid=5462][err] #16 0x5593864e8fe9 (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x31cbfe8)
[pid=5462][err] #17 0x5593864e8701 (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x31cb700)
[pid=5462][err] #18 0x5593877917ef (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x44747ee)
[pid=5462][err] #19 0x5593875eb356 (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42ce355)
[pid=5462][err] #20 0x5593875eb4d6 (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42ce4d5)
[pid=5462][err] #21 0x5593875edd1e (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42d0d1d)
[pid=5462][err] #22 0x5593875eb839 (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42ce838)
[pid=5462][err] #23 0x5593875eac0e (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42cdc0d)
[pid=5462][err] #24 0x55938803aa70 (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4d1da6f)
[pid=5462][err] #25 0x55938803bc32 (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4d1ec31)
[pid=5462][err] #26 0x7fb026e2a1ca (/usr/lib/x86_64-linux-gnu/libc.so.6+0x2a1c9)
[pid=5462][err] #27 0x7fb026e2a28b (/usr/lib/x86_64-linux-gnu/libc.so.6+0x2a28a)
[pid=5462][err] #28 0x559387bb6cba (/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4899cb9)
[pid=5462][err]   r8: 0000000000000070  r9: 000000000000002f r10: 0000000000000009 r11: 0000223c00cae210
[pid=5462][err]  r12: 0000000000000000 r13: 0000223c01128b40 r14: 00000000000000a8 r15: 0000000000000000
[pid=5462][err]   di: 00007fff299fd1f8  si: 00000000000000a8  bp: 00007fff299fd0a0  bx: 00007fff299fd1f8
[pid=5462][err]   dx: 0000000000000009  ax: 0000000000000000  cx: 312e302e302e3732  sp: 00007fff299fcea0
[pid=5462][err]   ip: 00005593861453cd efl: 0000000000010206 cgf: 002b000000000033 erf: 0000000000000004
[pid=5462][err]  trp: 000000000000000e msk: 0000000000000000 cr2: 00000000000001b0
[pid=5462][err] [end of stack trace]
```