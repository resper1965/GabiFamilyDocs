import '@testing-library/react-native/extend-expect';

// Configure global testing options
import { configure } from '@testing-library/react-native';

// Set global configuration for all tests
configure({
  asyncUtilTimeout: 5000, // 5 seconds timeout for async operations
  defaultHidden: false, // Show hidden elements by default
  defaultDebugOptions: {
    message: 'Debug output from React Native Testing Library',
  },
  concurrentRoot: true, // Enable concurrent rendering
});

// Mock React Native modules that are not available in test environment
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
jest.mock('react-native/Libraries/LogBox/LogBox');
jest.mock('react-native/Libraries/AppRegistry/AppRegistry');
jest.mock('react-native/Libraries/ReactNative/AppState');
jest.mock('react-native/Libraries/NetInfo/NetInfo');
jest.mock('react-native/Libraries/AsyncStorage/AsyncStorage');

// Mock Expo modules
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/document/directory/',
  cacheDirectory: '/mock/cache/directory/',
  bundleDirectory: '/mock/bundle/directory/',
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  moveAsync: jest.fn(),
  copyAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  downloadAsync: jest.fn(),
  uploadAsync: jest.fn(),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  saveAsync: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getScheduledNotificationsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  isAvailableAsync: jest.fn(),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      containedBy: jest.fn().mockReturnThis(),
      rangeGt: jest.fn().mockReturnThis(),
      rangeGte: jest.fn().mockReturnThis(),
      rangeLt: jest.fn().mockReturnThis(),
      rangeLte: jest.fn().mockReturnThis(),
      rangeAdjacent: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
      then: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
        createSignedUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
    rpc: jest.fn(),
  })),
}));

// Mock React Native Performance
jest.mock('@shopify/react-native-performance', () => ({
  PerformanceMeasureView: ({ children }: any) => children,
  FlatListPerformanceView: ({ children }: any) => children,
  RenderPassReport: jest.fn(),
  PerformanceMeasureView: ({ children }: any) => children,
}));

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  const Text = require('react-native/Libraries/Text/Text');
  const ScrollView = require('react-native/Libraries/Components/ScrollView/ScrollView');
  const TouchableOpacity = require('react-native/Libraries/Components/Touchable/TouchableOpacity');

  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView,
    Slider: View,
    Switch: View,
    TextInput: require('react-native/Libraries/Components/TextInput/TextInput'),
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    State: {},
    Directions: {},
    gestureHandlerRootHOC: jest.fn((component) => component),
    GestureHandlerRootView: View,
    TouchableOpacity,
    TouchableHighlight: TouchableOpacity,
    TouchableWithoutFeedback: TouchableOpacity,
    TouchableNativeFeedback: TouchableOpacity,
  };
});

// Mock React Native Vector Icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome5', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('react-native-vector-icons/AntDesign', () => 'Icon');
jest.mock('react-native-vector-icons/Entypo', () => 'Icon');
jest.mock('react-native-vector-icons/EvilIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Fontisto', () => 'Icon');
jest.mock('react-native-vector-icons/Foundation', () => 'Icon');
jest.mock('react-native-vector-icons/Octicons', () => 'Icon');
jest.mock('react-native-vector-icons/SimpleLineIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Zocial', () => 'Icon');

