/**
 * High-level Push Notification Service (Stubbed / Deprecated)
 */
export const pushService = {
  requestPermission: async () => {
    // No-op after removing OneSignal
  },

  sendPushNotification: async ({ userId, title, message, url }) => {
    // No-op after removing OneSignal
    return { success: true, simulated: true, message: 'Push notifications are disabled.' };
  },

  loginUser: async (userId) => {
    // No-op after removing OneSignal
  },

  logoutUser: async () => {
    // No-op after removing OneSignal
  },

  addTags: (tags) => {
    // No-op after removing OneSignal
  },

  removeTags: (keys) => {
    // No-op after removing OneSignal
  },

  tagAbandonedCart: (hasAbandonedCart) => {
    // No-op after removing OneSignal
  },

  tagVIPCustomer: () => {
    // No-op after removing OneSignal
  },

  tagInterestedCategories: (categories) => {
    // No-op after removing OneSignal
  }
};
