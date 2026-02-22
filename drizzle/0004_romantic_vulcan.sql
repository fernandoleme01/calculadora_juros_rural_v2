ALTER TABLE `users` MODIFY COLUMN `plano` enum('free','standard','premium','supreme','admin') NOT NULL DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(128);