// Mock React Native Paper
jest.mock('react-native-paper', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');

  return {
    Provider: ({ children }: any) => children,
    DefaultTheme: {
      colors: {
        primary: '#6200ee',
        accent: '#03dac4',
        background: '#f6f6f6',
        surface: '#ffffff',
        error: '#b00020',
        text: '#000000',
        onSurface: '#000000',
        disabled: '#000000',
        placeholder: '#6200ee',
        backdrop: 'rgba(0, 0, 0, 0.5)',
        notification: '#f50057',
      },
    },
    DarkTheme: {
      colors: {
        primary: '#bb86fc',
        accent: '#03dac4',
        background: '#121212',
        surface: '#121212',
        error: '#cf6679',
        text: '#ffffff',
        onSurface: '#ffffff',
        disabled: '#ffffff',
        placeholder: '#bb86fc',
        backdrop: 'rgba(0, 0, 0, 0.5)',
        notification: '#ff80ab',
      },
    },
    Button: ({ onPress, children, ...props }: any) => (
      <TouchableOpacity onPress={onPress} {...props}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    TextInput: ({ value, onChangeText, ...props }: any) => (
      <TextInput value={value} onChangeText={onChangeText} {...props} />
    ),
    Card: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    CardTitle: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
    CardContent: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    CardActions: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    FAB: ({ onPress, children, ...props }: any) => (
      <TouchableOpacity onPress={onPress} {...props}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    Appbar: {
      Header: ({ children, ...props }: any) => <View {...props}>{children}</View>,
      Content: ({ children, ...props }: any) => <View {...props}>{children}</View>,
      Action: ({ onPress, children, ...props }: any) => (
        <TouchableOpacity onPress={onPress} {...props}>
          <Text>{children}</Text>
        </TouchableOpacity>
      ),
      BackAction: ({ onPress, ...props }: any) => (
        <TouchableOpacity onPress={onPress} {...props}>
          <Text>Back</Text>
        </TouchableOpacity>
      ),
    },
    List: {
      Item: ({ title, description, onPress, ...props }: any) => (
        <TouchableOpacity onPress={onPress} {...props}>
          <Text>{title}</Text>
          {description && <Text>{description}</Text>}
        </TouchableOpacity>
      ),
    },
    Divider: ({ ...props }: any) => <View {...props} />,
    Avatar: {
      Text: ({ label, ...props }: any) => <Text {...props}>{label}</Text>,
      Image: ({ source, ...props }: any) => <View {...props} />,
    },
    Badge: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
    Chip: ({ children, onPress, ...props }: any) => (
      <TouchableOpacity onPress={onPress} {...props}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    Dialog: {
      Title: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
      Content: ({ children, ...props }: any) => <View {...props}>{children}</View>,
      Actions: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    },
    Portal: {
      Host: ({ children }: any) => children,
    },
    Modal: ({ children, visible, ...props }: any) => {
      if (!visible) return null;
      return <View {...props}>{children}</View>;
    },
    Snackbar: ({ children, visible, ...props }: any) => {
      if (!visible) return null;
      return <View {...props}>{children}</View>;
    },
    Surface: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    Switch: ({ value, onValueChange, ...props }: any) => (
      <TouchableOpacity onPress={() => onValueChange(!value)} {...props}>
        <Text>{value ? 'ON' : 'OFF'}</Text>
      </TouchableOpacity>
    ),
    Checkbox: ({ status, onPress, ...props }: any) => (
      <TouchableOpacity onPress={onPress} {...props}>
        <Text>{status === 'checked' ? '✓' : '☐'}</Text>
      </TouchableOpacity>
    ),
    RadioButton: ({ value, status, onPress, ...props }: any) => (
      <TouchableOpacity onPress={onPress} {...props}>
        <Text>{status === 'checked' ? '●' : '○'}</Text>
      </TouchableOpacity>
    ),
    ProgressBar: ({ progress, ...props }: any) => (
      <View {...props}>
        <View style={{ width: `${progress * 100}%`, height: 4, backgroundColor: '#6200ee' }} />
      </View>
    ),
    ActivityIndicator: ({ ...props }: any) => <View {...props} />,
    IconButton: ({ icon, onPress, ...props }: any) => (
      <TouchableOpacity onPress={onPress} {...props}>
        <Text>{icon}</Text>
      </TouchableOpacity>
    ),
    useTheme: () => ({
      colors: {
        primary: '#6200ee',
        accent: '#03dac4',
        background: '#f6f6f6',
        surface: '#ffffff',
        error: '#b00020',
        text: '#000000',
        onSurface: '#000000',
        disabled: '#000000',
        placeholder: '#6200ee',
        backdrop: 'rgba(0, 0, 0, 0.5)',
        notification: '#f50057',
      },
    }),
  };
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  return {
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      push: jest.fn(),
      pop: jest.fn(),
      replace: jest.fn(),
      reset: jest.fn(),
      setOptions: jest.fn(),
      setParams: jest.fn(),
      dispatch: jest.fn(),
      canGoBack: jest.fn(),
      isFocused: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }),
    useRoute: () => ({
      key: 'test-route-key',
      name: 'TestScreen',
      params: {},
    }),
    useFocusEffect: jest.fn(),
    useIsFocused: () => true,
    NavigationContainer: ({ children }: any) => children,
    createNavigationContainerRef: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      push: jest.fn(),
      pop: jest.fn(),
      replace: jest.fn(),
      reset: jest.fn(),
      setOptions: jest.fn(),
      setParams: jest.fn(),
      dispatch: jest.fn(),
      canGoBack: jest.fn(),
      isFocused: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }),
  };
});

jest.mock('@react-navigation/stack', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    createStackNavigator: () => ({
      Navigator: ({ children }: any) => children,
      Screen: ({ children }: any) => children,
    }),
    TransitionPresets: {
      DefaultTransition: {},
      ModalSlideFromBottomIOS: {},
      ModalPresentationIOS: {},
      FadeFromBottomAndroid: {},
      RevealFromBottomAndroid: {},
      ScaleFromCenterAndroid: {},
      DefaultTransition: {},
    },
  };
});

// Global test utilities
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.fn(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
  }))
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Setup fake timers for better test performance
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Global test timeout
jest.setTimeout(30000);
