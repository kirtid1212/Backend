import 'dart:async';
import 'dart:html' as html;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:logger/logger.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FCMService {
  static final FCMService _instance = FCMService._internal();
  factory FCMService() => _instance;
  FCMService._internal();

  final Logger _logger = Logger();
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  FirebaseMessaging? _messaging;
  String? _fcmToken;
  final StreamController<RemoteMessage> _messageStreamController =
      StreamController<RemoteMessage>.broadcast();

  Stream<RemoteMessage> get onMessage => _messageStreamController.stream;
  String? get fcmToken => _fcmToken;

  /// Initialize FCM service
  Future<void> initialize() async {
    try {
      _messaging = FirebaseMessaging.instance;

      // Initialize local notifications for foreground
      await _initializeLocalNotifications();

      // Request permission
      await requestPermission();

      // Get FCM token
      await _getToken();

      // Setup message handlers
      _setupMessageHandlers();

      _logger.i('✅ FCM Service initialized successfully');
    } catch (e) {
      _logger.e('❌ Failed to initialize FCM Service: $e');
    }
  }

  /// Initialize local notifications
  Future<void> _initializeLocalNotifications() async {
    const initializationSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(),
    );

    await _localNotifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (details) {
        _logger.i('Notification clicked: ${details.payload}');
        // Handle notification click
      },
    );
  }

  /// Request notification permission
  Future<bool> requestPermission() async {
    try {
      if (_messaging == null) return false;

      final settings = await _messaging!.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      _logger.i('Notification permission status: ${settings.authorizationStatus}');

      return settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional;
    } catch (e) {
      _logger.e('Error requesting permission: $e');
      return false;
    }
  }

  /// Get FCM token
  Future<String?> _getToken() async {
    try {
      if (_messaging == null) return null;

      // For web, we need to provide VAPID key
      // Get it from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
      _fcmToken = await _messaging!.getToken(
        vapidKey: 'YOUR_VAPID_KEY_HERE', // TODO: Replace with actual VAPID key
      );

      _logger.i('FCM Token: $_fcmToken');

      // Save token locally
      if (_fcmToken != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('fcm_token', _fcmToken!);
      }

      // Listen for token refresh
      _messaging!.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        _logger.i('FCM Token refreshed: $newToken');
        // TODO: Send new token to backend
      });

      return _fcmToken;
    } catch (e) {
      _logger.e('Error getting FCM token: $e');
      return null;
    }
  }

  /// Setup message handlers
  void _setupMessageHandlers() {
    if (_messaging == null) return;

    // Foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _logger.i('📩 Foreground message received: ${message.notification?.title}');
      _messageStreamController.add(message);
      _showForegroundNotification(message);
    });

    // Background message click (when app is in background)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _logger.i('🔔 Notification clicked (background): ${message.notification?.title}');
      _handleNotificationClick(message);
    });

    // Check if app was opened from a terminated state
    _messaging!.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        _logger.i('🔔 Notification clicked (terminated): ${message.notification?.title}');
        _handleNotificationClick(message);
      }
    });
  }

  /// Show foreground notification
  Future<void> _showForegroundNotification(RemoteMessage message) async {
    try {
      final notification = message.notification;
      if (notification == null) return;

      // For web, we can use browser notifications
      if (html.Notification.supported) {
        final permission = await html.Notification.requestPermission();
        if (permission == 'granted') {
          html.Notification(
            notification.title ?? 'New Notification',
            body: notification.body,
            icon: '/icon-192x192.png',
          );
        }
      }

      // Also show using flutter_local_notifications for consistency
      const notificationDetails = NotificationDetails(
        android: AndroidNotificationDetails(
          'admin_notifications',
          'Admin Notifications',
          channelDescription: 'Notifications for admin dashboard',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      );

      await _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        notificationDetails,
        payload: message.data.toString(),
      );
    } catch (e) {
      _logger.e('Error showing foreground notification: $e');
    }
  }

  /// Handle notification click
  void _handleNotificationClick(RemoteMessage message) {
    _logger.i('Handling notification click: ${message.data}');
    // TODO: Navigate to appropriate screen based on notification data
    // Example: Navigate to order details if orderId is present
    final orderId = message.data['orderId'];
    if (orderId != null) {
      // Navigate to order details
      _logger.i('Navigate to order: $orderId');
    }
  }

  /// Register token with backend
  Future<bool> registerTokenWithBackend(
    String Function(String, Map<String, dynamic>?) registerCallback,
  ) async {
    try {
      if (_fcmToken == null) {
        _logger.w('No FCM token available');
        return false;
      }

      final deviceInfo = {
        'browser': html.window.navigator.userAgent,
        'platform': 'web',
      };

      final result = await registerCallback(_fcmToken!, deviceInfo);
      _logger.i('Token registered with backend: $result');
      return true;
    } catch (e) {
      _logger.e('Error registering token with backend: $e');
      return false;
    }
  }

  /// Unregister token
  Future<void> unregisterToken(
    Future<bool> Function(String) unregisterCallback,
  ) async {
    try {
      if (_fcmToken != null) {
        await unregisterCallback(_fcmToken!);
        _logger.i('Token unregistered');
      }

      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('fcm_token');
    } catch (e) {
      _logger.e('Error unregistering token: $e');
    }
  }

  /// Dispose
  void dispose() {
    _messageStreamController.close();
  }
}
