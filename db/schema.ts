import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const profiles = sqliteTable('profiles', {
  userId: text('user_id').primaryKey(),
  displayName: text('display_name').notNull().default(''),
  preferences: text('preferences').notNull().default('{"favorites":[],"home":null}'),
  updatedAt: text('updated_at').notNull(),
});
export const announcements = sqliteTable('announcements', {
  id: text('id').primaryKey(), title: text('title').notNull(), body: text('body').notNull(),
  kind: text('kind').notNull().default('info'), expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(), authorId: text('author_id').notNull(),
});
export const audit = sqliteTable('audit', {
  id: text('id').primaryKey(), action: text('action').notNull(), createdAt: text('created_at').notNull(),
});
export const notificationSettings = sqliteTable('notification_settings', {
 userId:text('user_id').primaryKey(), preferences:text('preferences').notNull(), updatedAt:text('updated_at').notNull(),
});
export const pushSubscriptions = sqliteTable('push_subscriptions', {
 id:text('id').primaryKey(), userId:text('user_id').notNull(), subscription:text('subscription').notNull(), updatedAt:text('updated_at').notNull(), lastTestAt:text('last_test_at'),lastCheckedAt:text('last_checked_at'),
});
export const notificationDeliveries = sqliteTable('notification_deliveries', {
 id:text('id').primaryKey(), subscriptionId:text('subscription_id').notNull(), eventKey:text('event_key').notNull(), createdAt:text('created_at').notNull(), sentAt:text('sent_at'),
});
export const notificationRuntime = sqliteTable('notification_runtime', {
 key:text('key').primaryKey(), value:text('value').notNull(), updatedAt:text('updated_at').notNull(),
});
