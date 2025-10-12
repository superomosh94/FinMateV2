-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: FinMateDB
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `team_id` int DEFAULT NULL,
  `category` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `period` enum('daily','weekly','monthly','yearly') DEFAULT 'monthly',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `team_id` (`team_id`),
  CONSTRAINT `budgets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `budgets_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budgets`
--

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `team_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `team_id` (`team_id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (1,3,NULL,22.00,'2e2e2e','Food','2025-10-10','approved','2025-10-10 19:54:21','2025-10-10 19:54:21'),(2,3,NULL,22.00,'2e2e2e','Food','2025-10-10','approved','2025-10-10 20:02:39','2025-10-10 20:02:39'),(3,3,NULL,23.00,'22','Food','2025-10-11','pending','2025-10-10 20:13:53','2025-10-10 20:13:53'),(4,3,NULL,20.00,'lunch','Food','2025-10-10','pending','2025-10-10 20:42:20','2025-10-10 20:42:20'),(5,3,NULL,44.00,'44444','Transportation','2025-10-11','pending','2025-10-11 06:56:03','2025-10-11 06:56:03'),(6,3,NULL,25.50,'Lunch at restaurant','Food','2025-10-10','pending','2025-10-11 06:56:36','2025-10-11 06:56:36'),(7,3,NULL,45.00,'Gas station','Transportation','2025-10-09','pending','2025-10-11 06:56:36','2025-10-11 06:56:36'),(8,3,NULL,120.00,'Electricity bill','Utilities','2025-10-08','pending','2025-10-11 06:56:36','2025-10-11 06:56:36'),(9,3,NULL,65.00,'Movie tickets','Entertainment','2025-10-07','pending','2025-10-11 06:56:36','2025-10-11 06:56:36'),(10,3,NULL,89.99,'Groceries','Food','2025-10-06','pending','2025-10-11 06:56:36','2025-10-11 06:56:36'),(11,3,NULL,60.00,'lunch','Food','2025-10-11','pending','2025-10-11 06:56:59','2025-10-11 06:56:59'),(12,3,NULL,22222.00,'2e2e2e','Food','2025-10-11','pending','2025-10-11 07:14:44','2025-10-11 07:14:44'),(13,3,NULL,4444.00,'4444','Travel','2025-10-11','pending','2025-10-11 07:25:57','2025-10-11 07:25:57'),(14,3,NULL,99.00,'tcdhgc zgxhcjvkb','Other','2025-10-11','pending','2025-10-11 07:33:04','2025-10-11 07:33:04'),(15,3,NULL,22.00,'2e2e2e','Gifts & Donations','2025-10-11','pending','2025-10-11 13:31:31','2025-10-11 13:31:31'),(16,3,NULL,33.00,'lunch','Utilities','2025-10-11','pending','2025-10-11 13:40:59','2025-10-11 13:40:59'),(17,3,NULL,9.00,'2e2e2e','Other','2025-10-11','pending','2025-10-11 13:48:10','2025-10-11 13:48:10'),(18,3,NULL,9.00,'2e2e2e','Other','2025-10-11','pending','2025-10-11 13:52:20','2025-10-11 13:52:20'),(19,3,NULL,22.00,'2e2e2e','Other','2025-10-11','pending','2025-10-11 13:52:36','2025-10-11 13:52:36'),(20,3,NULL,22.00,'2e2e2e','Other','2025-10-11','pending','2025-10-11 14:03:50','2025-10-11 14:03:50'),(21,3,NULL,50.00,'2e2e2e','Travel','2025-10-11','pending','2025-10-11 14:04:08','2025-10-11 14:04:08'),(22,3,NULL,50.00,'lunch','Food & Dining','2025-10-18','pending','2025-10-11 15:50:50','2025-10-11 15:50:50'),(23,3,NULL,50.00,'lunch','Food & Dining','2025-10-18','pending','2025-10-11 15:51:22','2025-10-11 15:51:22'),(24,3,NULL,30.00,'foood','Gifts & Donations','2025-10-11','pending','2025-10-11 15:51:34','2025-10-11 15:51:34'),(25,3,NULL,25.50,'Lunch at restaurant','Food & Dining','2025-10-10','pending','2025-10-11 15:53:17','2025-10-11 15:53:17'),(26,3,NULL,45.00,'Gas station','Transportation','2025-10-09','pending','2025-10-11 15:53:17','2025-10-11 15:53:17'),(27,3,NULL,120.00,'Electricity bill','Utilities','2025-10-08','pending','2025-10-11 15:53:17','2025-10-11 15:53:17'),(28,3,NULL,65.00,'Movie tickets','Entertainment','2025-10-07','pending','2025-10-11 15:53:17','2025-10-11 15:53:17'),(29,3,NULL,89.99,'Groceries','Food & Dining','2025-10-06','pending','2025-10-11 15:53:17','2025-10-11 15:53:17'),(30,3,NULL,40.00,'foood','Food & Dining','2025-10-11','pending','2025-10-11 15:57:45','2025-10-11 15:57:45'),(31,3,NULL,40.00,'foood','Food & Dining','2025-10-11','pending','2025-10-11 16:03:32','2025-10-11 16:03:32'),(32,3,NULL,90.00,'3333','Other','2025-10-11','pending','2025-10-11 16:03:53','2025-10-11 16:03:53');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lent_money`
--

DROP TABLE IF EXISTS `lent_money`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lent_money` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lender_id` int NOT NULL,
  `borrower_name` varchar(100) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `lent_date` date NOT NULL,
  `expected_return_date` date DEFAULT NULL,
  `returned_date` date DEFAULT NULL,
  `status` enum('lent','returned','overdue') DEFAULT 'lent',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lender_id` (`lender_id`),
  CONSTRAINT `lent_money_ibfk_1` FOREIGN KEY (`lender_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lent_money`
--

LOCK TABLES `lent_money` WRITE;
/*!40000 ALTER TABLE `lent_money` DISABLE KEYS */;
/*!40000 ALTER TABLE `lent_money` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'user_manage','Manage users','2025-10-11 06:28:39'),(2,'team_manage','Manage teams','2025-10-11 06:28:39'),(3,'budget_manage','Manage budgets','2025-10-11 06:28:39'),(4,'expense_manage','Manage expenses','2025-10-11 06:28:39'),(5,'savings_manage','Manage savings','2025-10-11 06:28:39'),(6,'report_view','View reports','2025-10-11 06:28:39'),(7,'system_manage','Manage system settings','2025-10-11 06:28:39');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `planned_expenses`
--

DROP TABLE IF EXISTS `planned_expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planned_expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `team_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(50) NOT NULL,
  `planned_date` date NOT NULL,
  `status` enum('planned','in_progress','completed','cancelled') DEFAULT 'planned',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `team_id` (`team_id`),
  CONSTRAINT `planned_expenses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `planned_expenses_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `planned_expenses`
--

LOCK TABLES `planned_expenses` WRITE;
/*!40000 ALTER TABLE `planned_expenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `planned_expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_permission` (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=901 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,1,'2025-10-11 06:28:39'),(2,1,2,'2025-10-11 06:28:39'),(3,1,3,'2025-10-11 06:28:39'),(4,1,4,'2025-10-11 06:28:39'),(5,1,5,'2025-10-11 06:28:39'),(6,1,6,'2025-10-11 06:28:39'),(7,1,7,'2025-10-11 06:28:39'),(8,2,1,'2025-10-11 06:28:39'),(9,2,2,'2025-10-11 06:28:39'),(10,2,3,'2025-10-11 06:28:39'),(11,2,4,'2025-10-11 06:28:39'),(12,2,5,'2025-10-11 06:28:39'),(13,2,6,'2025-10-11 06:28:39'),(14,3,2,'2025-10-11 06:28:39'),(15,3,3,'2025-10-11 06:28:39'),(16,3,4,'2025-10-11 06:28:39'),(17,3,5,'2025-10-11 06:28:39'),(18,3,6,'2025-10-11 06:28:39'),(19,4,4,'2025-10-11 06:28:39'),(20,4,5,'2025-10-11 06:28:39'),(21,4,6,'2025-10-11 06:28:39'),(22,5,3,'2025-10-11 06:28:39'),(23,5,4,'2025-10-11 06:28:39'),(24,5,5,'2025-10-11 06:28:39'),(25,5,6,'2025-10-11 06:28:39');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'super_admin','Full system access','2025-10-09 21:30:07','2025-10-09 21:30:07'),(2,'admin','Administrative access','2025-10-09 21:30:07','2025-10-09 21:30:07'),(3,'team_leader','Team leader access','2025-10-09 21:30:07','2025-10-09 21:30:07'),(4,'team_member','Team member access','2025-10-09 21:30:07','2025-10-09 21:30:07'),(5,'individual_user','Individual user access','2025-10-09 21:30:07','2025-10-09 21:30:07'),(6,'superadmin','Full system access','2025-10-10 13:31:11','2025-10-10 13:31:11');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `savings`
--

