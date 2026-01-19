import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'firebase_options.dart';
import 'core/services/fcm_service.dart';
import 'features/notifications/presentation/screens/notifications_screen.dart';
import 'features/notifications/presentation/widgets/notification_bell_widget.dart';
import 'features/notifications/providers/notification_provider.dart';

// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  print('📩 Background message received: ${message.notification?.title}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Set background message handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // Initialize FCM Service
  final fcmService = FCMService();
  await fcmService.initialize();

  runApp(
    ProviderScope(
      child: MyApp(fcmService: fcmService),
    ),
  );
}

class MyApp extends ConsumerWidget {
  final FCMService fcmService;

  const MyApp({super.key, required this.fcmService});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'Admin Dashboard',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
        textTheme: GoogleFonts.interTextTheme(),
      ),
      home: AdminDashboard(fcmService: fcmService),
    );
  }
}

class AdminDashboard extends ConsumerStatefulWidget {
  final FCMService fcmService;

  const AdminDashboard({super.key, required this.fcmService});

  @override
  ConsumerState<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends ConsumerState<AdminDashboard> {
  @override
  void initState() {
    super.initState();
    _setupNotifications();
  }

  Future<void> _setupNotifications() async {
    // Register token with backend
    final actions = ref.read(notificationActionsProvider);
    final token = widget.fcmService.fcmToken;

    if (token != null) {
      await actions.registerToken(token, {
        'browser': 'web',
        'platform': 'flutter_web',
      });
    }

    // Listen to foreground messages
    widget.fcmService.onMessage.listen((message) {
      print('📩 Foreground message: ${message.notification?.title}');

      // Refresh notifications
      ref.invalidate(notificationListProvider);
      ref.invalidate(unreadCountProvider);

      // Show snackbar
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.notifications, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        message.notification?.title ?? 'New Notification',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      if (message.notification?.body != null)
                        Text(
                          message.notification!.body!,
                          style: const TextStyle(color: Colors.white),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            backgroundColor: Colors.blue[700],
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 4),
            action: SnackBarAction(
              label: 'View',
              textColor: Colors.white,
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const NotificationsScreen(),
                  ),
                );
              },
            ),
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        actions: [
          NotificationBellWidget(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const NotificationsScreen(),
                ),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.dashboard,
              size: 100,
              color: Colors.blue,
            ),
            const SizedBox(height: 24),
            Text(
              'Welcome to Admin Dashboard',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 16),
            Text(
              'Notification system is active',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const NotificationsScreen(),
                  ),
                );
              },
              icon: const Icon(Icons.notifications),
              label: const Text('View Notifications'),
            ),
          ],
        ),
      ),
    );
  }
}
