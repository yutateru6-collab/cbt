const projects = [
  {
    name: 'desktop-1440x900',
    use: {
      browserName: 'chromium',
      viewport: { width: 1440, height: 900 },
      screen: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
    },
  },
  {
    name: 'laptop-1366x768',
    use: {
      browserName: 'chromium',
      viewport: { width: 1366, height: 768 },
      screen: { width: 1366, height: 768 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
    },
  },
  {
    name: 'ipad-820x1180',
    use: {
      browserName: 'webkit',
      viewport: { width: 820, height: 1180 },
      screen: { width: 820, height: 1180 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPad; CPU OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
    },
  },
  {
    name: 'ipad-landscape-1180x820',
    use: {
      browserName: 'webkit',
      viewport: { width: 1180, height: 820 },
      screen: { width: 1180, height: 820 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPad; CPU OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
    },
  },
  {
    name: 'ipad-boundary-768x1024',
    use: {
      browserName: 'webkit',
      viewport: { width: 768, height: 1024 },
      screen: { width: 768, height: 1024 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPad; CPU OS 16_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    },
  },
  {
    name: 'android-tablet-800x1280',
    use: {
      browserName: 'chromium',
      viewport: { width: 800, height: 1280 },
      screen: { width: 800, height: 1280 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (Linux; Android 15; Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    },
  },
  {
    name: 'iphone-16-393x852',
    use: {
      browserName: 'webkit',
      viewport: { width: 393, height: 852 },
      screen: { width: 393, height: 852 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
    },
  },
];

module.exports = {
  projects,
  expectedDeviceNames: projects.map((project) => project.name),
};
