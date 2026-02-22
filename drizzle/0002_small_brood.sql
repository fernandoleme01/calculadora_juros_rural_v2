ALTER TABLE `users` ADD `plano` enum('free','pro','admin') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `planoExpiracao` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `calculosRealizados` int DEFAULT 0 NOT NULL;