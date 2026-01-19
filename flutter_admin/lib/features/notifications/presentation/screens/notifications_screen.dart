import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/notification_model.dart';
import '../../providers/notification_provider.dart';
import '../widgets/notification_item_widget.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  @override
  Widget build(BuildContext context) {
    final selectedFilter = ref.watch(notificationFilterProvider);
    final notificationsAsync = ref.watch(notificationListProvider(selectedFilter));
    final actions = ref.watch(notificationActionsProvider);

    // Enable auto-refresh
    ref.watch(autoRefreshNotificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            tooltip: 'Mark all as read',
            onPressed: () async {
              final confirmed = await _showMarkAllReadDialog(context);
              if (confirmed == true) {
                await actions.markAllAsRead();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('All notifications marked as read'),
                    ),
                  );
                }
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: () {
              ref.invalidate(notificationListProvider);
              ref.invalidate(unreadCountProvider);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          Container(
            padding: const EdgeInsets.all(16),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  FilterChip(
                    label: const Text('All'),
                    selected: selectedFilter == null,
                    onSelected: (_) {
                      ref.read(notificationFilterProvider.notifier).state = null;
                    },
                  ),
                  const SizedBox(width: 8),
                  FilterChip(
                    label: Text(NotificationType.orderPlaced.displayName),
                    selected: selectedFilter == NotificationType.orderPlaced,
                    onSelected: (_) {
                      ref.read(notificationFilterProvider.notifier).state =
                          NotificationType.orderPlaced;
                    },
                  ),
                  const SizedBox(width: 8),
                  FilterChip(
                    label: Text(NotificationType.paymentSuccess.displayName),
                    selected: selectedFilter == NotificationType.paymentSuccess,
                    onSelected: (_) {
                      ref.read(notificationFilterProvider.notifier).state =
                          NotificationType.paymentSuccess;
                    },
                  ),
                  const SizedBox(width: 8),
                  FilterChip(
                    label: Text(NotificationType.deliverySuccess.displayName),
                    selected: selectedFilter == NotificationType.deliverySuccess,
                    onSelected: (_) {
                      ref.read(notificationFilterProvider.notifier).state =
                          NotificationType.deliverySuccess;
                    },
                  ),
                ],
              ),
            ),
          ),

          const Divider(height: 1),

          // Notifications list
          Expanded(
            child: notificationsAsync.when(
              data: (notifications) {
                if (notifications.isEmpty) {
                  return _buildEmptyState(selectedFilter);
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(notificationListProvider);
                    ref.invalidate(unreadCountProvider);
                  },
                  child: ListView.builder(
                    itemCount: notifications.length,
                    itemBuilder: (context, index) {
                      final notification = notifications[index];
                      return NotificationItemWidget(
                        notification: notification,
                        onTap: () async {
                          // Mark as read
                          if (!notification.isRead) {
                            await actions.markAsRead(notification.id);
                          }

                          // Navigate to order details
                          // TODO: Implement navigation to order details
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Navigate to order: ${notification.metadata?.orderNumber ?? notification.orderId}',
                                ),
                              ),
                            );
                          }
                        },
                        onDelete: () async {
                          await actions.deleteNotification(notification.id);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Notification deleted'),
                              ),
                            );
                          }
                        },
                      );
                    },
                  ),
                );
              },
              loading: () => const Center(
                child: CircularProgressIndicator(),
              ),
              error: (error, stack) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: Colors.red),
                    const SizedBox(height: 16),
                    Text(
                      'Error loading notifications',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      error.toString(),
                      style: Theme.of(context).textTheme.bodySmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () {
                        ref.invalidate(notificationListProvider);
                      },
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(NotificationType? filter) {
    String message = 'No notifications yet';
    if (filter != null) {
      message = 'No ${filter.displayName.toLowerCase()} notifications';
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_none,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Future<bool?> _showMarkAllReadDialog(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Mark all as read?'),
        content: const Text(
          'This will mark all notifications as read. This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Mark all read'),
          ),
        ],
      ),
    );
  }
}
