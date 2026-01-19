class NotificationModel {
  final String id;
  final String title;
  final String message;
  final NotificationType type;
  final String orderId;
  final String userId;
  final bool isRead;
  final DateTime createdAt;
  final NotificationMetadata? metadata;

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.orderId,
    required this.userId,
    required this.isRead,
    required this.createdAt,
    this.metadata,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      type: NotificationType.fromString(json['type'] ?? 'ORDER_PLACED'),
      orderId: json['orderId'] ?? '',
      userId: json['userId'] ?? '',
      isRead: json['isRead'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      metadata: json['metadata'] != null
          ? NotificationMetadata.fromJson(json['metadata'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'message': message,
      'type': type.value,
      'orderId': orderId,
      'userId': userId,
      'isRead': isRead,
      'createdAt': createdAt.toIso8601String(),
      'metadata': metadata?.toJson(),
    };
  }

  NotificationModel copyWith({
    String? id,
    String? title,
    String? message,
    NotificationType? type,
    String? orderId,
    String? userId,
    bool? isRead,
    DateTime? createdAt,
    NotificationMetadata? metadata,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      type: type ?? this.type,
      orderId: orderId ?? this.orderId,
      userId: userId ?? this.userId,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt ?? this.createdAt,
      metadata: metadata ?? this.metadata,
    );
  }
}

class NotificationMetadata {
  final String? orderNumber;
  final double? amount;
  final String? userName;

  NotificationMetadata({
    this.orderNumber,
    this.amount,
    this.userName,
  });

  factory NotificationMetadata.fromJson(Map<String, dynamic> json) {
    return NotificationMetadata(
      orderNumber: json['orderNumber'],
      amount: json['amount']?.toDouble(),
      userName: json['userName'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'orderNumber': orderNumber,
      'amount': amount,
      'userName': userName,
    };
  }
}

enum NotificationType {
  orderPlaced('ORDER_PLACED', '🛍️ Order'),
  paymentSuccess('PAYMENT_SUCCESS', '💳 Payment'),
  deliverySuccess('DELIVERY_SUCCESS', '📦 Delivery');

  final String value;
  final String displayName;

  const NotificationType(this.value, this.displayName);

  static NotificationType fromString(String value) {
    switch (value) {
      case 'ORDER_PLACED':
        return NotificationType.orderPlaced;
      case 'PAYMENT_SUCCESS':
        return NotificationType.paymentSuccess;
      case 'DELIVERY_SUCCESS':
        return NotificationType.deliverySuccess;
      default:
        return NotificationType.orderPlaced;
    }
  }
}
