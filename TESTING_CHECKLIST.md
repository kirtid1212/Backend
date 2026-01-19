# Notification System Testing Checklist

## ✅ Pre-Testing Setup

- [ ] Backend server is running (`npm run dev`)
- [ ] MongoDB is connected
- [ ] Firebase service account JSON is configured
- [ ] Flutter web app is running (`flutter run -d chrome`)
- [ ] Admin is logged in
- [ ] FCM token is registered
- [ ] Browser notifications are allowed

---

## 🧪 Test Cases

### 1. FCM Token Registration

**Steps:**
1. Open admin dashboard
2. Check browser console for FCM token
3. Open MongoDB and check `admintokens` collection

**Expected Results:**
- [ ] FCM token appears in console
- [ ] Token is saved in database with `isActive: true`
- [ ] Device info is captured

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- Notes: ___________

---

### 2. ORDER_PLACED Notification (Foreground)

**Steps:**
1. Keep admin dashboard open and focused
2. Create a new order via API or user app
3. Observe the dashboard

**Expected Results:**
- [ ] Toast/snackbar appears with order details
- [ ] Notification bell badge increases by 1
- [ ] Notification appears in notifications list
- [ ] Notification is marked as unread (blue background)
- [ ] Console shows "Foreground message received"

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- Toast appeared: ⬜ Yes / ⬜ No
- Badge updated: ⬜ Yes / ⬜ No
- In list: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 3. PAYMENT_SUCCESS Notification (Background)

**Steps:**
1. Open admin dashboard
2. Switch to another browser tab
3. Update order status to "processing" via API
4. Check for browser notification

**Expected Results:**
- [ ] Browser push notification appears
- [ ] Notification shows correct title and message
- [ ] Clicking notification focuses dashboard tab
- [ ] Notification appears in list when dashboard is opened
- [ ] Badge count is updated

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- Push notification appeared: ⬜ Yes / ⬜ No
- Click action worked: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 4. DELIVERY_SUCCESS Notification (Terminated)

**Steps:**
1. Close all admin dashboard tabs
2. Update order status to "delivered" via API
3. Check for browser notification
4. Click the notification

**Expected Results:**
- [ ] Browser push notification appears even when app is closed
- [ ] Clicking notification opens admin dashboard
- [ ] Dashboard opens to notifications page or home
- [ ] Notification is visible in the list
- [ ] Badge shows correct count

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- Push appeared when closed: ⬜ Yes / ⬜ No
- Dashboard opened: ⬜ Yes / ⬜ No
- Notification in list: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 5. Duplicate Notification Prevention

**Steps:**
1. Note an existing order ID from database
2. Try to create another ORDER_PLACED notification for same order
3. Check notifications list and database

**Expected Results:**
- [ ] Only one notification exists for that order+type
- [ ] Backend logs show "Notification already exists"
- [ ] No duplicate in database
- [ ] No duplicate push sent

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- Duplicates prevented: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 6. Notification Filters

**Steps:**
1. Create notifications of all three types
2. Click "All" filter
3. Click "🛍️ Order" filter
4. Click "💳 Payment" filter
5. Click "📦 Delivery" filter

**Expected Results:**
- [ ] "All" shows all notifications
- [ ] "Order" shows only ORDER_PLACED
- [ ] "Payment" shows only PAYMENT_SUCCESS
- [ ] "Delivery" shows only DELIVERY_SUCCESS
- [ ] Filter chips highlight correctly

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- All filter: ⬜ Works / ⬜ Broken
- Order filter: ⬜ Works / ⬜ Broken
- Payment filter: ⬜ Works / ⬜ Broken
- Delivery filter: ⬜ Works / ⬜ Broken
- Notes: ___________

---

### 7. Mark Single Notification as Read

**Steps:**
1. Find an unread notification (blue background)
2. Click on it
3. Observe changes

**Expected Results:**
- [ ] Notification background changes to grey
- [ ] Blue dot disappears
- [ ] Badge count decreases by 1
- [ ] Database updated (`isRead: true`)
- [ ] Snackbar shows navigation message

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- Visual changed: ⬜ Yes / ⬜ No
- Badge decreased: ⬜ Yes / ⬜ No
- Database updated: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 8. Mark All as Read

**Steps:**
1. Ensure there are multiple unread notifications
2. Click "Mark all as read" button
3. Confirm in dialog
4. Observe changes

**Expected Results:**
- [ ] Confirmation dialog appears
- [ ] All notifications change to read state
- [ ] Badge count becomes 0
- [ ] Success snackbar appears
- [ ] Database updated for all

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- Dialog appeared: ⬜ Yes / ⬜ No
- All marked read: ⬜ Yes / ⬜ No
- Badge cleared: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 9. Delete Notification (Swipe)

**Steps:**
1. Swipe a notification from right to left
2. Complete the swipe gesture
3. Check list and database

**Expected Results:**
- [ ] Red delete background appears during swipe
- [ ] Notification is removed from list
- [ ] Snackbar confirms deletion
- [ ] Notification deleted from database
- [ ] Badge count updates if it was unread

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- Swipe worked: ⬜ Yes / ⬜ No
- Deleted from list: ⬜ Yes / ⬜ No
- Deleted from DB: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 10. Pull to Refresh

**Steps:**
1. Open notifications screen
2. Pull down from top
3. Release to refresh

