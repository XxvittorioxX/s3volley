CREATE TABLE `group_standings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_name` varchar(100) NOT NULL,
	`team_id` int NOT NULL,
	`position` int NOT NULL,
	`played` int DEFAULT 0,
	`won` int DEFAULT 0,
	`drawn` int DEFAULT 0,
	`lost` int DEFAULT 0,
	`points` int DEFAULT 0,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `group_standings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` varchar(100) NOT NULL,
	`team1_id` int,
	`team2_id` int,
	`winner_id` int,
	`score1` int,
	`score2` int,
	`round` int,
	`group_name` varchar(100),
	`phase` varchar(20) NOT NULL,
	`category` varchar(50) NOT NULL,
	`field` int,
	`match_date` timestamp,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`team_name` varchar(255) NOT NULL,
	`category` varchar(50) NOT NULL,
	`coach_name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournament_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`data` json NOT NULL,
	`timestamp` timestamp DEFAULT CURRENT_TIMESTAMP,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tournament_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournament_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`winners` json NOT NULL,
	`group_standings` json NOT NULL,
	`all_matches` json NOT NULL,
	`tournament_complete` boolean DEFAULT false,
	`timestamp` timestamp NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `tournament_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `posts` MODIFY COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `group_standings` ADD CONSTRAINT `group_standings_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_team1_id_teams_id_fk` FOREIGN KEY (`team1_id`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_team2_id_teams_id_fk` FOREIGN KEY (`team2_id`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_winner_id_teams_id_fk` FOREIGN KEY (`winner_id`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;