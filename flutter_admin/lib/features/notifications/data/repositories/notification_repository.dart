import 'package:dio/dio.dart';
import 'package:logger/logger.dart';
import '../models/notification_model.dart';

class NotificationRepository {
  final Dio _dio;
  final Logger _logger = Logger();
  final String baseUrl;

  NotificationRepository({
    required this.baseUrl,
    Dio? dio,
  }) : _dio = dio ?? Dio();

  /// Get all notifications with optional filtering
  Future<Map<String, dynamic>> getAllNotifications({
    int page = 1,
    int limit = 20,
    NotificationType? type,
    bool? isRead,
    String? sortBy = 'createdAt',
    String? order = 'desc',
  }) async {
    try {
      final queryParams = {
        'page': page,
        'limit': limit,
        'sortBy': sortBy,
        'order': order,
      };

      if (type != null) {
        queryParams['type'] = type.value;
      }

      if (isRead != null) {
        queryParams['isRead'] = isRead.toString();
      }

      final response = await _dio.get(
        '$baseUrl/api/v1/admin/notifications',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final List<NotificationModel> notifications = (response.data['data'] as List)
            .map((json) => NotificationModel.fromJson(json))
            .toList();

        return {
          'notifications': notifications,
          'pagination': response.data['pagination'],
        };
      } else {
        throw Exception('Failed to fetch notifications');
      }
    } on DioException catch (e) {
      _logger.e('Error fetching notifications: ${e.message}');
      rethrow;
    }
  }

  /// Get unread notification count
  Future<int> getUnreadCount() async {
    try {
      final response = await _dio.get(
        '$baseUrl/api/v1/admin/notifications/unread-count',
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data['count'] ?? 0;
      } else {
        throw Exception('Failed to fetch unread count');
      }
    } on DioException catch (e) {
      _logger.e('Error fetching unread count: ${e.message}');
      return 0;
    }
  }

  /// Mark a notification as read
  Future<bool> markAsRead(String notificationId) async {
    try {
      final response = await _dio.patch(
        '$baseUrl/api/v1/admin/notifications/$notificationId/read',
      );

      return response.statusCode == 200 && response.data['success'] == true;
    } on DioException catch (e) {
      _logger.e('Error marking notification as read: ${e.message}');
      return false;
    }
  }

  /// Mark all notifications as read
  Future<bool> markAllAsRead() async {
    try {
      final response = await _dio.patch(
        '$baseUrl/api/v1/admin/notifications/read-all',
      );

      return response.statusCode == 200 && response.data['success'] == true;
    } on DioException catch (e) {
      _logger.e('Error marking all notifications as read: ${e.message}');
      return false;
    }
  }

  /// Delete a notification
  Future<bool> deleteNotification(String notificationId) async {
    try {
      final response = await _dio.delete(
        '$baseUrl/api/v1/admin/notifications/$notificationId',
      );

      return response.statusCode == 200 && response.data['success'] == true;
    } on DioException catch (e) {
      _logger.e('Error deleting notification: ${e.message}');
      return false;
    }
  }

  /// Register FCM token
  Future<bool> registerToken(String token, Map<String, dynamic>? deviceInfo) async {
    try {
      final response = await _dio.post(
        '$baseUrl/api/v1/admin/notifications/register-token',
        data: {
          'token': token,
          'deviceInfo': deviceInfo,
        },
      );

      return response.statusCode == 200 && response.data['success'] == true;
    } on DioException catch (e) {
      _logger.e('Error registering token: ${e.message}');
      return false;
    }
  }

  /// Unregister FCM token
  Future<bool> unregisterToken(String token) async {
    try {
      final response = await _dio.delete(
        '$baseUrl/api/v1/admin/notifications/unregister-token',
        data: {'token': token},
      );

      return response.statusCode == 200 && response.data['success'] == true;
    } on DioException catch (e) {
      _logger.e('Error unregistering token: ${e.message}');
      return false;
    }
  }

  /// Send test notification
  Future<bool> sendTestNotification(String token) async {
    try {
      final response = await _dio.post(
        '$baseUrl/api/v1/admin/notifications/test',
        data: {'token': token},
      );

      return response.statusCode == 200 && response.data['success'] == true;
    } on DioException catch (e) {
      _logger.e('Error sending test notification: ${e.message}');
      return false;
    }
  }
}