DROP TABLE IF EXISTS `savings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `savings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `goal_name` varchar(100) NOT NULL,
  `target_amount` decimal(10,2) NOT NULL,
  `current_amount` decimal(10,2) DEFAULT '0.00',
  `target_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `savings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `savings`
--

LOCK TABLES `savings` WRITE;
/*!40000 ALTER TABLE `savings` DISABLE KEYS */;
/*!40000 ALTER TABLE `savings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `savings_goals`
--

DROP TABLE IF EXISTS `savings_goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `savings_goals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `target_amount` decimal(10,2) NOT NULL,
  `current_amount` decimal(10,2) DEFAULT '0.00',
  `target_date` date DEFAULT NULL,
  `status` enum('active','completed','cancelled') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `savings_goals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `savings_goals`
--

LOCK TABLES `savings_goals` WRITE;
/*!40000 ALTER TABLE `savings_goals` DISABLE KEYS */;
/*!40000 ALTER TABLE `savings_goals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `team_leader_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_teams_leader` (`team_leader_id`),
  CONSTRAINT `fk_teams_leader` FOREIGN KEY (`team_leader_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_preferences`
--

DROP TABLE IF EXISTS `user_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `email_notifications` tinyint(1) DEFAULT '1',
  `push_notifications` tinyint(1) DEFAULT '1',
  `monthly_report` tinyint(1) DEFAULT '1',
  `expense_reminders` tinyint(1) DEFAULT '1',
  `budget_alerts` tinyint(1) DEFAULT '1',
  `team_announcements` tinyint(1) DEFAULT '1',
  `expense_approval_updates` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user` (`user_id`),
  CONSTRAINT `user_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_preferences`
--

LOCK TABLES `user_preferences` WRITE;
/*!40000 ALTER TABLE `user_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `role_id` int NOT NULL,
  `team_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  KEY `team_id` (`team_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'superadmin','superadmin@finmate.com','$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu','Super','Admin',6,NULL,1,'2025-10-09 21:30:08','2025-10-10 13:31:11'),(2,'admin','admin@finmate.com','$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu','System','Admin',2,NULL,1,'2025-10-09 21:30:08','2025-10-10 07:31:58'),(3,'user1','user1@finmate.com','$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu','John','Doe',5,NULL,1,'2025-10-09 21:30:08','2025-10-10 07:31:58'),(4,'senior','senior@1.com','$2a$12$mZ27Jih89La0mxZaW4WqselmIfij29VXoHMmwZ9TbJUCu4gZZwGza','martin','omondo',5,NULL,1,'2025-10-10 08:29:53','2025-10-10 08:29:53'),(5,'teamleader','teamleader@finmate.com','$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu','Team','Leader',3,NULL,1,'2025-10-10 13:31:11','2025-10-10 13:31:11'),(6,'teammember','teammember@finmate.com','$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu','Team','Member',4,NULL,1,'2025-10-10 13:31:11','2025-10-10 13:31:11');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-11 19:20:28
