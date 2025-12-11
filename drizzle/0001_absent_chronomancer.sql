CREATE TABLE `dofDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publishDate` timestamp NOT NULL,
	`title` text NOT NULL,
	`documentType` varchar(100),
	`dofUrl` text NOT NULL,
	`contentExcerpt` text,
	`aiSummary` text,
	`detectedAreas` text,
	`edition` varchar(50),
	`s3Key` text,
	`processed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dofDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sentAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentId` int NOT NULL,
	`emailId` varchar(255),
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sentAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`status` enum('pending','active','cancelled','past_due') NOT NULL DEFAULT 'pending',
	`currentPeriodEnd` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userAreas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`areaCode` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userAreas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhookEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stripeEventId` varchar(255),
	`eventType` varchar(100),
	`payload` text,
	`processed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhookEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhookEvents_stripeEventId_unique` UNIQUE(`stripeEventId`)
);
--> statement-breakpoint
ALTER TABLE `sentAlerts` ADD CONSTRAINT `sentAlerts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sentAlerts` ADD CONSTRAINT `sentAlerts_documentId_dofDocuments_id_fk` FOREIGN KEY (`documentId`) REFERENCES `dofDocuments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userAreas` ADD CONSTRAINT `userAreas_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;