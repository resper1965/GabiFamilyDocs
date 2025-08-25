import { Stack } from 'expo-router'
import { useSession } from '../../src/contexts/SessionContext'
import { Redirect } from 'expo-router'

export default function AppLayout() {
  const { session, isLoading } = useSession()

  // Show loading while checking session
  if (isLoading) {
    return null
  }

  // Redirect to auth if no session
  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="documents" options={{ title: 'Documentos' }} />
      <Stack.Screen name="chat" options={{ title: 'Chat AI' }} />
      <Stack.Screen name="profile" options={{ title: 'Perfil' }} />
    </Stack>
  )
}
