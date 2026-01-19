import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/notification_model.dart';
import '../data/repositories/notification_repository.dart';

// Base URL provider - Replace with your actual backend URL
final baseUrlProvider = Provider<String>((ref) {
  return 'http://localhost:3000'; // TODO: Replace with your backend URL
});

// Notification Repository Provider
final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  final baseUrl = ref.watch(baseUrlProvider);
  return NotificationRepository(baseUrl: baseUrl);
});

// Notification Filter Provider
final notificationFilterProvider =
    StateProvider<NotificationType?>((ref) => null);

// Notification List Provider
final notificationListProvider = FutureProvider.autoDispose
    .family<List<NotificationModel>, NotificationType?>((ref, filter) async {
  final repository = ref.watch(notificationRepositoryProvider);

  final result = await repository.getAllNotifications(
    page: 1,
    limit: 50,
    type: filter,
  );

  return result['notifications'] as List<NotificationModel>;
});

// Unread Count Provider
final unreadCountProvider = FutureProvider.autoDispose<int>((ref) async {
  final repository = ref.watch(notificationRepositoryProvider);
  return await repository.getUnreadCount();
});

// Notification Actions Provider
final notificationActionsProvider = Provider<NotificationActions>((ref) {
  final repository = ref.watch(notificationRepositoryProvider);
  return NotificationActions(repository, ref);
});

class NotificationActions {
  final NotificationRepository _repository;
  final Ref _ref;

  NotificationActions(this._repository, this._ref);

  Future<bool> markAsRead(String notificationId) async {
    final result = await _repository.markAsRead(notificationId);
    if (result) {
      // Refresh the lists
      _ref.invalidate(notificationListProvider);
      _ref.invalidate(unreadCountProvider);
    }
    return result;
  }

  Future<bool> markAllAsRead() async {
    final result = await _repository.markAllAsRead();
    if (result) {
      // Refresh the lists
      _ref.invalidate(notificationListProvider);
      _ref.invalidate(unreadCountProvider);
    }
    return result;
  }

  Future<bool> deleteNotification(String notificationId) async {
    final result = await _repository.deleteNotification(notificationId);
    if (result) {
      // Refresh the lists
      _ref.invalidate(notificationListProvider);
      _ref.invalidate(unreadCountProvider);
    }
    return result;
  }

  Future<bool> registerToken(String token, Map<String, dynamic>? deviceInfo) async {
    return await _repository.registerToken(token, deviceInfo);
  }

  Future<bool> unregisterToken(String token) async {
    return await _repository.unregisterToken(token);
  }

  void refreshNotifications() {
    _ref.invalidate(notificationListProvider);
    _ref.invalidate(unreadCountProvider);
  }
}

// Auto-refresh provider (refreshes every 30 seconds)
final autoRefreshProvider = StreamProvider.autoDispose<int>((ref) {
  return Stream.periodic(const Duration(seconds: 30), (count) => count);
});

// Combined provider that auto-refreshes
final autoRefreshNotificationsProvider = Provider.autoDispose<void>((ref) {
  ref.watch(autoRefreshProvider);
  ref.invalidate(notificationListProvider);
  ref.invalidate(unreadCountProvider);
});
