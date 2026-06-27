import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.studyassist.app',
  appName: 'Study Assist',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
