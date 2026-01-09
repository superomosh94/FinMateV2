-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: mysql-11a9128f-omondo906-c7d1.d.aivencloud.com    Database: defaultdb
-- ------------------------------------------------------
-- Server version	8.0.35

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
-- Table structure for table `admin_activities`
--

DROP TABLE IF EXISTS `admin_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `admin_activities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_activities`
--

LOCK TABLES `admin_activities` WRITE;
/*!40000 ALTER TABLE `admin_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_logs_user_id` (`user_id`),
  KEY `idx_audit_logs_action` (`action`),
  KEY `idx_audit_logs_created_at` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

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
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `period` enum('daily','weekly','monthly','yearly') COLLATE utf8mb4_unicode_ci DEFAULT 'monthly',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `team_id` (`team_id`),
  CONSTRAINT `budgets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `budgets_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budgets`
--

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
INSERT INTO `budgets` VALUES (1,1,NULL,'Food & Dining',500.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(2,1,NULL,'Transportation',300.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(3,1,NULL,'Entertainment',200.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(4,2,NULL,'Food & Dining',400.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(5,2,NULL,'Utilities',250.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(6,2,NULL,'Travel',600.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(7,3,NULL,'Food & Dining',350.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(8,3,NULL,'Shopping',150.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(9,3,NULL,'Healthcare',100.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(10,4,NULL,'Food & Dining',450.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(11,4,NULL,'Transportation',200.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(12,4,NULL,'Entertainment',150.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(13,5,NULL,'Food & Dining',600.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(14,5,NULL,'Team Expenses',1000.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(15,5,NULL,'Travel',800.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(16,6,NULL,'Food & Dining',300.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(17,6,NULL,'Transportation',150.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(18,6,NULL,'Personal Care',100.00,'monthly','2025-01-01','2025-12-31','2025-10-14 19:12:06','2025-10-14 19:12:06'),(19,3,NULL,'Transportation',300.00,'daily','2025-10-13','2025-10-14','2025-10-14 19:12:06','2025-10-14 19:12:06'),(20,3,NULL,'Food & Dining',22.00,'daily','2025-10-13','2025-10-14','2025-10-14 19:12:06','2025-10-14 19:12:06'),(21,7,NULL,'Other',4000.00,'monthly','2025-10-15','2025-11-15','2025-10-15 05:04:44','2025-10-15 05:04:44'),(22,9,NULL,'Food & Dining',100000.00,'monthly','2025-10-17','2027-09-09','2025-10-17 15:24:36','2025-10-17 15:24:36');
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
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `team_id` (`team_id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (1,1,NULL,45.50,'Business lunch meeting','Food & Dining','2025-10-01','approved','2025-10-14 19:12:07','2025-10-14 19:12:07'),(2,1,NULL,120.00,'Flight ticket','Travel','2025-10-02','approved','2025-10-14 19:12:07','2025-10-14 19:12:07'),(3,1,NULL,89.99,'Office supplies','Other','2025-10-03','pending','2025-10-14 19:12:07','2025-10-14 19:12:07'),(4,2,NULL,25.00,'Team lunch','Food & Dining','2025-10-01','approved','2025-10-14 19:12:07','2025-10-14 19:12:07'),(5,2,NULL,65.00,'Software subscription','Other','2025-10-02','approved','2025-10-14 19:12:07','2025-10-14 19:12:07'),(6,2,NULL,150.00,'Conference ticket','Education','2025-10-03','pending','2025-10-14 19:12:07','2025-10-14 19:12:07'),(7,3,NULL,15.75,'Coffee and snacks','Food & Dining','2025-10-01','approved','2025-10-14 19:12:07','2025-10-14 19:12:07'),(8,3,NULL,45.00,'Gas for car','Transportation','2025-10-02','approved','2025-10-14 19:12:07','2025-10-14 19:12:07'),(9,3,NULL,75.00,'Movie night','Entertainment','2025-10-03','pending','2025-10-14 19:12:07','2025-10-14 19:12:07'),(10,4,NULL,32.50,'Restaurant dinner','Food & Dining','2025-10-01','approved','2025-10-14 19:12:07','2025-10-14 19:12:07'),(11,4,NULL,22.00,'Bus pass','Transportation','2025-10-02','approved','2025-10-14 19:12:07','2025-10-14 19:12:07'),(12,4,NULL,50.00,'Gym membership','Health & Fitness','2025-10-03','pending','2025-10-14 19:12:07','2025-10-14 19:12:07'),(13,5,NULL,120.00,'Team building activity','Entertainment','2025-10-01','approved','2025-10-14 19:12:07','2025-10-14 19:12:07'),(14,5,NULL,300.00,'Project materials','Other','2025-10-02','approved','2025-10-14 19:12:07','2025-10-14 19:12:07'),(15,5,NULL,85.00,'Client dinner','Food & Dining','2025-10-03','pending','2025-10-14 19:12:07','2025-10-14 19:12:07'),(16,6,NULL,18.50,'Lunch with colleagues','Food & Dining','2025-10-01','approved','2025-10-14 19:12:07','2025-10-14 19:12:07'),(17,6,NULL,35.00,'Taxi ride','Transportation','2025-10-02','approved','2025-10-14 19:12:07','2025-10-14 19:12:07'),(18,6,NULL,42.00,'Team contribution','Other','2025-10-03','pending','2025-10-14 19:12:07','2025-10-14 19:12:07'),(19,1,NULL,2500.00,'Groceries shopping','Food','2025-10-01','pending','2025-10-14 19:12:07','2025-10-14 19:12:07'),(20,1,NULL,150.00,'Matatu fare','Transport','2025-10-02','pending','2025-10-14 19:12:07','2025-10-14 19:12:07'),(21,1,NULL,800.00,'Electricity bill','Utilities','2025-10-03','pending','2025-10-14 19:12:07','2025-10-14 19:12:07'),(22,1,NULL,500.00,'Movie night','Entertainment','2025-10-04','pending','2025-10-14 19:12:07','2025-10-14 19:12:07'),(23,1,NULL,300.00,'Office supplies','Other','2025-10-05','pending','2025-10-14 19:12:07','2025-10-14 19:12:07'),(24,3,NULL,1500.00,'Test expense','Food','2025-10-12','pending','2025-10-14 19:12:07','2025-10-14 19:12:07'),(25,3,NULL,23.00,'lunch','Transportation','2025-10-13','pending','2025-10-14 19:12:07','2025-10-14 19:12:07'),(26,3,NULL,34.00,'lunch','Food & Dining','2025-10-13','pending','2025-10-14 19:12:07','2025-10-14 19:12:07'),(27,7,NULL,70.00,'Lunch','Food & Dining','2025-10-14','pending','2025-10-14 19:29:01','2025-10-14 19:29:01'),(28,7,NULL,70.00,'Supper','Food & Dining','2025-10-14','pending','2025-10-14 19:29:37','2025-10-14 19:29:37'),(29,7,NULL,40.00,'Sugar','Other','2025-10-14','pending','2025-10-14 19:30:19','2025-10-14 19:30:19'),(30,7,NULL,40.00,'snack kangumu, pini','Food & Dining','2025-10-14','pending','2025-10-14 19:30:40','2025-10-15 05:31:30'),(31,7,NULL,300.00,'Orimo Earphones','Entertainment','2025-10-05','pending','2025-10-15 05:26:17','2025-10-15 05:26:17'),(32,7,NULL,230.00,'Kaduda battery','Other','2025-10-06','pending','2025-10-15 05:28:54','2025-10-15 05:28:54'),(33,7,NULL,250.00,'mifi payment','Utilities','2025-10-13','pending','2025-10-15 05:30:17','2025-10-15 05:30:17'),(34,7,NULL,500.00,'two sweatpants','Other','2025-10-13','pending','2025-10-15 05:37:25','2025-10-15 05:37:25'),(35,7,NULL,50.00,'1 pair socks','Other','2025-10-13','pending','2025-10-15 05:37:56','2025-10-15 05:37:56'),(36,7,NULL,70.00,'Lunch','Food & Dining','2025-10-15','pending','2025-10-15 11:05:06','2025-10-15 17:58:20'),(38,8,NULL,70.00,'lunch','Food & Dining','2025-10-15','pending','2025-10-15 16:17:29','2025-10-15 16:17:29'),(39,7,NULL,70.00,'supper','Food & Dining','2025-10-15','pending','2025-10-15 17:46:37','2025-10-15 17:46:37'),(40,8,NULL,90.00,'bike','Entertainment','2025-10-15','pending','2025-10-15 19:07:39','2025-10-15 19:07:39'),(41,8,NULL,65.00,'predator','Food & Dining','2025-10-15','pending','2025-10-15 19:08:29','2025-10-15 19:08:29'),(42,8,NULL,70.00,'supper','Food & Dining','2025-10-15','pending','2025-10-15 19:08:59','2025-10-15 19:08:59'),(43,7,NULL,90.00,'Lunch ','Food & Dining','2025-10-16','pending','2025-10-16 11:18:03','2025-10-16 11:18:03'),(44,8,NULL,90.00,'lunch','Food & Dining','2025-10-16','pending','2025-10-16 12:42:30','2025-10-16 12:42:50'),(45,8,NULL,35.00,'breakfast','Food & Dining','2025-10-16','pending','2025-10-16 12:43:30','2025-10-16 12:43:30'),(46,7,NULL,80.00,'supper','Food & Dining','2025-10-16','pending','2025-10-16 20:29:17','2025-10-16 20:29:17'),(47,7,NULL,90.00,'lunch','Food & Dining','2025-10-17','pending','2025-10-17 12:04:31','2025-10-17 12:04:31'),(48,7,NULL,20.00,'data ','Utilities','2025-10-17','pending','2025-10-17 12:05:24','2025-10-17 12:05:24'),(49,8,NULL,25.00,'breakfast','Food & Dining','2025-10-17','pending','2025-10-17 12:09:15','2025-10-17 12:09:15'),(51,8,NULL,70.00,'lunch','Food & Dining','2025-10-17','pending','2025-10-17 12:09:51','2025-10-17 12:09:51'),(52,8,NULL,20.00,'credit','Other','2025-10-17','pending','2025-10-17 12:11:38','2025-10-17 12:11:38'),(53,9,NULL,10.00,'personal expense','Utilities','7777-07-07','pending','2025-10-17 14:48:53','2025-10-17 14:48:53'),(55,7,NULL,70.00,'Supper','Food & Dining','2025-10-17','pending','2025-10-17 16:52:59','2025-10-17 16:52:59'),(56,7,NULL,20.00,'Mutura','Food & Dining','2025-10-17','pending','2025-10-17 16:53:20','2025-10-17 16:53:20'),(57,8,NULL,70.00,'supper','Food & Dining','2025-10-17','pending','2025-10-17 20:11:40','2025-10-17 20:11:40'),(58,8,NULL,20.00,'mutura','Food & Dining','2025-10-17','pending','2025-10-17 20:12:11','2025-10-17 20:12:11'),(59,7,NULL,70.00,'Lunch ','Food & Dining','2025-10-18','pending','2025-10-18 11:27:51','2025-10-18 11:27:51'),(60,7,NULL,90.00,'Supper ','Food & Dining','2025-10-18','pending','2025-10-18 16:45:28','2025-10-18 16:45:28'),(61,7,NULL,20.00,'Mutura ','Food & Dining','2025-10-18','pending','2025-10-18 16:45:48','2025-10-18 16:45:48'),(62,7,NULL,20.00,'Data','Utilities','2025-10-18','pending','2025-10-18 16:46:40','2025-10-18 16:46:40'),(63,7,NULL,70.00,'Lunch ','Food & Dining','2025-10-19','pending','2025-10-19 19:46:20','2025-10-19 19:46:20'),(64,7,NULL,65.00,'Energy drink ','Food & Dining','2025-10-19','pending','2025-10-19 19:46:40','2025-10-19 19:46:40'),(65,7,NULL,100.00,'Supper','Food & Dining','2025-10-19','pending','2025-10-19 19:46:59','2025-10-19 19:46:59'),(66,7,NULL,30.00,'breako escot','Food & Dining','2025-10-20','pending','2025-10-20 17:42:40','2025-10-20 17:42:40'),(67,7,NULL,90.00,'lunch','Food & Dining','2025-10-20','pending','2025-10-20 17:42:57','2025-10-20 17:42:57'),(68,7,NULL,70.00,'Supper','Food & Dining','2025-10-20','pending','2025-10-20 17:43:14','2025-10-20 17:43:14'),(69,7,NULL,20.00,'airtime','Utilities','2025-10-20','pending','2025-10-20 17:44:25','2025-10-20 17:44:25'),(70,7,NULL,70.00,'lunch','Food & Dining','2025-10-21','pending','2025-10-21 17:03:12','2025-10-21 17:03:12'),(71,7,NULL,70.00,'Supper','Food & Dining','2025-10-21','pending','2025-10-21 17:03:44','2025-10-21 17:03:44'),(72,7,NULL,20.00,'mutura','Food & Dining','2025-10-21','pending','2025-10-21 17:04:14','2025-10-21 17:04:14'),(73,7,NULL,70.00,'Lunch','Food & Dining','2025-10-22','pending','2025-10-22 17:46:22','2025-10-22 17:46:22'),(74,7,NULL,70.00,'supper','Food & Dining','2025-10-22','pending','2025-10-22 17:46:45','2025-10-22 17:46:45'),(75,7,NULL,20.00,'mutura','Food & Dining','2025-10-22','pending','2025-10-22 17:51:02','2025-10-22 17:51:02'),(79,12,NULL,30.00,'lunch','Food & Dining','2025-10-28','pending','2025-10-28 14:07:35','2025-10-28 14:07:35');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `incomes`
--

DROP TABLE IF EXISTS `incomes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incomes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text,
  `source` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `received_date` date NOT NULL,
  `status` enum('pending','cleared','cancelled') DEFAULT 'cleared',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `incomes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `incomes`
--

LOCK TABLES `incomes` WRITE;
/*!40000 ALTER TABLE `incomes` DISABLE KEYS */;
INSERT INTO `incomes` VALUES (1,7,'Dad',1000.00,NULL,'Bonus','Gift','2025-10-15','cleared','2025-10-17 06:11:24','2025-10-17 06:11:24'),(2,7,'Ngetich',100.00,NULL,'Freelance','One-time Payment','2025-10-15','cleared','2025-10-17 06:12:05','2025-10-17 06:12:05'),(5,7,'dad',1000.00,NULL,'Other','One-time Payment','2025-10-20','cleared','2025-10-20 17:43:46','2025-10-20 17:43:46'),(6,12,'salary',910.00,NULL,'Salary','Regular Income','2025-10-28','cleared','2025-10-28 14:14:05','2025-10-28 14:14:05');
/*!40000 ALTER TABLE `incomes` ENABLE KEYS */;
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
  `borrower_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `lent_date` date NOT NULL,
  `expected_return_date` date DEFAULT NULL,
  `returned_date` date DEFAULT NULL,
  `status` enum('lent','returned','overdue') COLLATE utf8mb4_unicode_ci DEFAULT 'lent',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lender_id` (`lender_id`),
  CONSTRAINT `lent_money_ibfk_1` FOREIGN KEY (`lender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lent_money`
--

LOCK TABLES `lent_money` WRITE;
/*!40000 ALTER TABLE `lent_money` DISABLE KEYS */;
INSERT INTO `lent_money` VALUES (1,1,'John Smith',200.00,'2025-09-15','2025-10-15',NULL,'lent','Loan for emergency car repair','2025-10-14 19:12:07','2025-10-14 19:12:07'),(2,1,'Sarah Johnson',150.00,'2025-09-20','2025-10-20',NULL,'lent','Help with medical bills','2025-10-14 19:12:07','2025-10-14 19:12:07'),(3,1,'Mike Brown',300.00,'2025-10-01','2025-11-01',NULL,'lent','Business startup help','2025-10-14 19:12:07','2025-10-14 19:12:07'),(4,2,'Lisa Davis',100.00,'2025-09-25','2025-10-25',NULL,'lent','Short term loan','2025-10-14 19:12:07','2025-10-14 19:12:07'),(5,2,'David Wilson',250.00,'2025-10-05','2025-11-05',NULL,'lent','Help with rent','2025-10-14 19:12:07','2025-10-14 19:12:07'),(6,2,'Emily Clark',180.00,'2025-10-10','2025-11-10',NULL,'lent','Education expenses','2025-10-14 19:12:07','2025-10-14 19:12:07'),(7,3,'Robert Taylor',80.00,'2025-09-30','2025-10-30',NULL,'lent','Friend in need','2025-10-14 19:12:07','2025-10-14 19:12:07'),(8,3,'Jennifer Lee',120.00,'2025-10-03','2025-11-03',NULL,'lent','Family assistance','2025-10-14 19:12:07','2025-10-14 19:12:07'),(9,3,'Thomas White',60.00,'2025-10-08','2025-11-08',NULL,'lent','Small personal loan','2025-10-14 19:12:07','2025-10-14 19:12:07'),(10,4,'Amanda Harris',150.00,'2025-09-28','2025-10-28',NULL,'lent','Photography equipment','2025-10-14 19:12:07','2025-10-14 19:12:07'),(11,4,'Christopher Martin',90.00,'2025-10-02','2025-11-02',NULL,'lent','Travel expenses','2025-10-14 19:12:07','2025-10-14 19:12:07'),(12,4,'Jessica Thompson',70.00,'2025-10-07','2025-11-07',NULL,'lent','Course fees','2025-10-14 19:12:07','2025-10-14 19:12:07'),(13,5,'Daniel Garcia',500.00,'2025-09-22','2025-10-22',NULL,'lent','Team member support','2025-10-14 19:12:07','2025-10-14 19:12:07'),(14,5,'Michelle Rodriguez',350.00,'2025-10-04','2025-11-04',NULL,'lent','Project assistance','2025-10-14 19:12:07','2025-10-14 19:12:07'),(15,5,'Kevin Martinez',200.00,'2025-10-09','2025-11-09',NULL,'lent','Business development','2025-10-14 19:12:07','2025-10-14 19:12:07'),(16,6,'Stephanie Anderson',50.00,'2025-09-29','2025-10-29',NULL,'lent','Colleague lunch money','2025-10-14 19:12:07','2025-10-14 19:12:07'),(17,6,'Richard Thomas',120.00,'2025-10-06','2025-11-06',NULL,'lent','Certification help','2025-10-14 19:12:07','2025-10-14 19:12:07'),(18,6,'Nancy Jackson',80.00,'2025-10-11','2025-11-11',NULL,'lent','Book purchase assistance','2025-10-14 19:12:07','2025-10-14 19:12:07');
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
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_notifications_user` (`user_id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,'Budget Alert','You have exceeded your Food & Dining budget','budget',0,'2025-10-14 19:12:10'),(2,1,'Expense Approved','Your expense for office supplies has been approved','expense',1,'2025-10-14 19:12:10'),(3,1,'Savings Goal Update','You are 50% towards your New Laptop goal','savings',0,'2025-10-14 19:12:10'),(4,2,'Team Update','New member joined your team','team',0,'2025-10-14 19:12:10'),(5,2,'Expense Reminder','You have pending expenses to review','expense',1,'2025-10-14 19:12:10'),(6,2,'Budget Created','New budget for Travel has been created','budget',0,'2025-10-14 19:12:10'),(7,3,'Welcome','Welcome to FinMate! Start tracking your expenses','system',1,'2025-10-14 19:12:10'),(8,3,'Expense Added','New expense added: Coffee and snacks','expense',1,'2025-10-14 19:12:10'),(9,3,'Savings Progress','Great progress on your Smartphone Upgrade goal','savings',1,'2025-10-14 19:12:10'),(10,4,'Budget Warning','You are close to your Transportation budget limit','budget',0,'2025-10-14 19:12:10'),(11,4,'Expense Approved','Your restaurant dinner expense was approved','expense',1,'2025-10-14 19:12:10'),(12,4,'Goal Completed','Congratulations! You reached your Fitness Gear goal','savings',0,'2025-10-14 19:12:10'),(13,5,'Team Expense','New team expense needs approval','team',0,'2025-10-14 19:12:10'),(14,5,'Budget Update','Team budget has been updated','budget',1,'2025-10-14 19:12:10'),(15,5,'Expense Report','Monthly expense report is ready','report',0,'2025-10-14 19:12:10'),(16,6,'Welcome to Team','You have been added to Development Team','team',1,'2025-10-14 19:12:10'),(17,6,'Expense Added','New personal expense recorded','expense',0,'2025-10-14 19:12:10'),(18,6,'Budget Alert','You are under budget for Personal Care','budget',0,'2025-10-14 19:12:10'),(19,10,'Password Changed','Your password was changed by an administrator.','security',0,'2025-10-18 20:27:35'),(20,1,'Password Changed','Your password was changed by an administrator.','security',0,'2025-10-20 13:01:48');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `status` enum('pending','completed','failed','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_method` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'user_manage','Manage users','2025-10-14 19:12:03'),(2,'team_manage','Manage teams','2025-10-14 19:12:03'),(3,'budget_manage','Manage budgets','2025-10-14 19:12:03'),(4,'expense_manage','Manage expenses','2025-10-14 19:12:03'),(5,'savings_manage','Manage savings','2025-10-14 19:12:03'),(6,'report_view','View reports','2025-10-14 19:12:03'),(7,'system_manage','Manage system settings','2025-10-14 19:12:03');
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
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `planned_date` date NOT NULL,
  `status` enum('planned','in_progress','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'planned',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `team_id` (`team_id`),
  CONSTRAINT `planned_expenses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `planned_expenses_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `planned_expenses`
--

LOCK TABLES `planned_expenses` WRITE;
/*!40000 ALTER TABLE `planned_expenses` DISABLE KEYS */;
INSERT INTO `planned_expenses` VALUES (1,1,NULL,200.00,'Quarterly software license','Other','2025-11-01','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(2,1,NULL,150.00,'Professional development course','Education','2025-10-15','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(3,1,NULL,300.00,'Annual conference','Education','2025-12-01','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(4,2,NULL,100.00,'Team lunch','Food & Dining','2025-10-20','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(5,2,NULL,250.00,'Marketing materials','Other','2025-11-05','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(6,2,NULL,180.00,'Business tools subscription','Other','2025-10-25','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(7,3,NULL,80.00,'Birthday gift','Gifts & Donations','2025-10-18','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(8,3,NULL,120.00,'Winter clothes','Shopping','2025-11-10','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(9,3,NULL,60.00,'Dentist appointment','Healthcare','2025-10-30','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(10,4,NULL,150.00,'Camera lens filter','Other','2025-11-15','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(11,4,NULL,90.00,'Fitness tracker','Health & Fitness','2025-10-22','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(12,4,NULL,70.00,'Online photography course','Education','2025-11-05','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(13,5,NULL,500.00,'Team training workshop','Education','2025-11-01','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(14,5,NULL,350.00,'Project management software','Other','2025-10-28','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(15,5,NULL,200.00,'Team appreciation event','Entertainment','2025-12-15','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(16,6,NULL,50.00,'Team lunch contribution','Food & Dining','2025-10-25','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(17,6,NULL,120.00,'Professional certification','Education','2025-11-20','planned','2025-10-14 19:12:08','2025-10-14 19:12:08'),(18,6,NULL,80.00,'Work-related books','Education','2025-10-30','planned','2025-10-14 19:12:08','2025-10-14 19:12:08');
/*!40000 ALTER TABLE `planned_expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `planned_purchases`
--

DROP TABLE IF EXISTS `planned_purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planned_purchases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text,
  `category` varchar(50) DEFAULT NULL,
  `planned_amount` decimal(10,2) NOT NULL,
  `quantity` int DEFAULT '1',
  `period` enum('week','month','year') NOT NULL,
  `status` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `planned_purchases_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `planned_purchases`
--

LOCK TABLES `planned_purchases` WRITE;
/*!40000 ALTER TABLE `planned_purchases` DISABLE KEYS */;
/*!40000 ALTER TABLE `planned_purchases` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=1628 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,1,'2025-10-14 19:12:04'),(2,1,2,'2025-10-14 19:12:04'),(3,1,3,'2025-10-14 19:12:04'),(4,1,4,'2025-10-14 19:12:04'),(5,1,5,'2025-10-14 19:12:04'),(6,1,6,'2025-10-14 19:12:04'),(7,1,7,'2025-10-14 19:12:04'),(8,2,1,'2025-10-14 19:12:04'),(9,2,2,'2025-10-14 19:12:04'),(10,2,3,'2025-10-14 19:12:04'),(11,2,4,'2025-10-14 19:12:04'),(12,2,5,'2025-10-14 19:12:04'),(13,2,6,'2025-10-14 19:12:04'),(14,3,2,'2025-10-14 19:12:04'),(15,3,3,'2025-10-14 19:12:04'),(16,3,4,'2025-10-14 19:12:04'),(17,3,5,'2025-10-14 19:12:04'),(18,3,6,'2025-10-14 19:12:04'),(19,4,4,'2025-10-14 19:12:04'),(20,4,5,'2025-10-14 19:12:04'),(21,4,6,'2025-10-14 19:12:04'),(22,5,3,'2025-10-14 19:12:04'),(23,5,4,'2025-10-14 19:12:04'),(24,5,5,'2025-10-14 19:12:04'),(25,5,6,'2025-10-14 19:12:04');
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
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'super_admin','Full system access','2025-10-14 19:12:02','2025-10-14 19:12:02'),(2,'admin','Administrative access','2025-10-14 19:12:02','2025-10-14 19:12:02'),(3,'team_leader','Team leader access','2025-10-14 19:12:02','2025-10-14 19:12:02'),(4,'team_member','Team member access','2025-10-14 19:12:02','2025-10-14 19:12:02'),(5,'individual_user','Individual user access','2025-10-14 19:12:02','2025-10-14 19:12:02');
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
  `goal_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_amount` decimal(10,2) NOT NULL,
  `current_amount` decimal(10,2) DEFAULT '0.00',
  `target_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `savings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_amount` decimal(10,2) NOT NULL,
  `current_amount` decimal(10,2) DEFAULT '0.00',
  `target_date` date DEFAULT NULL,
  `status` enum('active','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `savings_goals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `savings_goals`
--

LOCK TABLES `savings_goals` WRITE;
/*!40000 ALTER TABLE `savings_goals` DISABLE KEYS */;
INSERT INTO `savings_goals` VALUES (1,1,'New Laptop',1500.00,750.00,'2025-06-01','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(2,1,'Vacation Fund',3000.00,1200.00,'2025-12-01','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(3,1,'Emergency Fund',5000.00,2500.00,'2025-12-31','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(4,2,'Car Down Payment',5000.00,2000.00,'2025-08-01','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(5,2,'Home Renovation',10000.00,3500.00,'2025-11-01','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(6,2,'Investment Fund',8000.00,4000.00,'2025-09-01','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(7,3,'Smartphone Upgrade',800.00,400.00,'2025-07-01','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(8,3,'Weekend Getaway',600.00,250.00,'2025-08-15','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(9,3,'Gaming Console',500.00,300.00,'2025-06-30','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(10,4,'Camera Equipment',2000.00,800.00,'2025-10-01','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(11,4,'Fitness Gear',600.00,350.00,'2025-07-15','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(12,4,'Books and Courses',400.00,200.00,'2025-08-30','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(13,5,'Team Equipment',2500.00,1000.00,'2025-09-01','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(14,5,'Training Budget',1500.00,600.00,'2025-08-01','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(15,5,'Team Retreat',4000.00,1500.00,'2025-11-01','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(16,6,'New Headphones',200.00,120.00,'2025-07-01','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(17,6,'Online Course',300.00,180.00,'2025-08-15','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(18,6,'Charity Donation',500.00,250.00,'2025-12-01','active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(19,3,'Laptop',20000.00,2020.00,NULL,'active','2025-10-14 19:12:09','2025-10-14 19:12:09'),(20,9,'car',1000000.00,600290.00,'2025-10-31','active','2025-10-17 15:37:37','2025-10-17 15:42:22'),(21,9,'trip',3500000.00,3420000.00,'2025-10-16','active','2025-10-17 15:41:47','2025-10-17 15:51:17');
/*!40000 ALTER TABLE `savings_goals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `expires_at` timestamp NOT NULL,
  `data` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_logs`
--

DROP TABLE IF EXISTS `system_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `level` enum('info','warning','error','debug') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `context` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_logs`
--

LOCK TABLES `system_logs` WRITE;
/*!40000 ALTER TABLE `system_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `type` enum('string','number','boolean','json') COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_public` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES (1,'app_name','FinMate','general','string','Application name',0,'2025-10-19 08:02:45','2025-10-19 08:02:45'),(2,'app_url','http://localhost:3000','general','string','Application URL',0,'2025-10-19 08:02:45','2025-10-19 08:02:45'),(3,'admin_email','admin@finmate.com','general','string','Administrator email',0,'2025-10-19 08:02:45','2025-10-19 08:02:45'),(4,'items_per_page','10','general','number','Number of items per page in lists',0,'2025-10-19 08:02:45','2025-10-19 08:02:45'),(5,'password_policy_min_length','8','security','number','Minimum password length',0,'2025-10-19 08:02:45','2025-10-19 08:02:45'),(6,'session_timeout','60','security','number','Session timeout in minutes',0,'2025-10-19 08:02:45','2025-10-19 08:02:45'),(7,'max_login_attempts','5','security','number','Maximum login attempts before lockout',0,'2025-10-19 08:02:45','2025-10-19 08:02:45');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `team_leader_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES (1,'Development Team','Software development team',NULL,'2025-10-14 19:12:04','2025-10-14 19:12:04'),(2,'Marketing Team','Marketing and sales team',NULL,'2025-10-14 19:12:04','2025-10-14 19:12:04'),(3,'Finance Team','Financial management team',NULL,'2025-10-14 19:12:04','2025-10-14 19:12:04');
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` enum('expense','income') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_preferences`
--

LOCK TABLES `user_preferences` WRITE;
/*!40000 ALTER TABLE `user_preferences` DISABLE KEYS */;
INSERT INTO `user_preferences` VALUES (1,1,1,1,1,1,1,1,1,'2025-10-14 19:12:05','2025-10-14 19:12:05'),(2,2,1,1,1,1,1,1,1,'2025-10-14 19:12:05','2025-10-14 19:12:05'),(3,3,1,1,1,1,1,1,1,'2025-10-14 19:12:05','2025-10-14 19:12:05'),(4,4,1,1,1,1,1,1,1,'2025-10-14 19:12:05','2025-10-14 19:12:05'),(5,5,1,1,1,1,1,1,1,'2025-10-14 19:12:05','2025-10-14 19:12:05'),(6,6,1,1,1,1,1,1,1,'2025-10-14 19:12:05','2025-10-14 19:12:05');
/*!40000 ALTER TABLE `user_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_settings`
--

DROP TABLE IF EXISTS `user_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_setting` (`user_id`,`setting_key`),
  CONSTRAINT `fk_user_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_settings`
--

LOCK TABLES `user_settings` WRITE;
/*!40000 ALTER TABLE `user_settings` DISABLE KEYS */;
INSERT INTO `user_settings` VALUES (1,7,'daily_expense_limit','200','2025-10-14 19:14:50','2025-10-15 17:57:44'),(2,8,'daily_expense_limit','200','2025-10-15 16:14:43','2025-10-16 14:24:41'),(7,12,'daily_expense_limit','120','2025-10-17 15:00:31','2025-10-28 14:03:03'),(8,9,'daily_expense_limit','1000','2025-10-17 15:32:20','2025-10-17 15:32:20');
/*!40000 ALTER TABLE `user_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'superadmin','superadmin@finmate.com','$2b$12$8OpJGXjT9JicD7jknWdtn.O3jLTHgib4JuiVgrkxuFFSYX3hWkZ8S','Super','Admin',1,NULL,1,'2025-10-14 19:12:05','2025-10-20 13:01:48'),(2,'admin','admin@finmate.com','$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu','System','Admin',2,NULL,1,'2025-10-14 19:12:05','2025-10-14 19:12:05'),(3,'user1','user1@finmate.com','$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu','John','Doe',5,NULL,1,'2025-10-14 19:12:05','2025-10-14 19:12:05'),(4,'senior','senior@1.com','$2a$12$mZ27Jih89La0mxZaW4WqselmIfij29VXoHMmwZ9TbJUCu4gZZwGza','Martin','Omondo',5,NULL,1,'2025-10-14 19:12:05','2025-10-14 19:12:05'),(5,'teamleader','teamleader@finmate.com','$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu','Team','Leader',3,1,1,'2025-10-14 19:12:05','2025-10-14 19:12:05'),(6,'teammember','teammember@finmate.com','$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu','Team','Member',4,1,1,'2025-10-14 19:12:05','2025-10-14 19:12:05'),(7,'lazymilionaire','lazymilionaire94@gmail.com','$2a$12$aqbDQKJngCgJF2GPmoEzY.zVvFGD8Fb0FUkLjo2Wg1WFaUBXEy03y','martin','omondo',5,NULL,1,'2025-10-14 19:14:18','2025-10-14 19:14:18'),(8,'Telvin','mwendadenis62@gmail.com','$2a$12$yA6fSuxuUKCVSqUE1oWXZO60uHgE9Ww5hDg8pqksoINSShUvMADMG','Denis','Mwenda',5,NULL,1,'2025-10-15 08:49:26','2025-10-15 08:49:26'),(9,'jemo_blip','xxx07@gmail.com','$2a$12$FAlKpI7gOfKn.Fp3sICyXOYbbpiajQmL0QtM.SD9L.iUOmXH7lvOq','james','maina',5,NULL,1,'2025-10-17 14:46:58','2025-10-17 14:46:58'),(10,'teddy','jumateddy310@gmail.com','$2b$12$8uuYjpTtk5VlREFJym1TGOOpKXrbFFUGbBIzhAslm/8hEWPpwuoPe','Teddy','Kinanjui',5,NULL,1,'2025-10-17 14:50:40','2025-10-18 20:28:01'),(12,'t@eddy','0794925602@gmail.com','$2a$12$QD.QZIYia1MyB7Lf5hykv.gcbto9jkS1K.BJa0KABhwhvMr3Usg2.','Teddy','Kinanjui',5,NULL,1,'2025-10-17 14:57:59','2025-10-17 14:57:59');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'defaultdb'
--

--
-- Dumping routines for database 'defaultdb'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-09 17:44:51
