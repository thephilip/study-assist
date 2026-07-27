import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.studyassist.app',
  appName: 'Study Assist',
  // Its own directory, not dist/: a GH Pages build there has base
  // '/study-assist/' and would copy into the app as a blank screen.
  webDir: 'dist-native',
  server: {
    androidScheme: 'https',
  },
}

export default config
