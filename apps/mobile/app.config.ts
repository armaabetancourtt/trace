export default {
  expo: {
    name: 'TRACE',
    slug: 'trace',
    icon: './assets/trace-launcher.png',
    version: '0.1.0',
    orientation: 'portrait',
    scheme: 'trace',
    userInterfaceStyle: 'dark',
    splash: { backgroundColor: '#050505' },
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.trace.movement',
      googleServicesFile: './GoogleService-Info.plist',
    },
    android: {
      package: 'com.trace.movement',
      googleServicesFile: './google-services.json',
    },
    plugins: [
      '@rnmapbox/maps',
      '@react-native-firebase/app',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'TRACE uses your location to record activities and show your position on the live map.',
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true
        }
      ]
    ]
  }
};
