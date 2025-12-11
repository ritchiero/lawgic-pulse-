CREATE TABLE `sentWeeklyAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentId` int NOT NULL,
	`emailId` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sentWeeklyAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weeklyContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentType` varchar(50) NOT NULL,
	`title` text NOT NULL,
	`registrationNumber` varchar(100),
	`tribunal` text,
	`epoch` varchar(50),
	`contentText` text,
	`excerpt` text,
	`sourceUrl` text,
	`publicationDate` timestamp,
	`detectedAreas` text,
	`aiSummary` text,
	`relevanceScore` int,
	`s3Key` text,
	`processed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`weekNumber` int NOT NULL,
	`year` int NOT NULL,
	CONSTRAINT `weeklyContent_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sentWeeklyAlerts` ADD CONSTRAINT `sentWeeklyAlerts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sentWeeklyAlerts` ADD CONSTRAINT `sentWeeklyAlerts_contentId_weeklyContent_id_fk` FOREIGN KEY (`contentId`) REFERENCES `weeklyContent`(`id`) ON DELETE cascade ON UPDATE no action;