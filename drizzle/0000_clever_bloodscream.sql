CREATE TABLE "dofDocuments" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"documentType" varchar(100) NOT NULL,
	"url" text NOT NULL,
	"excerpt" text,
	"fullText" text,
	"publishedDate" timestamp NOT NULL,
	"resumenIA" text,
	"areasDetectadas" text,
	"s3Key" varchar(500),
	"scrapedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sentAlerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"documentId" integer NOT NULL,
	"sentAt" timestamp DEFAULT now() NOT NULL,
	"emailStatus" varchar(50) DEFAULT 'sent' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sentWeeklyAlerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"contentId" integer NOT NULL,
	"sentAt" timestamp DEFAULT now() NOT NULL,
	"emailStatus" varchar(50) DEFAULT 'sent' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"stripeCustomerId" varchar(255),
	"stripeSubscriptionId" varchar(255),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"currentPeriodEnd" timestamp,
	"customKeywords" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userAreas" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"areaId" varchar(100) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "webhookEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"eventType" varchar(100) NOT NULL,
	"stripeEventId" varchar(255) NOT NULL,
	"payload" text NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhookEvents_stripeEventId_unique" UNIQUE("stripeEventId")
);
--> statement-breakpoint
CREATE TABLE "weeklyContent" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"contentType" varchar(50) NOT NULL,
	"tribunal" varchar(200),
	"materia" varchar(200),
	"tesis" varchar(100),
	"excerpt" text,
	"fullText" text,
	"url" text,
	"publishedDate" timestamp,
	"weekNumber" integer NOT NULL,
	"year" integer NOT NULL,
	"resumenIA" text,
	"areasDetectadas" text,
	"relevancia" varchar(20),
	"s3Key" varchar(500),
	"scrapedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sentAlerts" ADD CONSTRAINT "sentAlerts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentAlerts" ADD CONSTRAINT "sentAlerts_documentId_dofDocuments_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."dofDocuments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentWeeklyAlerts" ADD CONSTRAINT "sentWeeklyAlerts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentWeeklyAlerts" ADD CONSTRAINT "sentWeeklyAlerts_contentId_weeklyContent_id_fk" FOREIGN KEY ("contentId") REFERENCES "public"."weeklyContent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userAreas" ADD CONSTRAINT "userAreas_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;