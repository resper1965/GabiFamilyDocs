import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { SessionProvider, useSession } from '../src/contexts/SessionContext'
import { SplashScreenController } from '../src/components/SplashScreenController'

// Root layout with authentication
function RootLayoutNav() {
  const { session, isLoading } = useSession()

  return (
    <Stack>
      <Stack.Protected guard={session}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  )
}

// Root layout with providers
export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <SessionProvider>
      <SplashScreenController />
      <RootLayoutNav />
    </SessionProvider>
  )
}