**Expected Results:**
- [ ] Loading indicator appears
- [ ] Notifications list refreshes
- [ ] Badge count updates
- [ ] New notifications appear if any

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- Refresh worked: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 11. Auto-Refresh (30 seconds)

**Steps:**
1. Open notifications screen
2. Wait 30 seconds without interaction
3. Create a new notification in background
4. Observe if it appears automatically

**Expected Results:**
- [ ] List refreshes every 30 seconds
- [ ] New notifications appear automatically
- [ ] Badge updates automatically
- [ ] No user interaction needed

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- Auto-refresh worked: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 12. Empty State

**Steps:**
1. Delete all notifications or use fresh database
2. Open notifications screen
3. Try different filters

**Expected Results:**
- [ ] Empty state icon and message appear
- [ ] Message changes based on filter
- [ ] No errors in console
- [ ] UI is centered and clear

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- Empty state shown: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 13. Error Handling (Backend Down)

**Steps:**
1. Stop backend server
2. Try to refresh notifications
3. Try to mark as read

**Expected Results:**
- [ ] Error state appears with message
- [ ] Retry button is shown
- [ ] No app crash
- [ ] Console shows error logs

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- Error handled gracefully: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 14. Test Notification API

**Steps:**
1. Get FCM token from browser console
2. Use Postman to call `/api/v1/admin/notifications/test`
3. Send token in request body

**Expected Results:**
- [ ] API returns success
- [ ] Test notification appears in browser
- [ ] Notification has test message
- [ ] Backend logs show success

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- API succeeded: ⬜ Yes / ⬜ No
- Notification received: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 15. Token Refresh

**Steps:**
1. Register token
2. Clear browser cache/data
3. Reload admin dashboard
4. Check if new token is registered

**Expected Results:**
- [ ] New token is generated
- [ ] New token is registered in database
- [ ] Old token is deactivated or replaced
- [ ] Notifications still work

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- New token registered: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 16. Multiple Notification Types in Sequence

**Steps:**
1. Create an order (ORDER_PLACED)
2. Update to processing (PAYMENT_SUCCESS)
3. Update to delivered (DELIVERY_SUCCESS)
4. Check notifications list

**Expected Results:**
- [ ] All three notifications appear
- [ ] Each has correct type and icon
- [ ] No duplicates
- [ ] Chronological order (newest first)
- [ ] All push notifications received

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- All three received: ⬜ Yes / ⬜ No
- Correct order: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 17. Notification Metadata

**Steps:**
1. Create a notification
2. Check notification details in UI
3. Verify metadata is displayed

**Expected Results:**
- [ ] Order number is shown
- [ ] Amount is displayed correctly
- [ ] User name appears
- [ ] All metadata is formatted properly

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- Metadata displayed: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 18. Pagination (if implemented)

**Steps:**
1. Create 25+ notifications
2. Check if pagination appears
3. Navigate through pages

**Expected Results:**
- [ ] Only 20 notifications per page
- [ ] Pagination controls appear
- [ ] Can navigate to next/previous page
- [ ] Page numbers are correct

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- Pagination works: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 19. Service Worker Registration

**Steps:**
1. Open browser DevTools
2. Go to Application > Service Workers
3. Check registration status

**Expected Results:**
- [ ] Service worker is registered
- [ ] Status shows "activated and running"
- [ ] Scope is correct
- [ ] No errors in console

**Actual Results:**
- Status: ⬜ Pass / ⬜ Fail
- SW registered: ⬜ Yes / ⬜ No
- Notes: ___________

---

### 20. Cross-Browser Testing

**Browsers to test:**
- [ ] Chrome (Desktop)
- [ ] Firefox (Desktop)
- [ ] Edge (Desktop)
- [ ] Safari (if available)

**For each browser, verify:**
- [ ] Notifications permission request
- [ ] Foreground notifications
- [ ] Background notifications
- [ ] Service worker registration
- [ ] UI renders correctly

**Actual Results:**
- Chrome: ⬜ Pass / ⬜ Fail
- Firefox: ⬜ Pass / ⬜ Fail
- Edge: ⬜ Pass / ⬜ Fail
- Safari: ⬜ Pass / ⬜ Fail
- Notes: ___________

---

## 📊 Summary

**Total Tests:** 20
**Passed:** _____
**Failed:** _____
**Pass Rate:** _____%

**Critical Issues Found:**
1. ___________
2. ___________
3. ___________

**Minor Issues Found:**
1. ___________
2. ___________

**Recommendations:**
1. ___________
2. ___________

**Tested By:** ___________
**Date:** ___________
**Environment:** Development / Staging / Production

---

## 🔍 Additional Checks

### Performance
- [ ] Notifications load within 2 seconds
- [ ] No memory leaks after 100+ notifications
- [ ] Smooth scrolling in notifications list
- [ ] No lag when marking all as read

### Security
- [ ] Admin authentication required for all endpoints
- [ ] FCM tokens are stored securely
- [ ] No sensitive data in push notifications
- [ ] HTTPS used in production

### Accessibility
- [ ] Screen reader can read notifications
- [ ] Keyboard navigation works
- [ ] Color contrast is sufficient
- [ ] Focus indicators are visible

---

## ✅ Sign-off

**Developer:** ___________
**QA Tester:** ___________
**Product Manager:** ___________
**Date:** ___________

**Status:** ⬜ Approved for Production / ⬜ Needs Fixes
