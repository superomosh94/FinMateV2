-- ==========================================
-- FINMATE DATABASE RESET AND CLEAN SETUP
-- ==========================================

SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables in correct dependency order
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `savings_goals`;
DROP TABLE IF EXISTS `savings`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `planned_expenses`;
DROP TABLE IF EXISTS `lent_money`;
DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `budgets`;
DROP TABLE IF EXISTS `user_preferences`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `teams`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `roles`;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- ROLES TABLE
-- ==========================================
CREATE TABLE `roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`name`, `description`) VALUES 
('super_admin', 'Full system access'),
('admin', 'Administrative access'),
('team_leader', 'Team leader access'),
('team_member', 'Team member access'),
('individual_user', 'Individual user access');

-- ==========================================
-- PERMISSIONS TABLE
-- ==========================================
CREATE TABLE `permissions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `permissions` (`name`, `description`) VALUES 
('user_manage', 'Manage users'),
('team_manage', 'Manage teams'),
('budget_manage', 'Manage budgets'),
('expense_manage', 'Manage expenses'),
('savings_manage', 'Manage savings'),
('report_view', 'View reports'),
('system_manage', 'Manage system settings');

-- ==========================================
-- ROLE_PERMISSIONS TABLE
-- ==========================================
CREATE TABLE `role_permissions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `role_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_permission` (`role_id`, `permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES 
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7),
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6),
(3, 2), (3, 3), (3, 4), (3, 5), (3, 6),
(4, 4), (4, 5), (4, 6),
(5, 3), (5, 4), (5, 5), (5, 6);

-- ==========================================
-- TEAMS TABLE
-- ==========================================
CREATE TABLE `teams` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `team_leader_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `teams` (`name`, `description`) VALUES 
('Development Team', 'Software development team'),
('Marketing Team', 'Marketing and sales team'),
('Finance Team', 'Financial management team');

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(50) DEFAULT NULL,
  `last_name` VARCHAR(50) DEFAULT NULL,
  `role_id` INT NOT NULL,
  `team_id` INT DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`username`, `email`, `password`, `first_name`, `last_name`, `role_id`, `team_id`) VALUES 
('superadmin', 'superadmin@finmate.com', '$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu', 'Super', 'Admin', 1, NULL),
('admin', 'admin@finmate.com', '$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu', 'System', 'Admin', 2, NULL),
('user1', 'user1@finmate.com', '$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu', 'John', 'Doe', 5, NULL),
('senior', 'senior@1.com', '$2a$12$mZ27Jih89La0mxZaW4WqselmIfij29VXoHMmwZ9TbJUCu4gZZwGza', 'Martin', 'Omondo', 5, NULL),
('teamleader', 'teamleader@finmate.com', '$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu', 'Team', 'Leader', 3, 1),
('teammember', 'teammember@finmate.com', '$2a$12$eCldWEHrL1lMovfvuhIntOUVjs12l8ZV9VCYEODQLT5SJ6JU1a7Xu', 'Team', 'Member', 4, 1);

-- ==========================================
-- USER_PREFERENCES TABLE
-- ==========================================
CREATE TABLE `user_preferences` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `email_notifications` TINYINT(1) DEFAULT 1,
  `push_notifications` TINYINT(1) DEFAULT 1,
  `monthly_report` TINYINT(1) DEFAULT 1,
  `expense_reminders` TINYINT(1) DEFAULT 1,
  `budget_alerts` TINYINT(1) DEFAULT 1,
  `team_announcements` TINYINT(1) DEFAULT 1,
  `expense_approval_updates` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `user_preferences` (`user_id`) VALUES 
(1), (2), (3), (4), (5), (6);

-- ==========================================
-- BUDGETS TABLE
-- ==========================================
CREATE TABLE `budgets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `team_id` INT DEFAULT NULL,
  `category` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `period` ENUM('daily','weekly','monthly','yearly') DEFAULT 'monthly',
  `start_date` DATE NOT NULL,
  `end_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `budgets` (`user_id`, `team_id`, `category`, `amount`, `period`, `start_date`, `end_date`) VALUES 
(1, NULL, 'Food & Dining', 500.00, 'monthly', '2025-01-01', '2025-12-31'),
(1, NULL, 'Transportation', 300.00, 'monthly', '2025-01-01', '2025-12-31'),
(1, NULL, 'Entertainment', 200.00, 'monthly', '2025-01-01', '2025-12-31'),
(2, NULL, 'Food & Dining', 400.00, 'monthly', '2025-01-01', '2025-12-31'),
(2, NULL, 'Utilities', 250.00, 'monthly', '2025-01-01', '2025-12-31'),
(2, NULL, 'Travel', 600.00, 'monthly', '2025-01-01', '2025-12-31'),
(3, NULL, 'Food & Dining', 350.00, 'monthly', '2025-01-01', '2025-12-31'),
(3, NULL, 'Shopping', 150.00, 'monthly', '2025-01-01', '2025-12-31'),
(3, NULL, 'Healthcare', 100.00, 'monthly', '2025-01-01', '2025-12-31'),
(4, NULL, 'Food & Dining', 450.00, 'monthly', '2025-01-01', '2025-12-31'),
(4, NULL, 'Transportation', 200.00, 'monthly', '2025-01-01', '2025-12-31'),
(4, NULL, 'Entertainment', 150.00, 'monthly', '2025-01-01', '2025-12-31'),
(5, NULL, 'Food & Dining', 600.00, 'monthly', '2025-01-01', '2025-12-31'),
(5, NULL, 'Team Expenses', 1000.00, 'monthly', '2025-01-01', '2025-12-31'),
(5, NULL, 'Travel', 800.00, 'monthly', '2025-01-01', '2025-12-31'),
(6, NULL, 'Food & Dining', 300.00, 'monthly', '2025-01-01', '2025-12-31'),
(6, NULL, 'Transportation', 150.00, 'monthly', '2025-01-01', '2025-12-31'),
(6, NULL, 'Personal Care', 100.00, 'monthly', '2025-01-01', '2025-12-31'),
(3, NULL, 'Transportation', 300.00, 'daily', '2025-10-13', '2025-10-14'),
(3, NULL, 'Food & Dining', 22.00, 'daily', '2025-10-13', '2025-10-14');

-- ==========================================
-- EXPENSES TABLE
-- ==========================================
CREATE TABLE `expenses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `team_id` INT DEFAULT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `status` ENUM('pending','approved','rejected') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `expenses` (`user_id`, `team_id`, `amount`, `description`, `category`, `date`, `status`) VALUES 
(1, NULL, 45.50, 'Business lunch meeting', 'Food & Dining', '2025-10-01', 'approved'),
(1, NULL, 120.00, 'Flight ticket', 'Travel', '2025-10-02', 'approved'),
(1, NULL, 89.99, 'Office supplies', 'Other', '2025-10-03', 'pending'),
(2, NULL, 25.00, 'Team lunch', 'Food & Dining', '2025-10-01', 'approved'),
(2, NULL, 65.00, 'Software subscription', 'Other', '2025-10-02', 'approved'),
(2, NULL, 150.00, 'Conference ticket', 'Education', '2025-10-03', 'pending'),
(3, NULL, 15.75, 'Coffee and snacks', 'Food & Dining', '2025-10-01', 'approved'),
(3, NULL, 45.00, 'Gas for car', 'Transportation', '2025-10-02', 'approved'),
(3, NULL, 75.00, 'Movie night', 'Entertainment', '2025-10-03', 'pending'),
(4, NULL, 32.50, 'Restaurant dinner', 'Food & Dining', '2025-10-01', 'approved'),
(4, NULL, 22.00, 'Bus pass', 'Transportation', '2025-10-02', 'approved'),
(4, NULL, 50.00, 'Gym membership', 'Health & Fitness', '2025-10-03', 'pending'),
(5, NULL, 120.00, 'Team building activity', 'Entertainment', '2025-10-01', 'approved'),
(5, NULL, 300.00, 'Project materials', 'Other', '2025-10-02', 'approved'),
(5, NULL, 85.00, 'Client dinner', 'Food & Dining', '2025-10-03', 'pending'),
(6, NULL, 18.50, 'Lunch with colleagues', 'Food & Dining', '2025-10-01', 'approved'),
(6, NULL, 35.00, 'Taxi ride', 'Transportation', '2025-10-02', 'approved'),
(6, NULL, 42.00, 'Team contribution', 'Other', '2025-10-03', 'pending'),
(1, NULL, 2500.00, 'Groceries shopping', 'Food', '2025-10-01', 'pending'),
(1, NULL, 150.00, 'Matatu fare', 'Transport', '2025-10-02', 'pending'),
(1, NULL, 800.00, 'Electricity bill', 'Utilities', '2025-10-03', 'pending'),
(1, NULL, 500.00, 'Movie night', 'Entertainment', '2025-10-04', 'pending'),
(1, NULL, 300.00, 'Office supplies', 'Other', '2025-10-05', 'pending'),
(3, NULL, 1500.00, 'Test expense', 'Food', '2025-10-12', 'pending'),
(3, NULL, 23.00, 'lunch', 'Transportation', '2025-10-13', 'pending'),
(3, NULL, 34.00, 'lunch', 'Food & Dining', '2025-10-13', 'pending');

-- ==========================================
-- LENT_MONEY TABLE
-- ==========================================
CREATE TABLE `lent_money` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lender_id` INT NOT NULL,
  `borrower_name` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `lent_date` DATE NOT NULL,
  `expected_return_date` DATE DEFAULT NULL,
  `returned_date` DATE DEFAULT NULL,
  `status` ENUM('lent','returned','overdue') DEFAULT 'lent',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`lender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `lent_money` (`lender_id`, `borrower_name`, `amount`, `lent_date`, `expected_return_date`, `status`, `notes`) VALUES 
(1, 'John Smith', 200.00, '2025-09-15', '2025-10-15', 'lent', 'Loan for emergency car repair'),
(1, 'Sarah Johnson', 150.00, '2025-09-20', '2025-10-20', 'lent', 'Help with medical bills'),
(1, 'Mike Brown', 300.00, '2025-10-01', '2025-11-01', 'lent', 'Business startup help'),
(2, 'Lisa Davis', 100.00, '2025-09-25', '2025-10-25', 'lent', 'Short term loan'),
(2, 'David Wilson', 250.00, '2025-10-05', '2025-11-05', 'lent', 'Help with rent'),
(2, 'Emily Clark', 180.00, '2025-10-10', '2025-11-10', 'lent', 'Education expenses'),
(3, 'Robert Taylor', 80.00, '2025-09-30', '2025-10-30', 'lent', 'Friend in need'),
(3, 'Jennifer Lee', 120.00, '2025-10-03', '2025-11-03', 'lent', 'Family assistance'),
(3, 'Thomas White', 60.00, '2025-10-08', '2025-11-08', 'lent', 'Small personal loan'),
(4, 'Amanda Harris', 150.00, '2025-09-28', '2025-10-28', 'lent', 'Photography equipment'),
(4, 'Christopher Martin', 90.00, '2025-10-02', '2025-11-02', 'lent', 'Travel expenses'),
(4, 'Jessica Thompson', 70.00, '2025-10-07', '2025-11-07', 'lent', 'Course fees'),
(5, 'Daniel Garcia', 500.00, '2025-09-22', '2025-10-22', 'lent', 'Team member support'),
(5, 'Michelle Rodriguez', 350.00, '2025-10-04', '2025-11-04', 'lent', 'Project assistance'),
(5, 'Kevin Martinez', 200.00, '2025-10-09', '2025-11-09', 'lent', 'Business development'),
(6, 'Stephanie Anderson', 50.00, '2025-09-29', '2025-10-29', 'lent', 'Colleague lunch money'),
(6, 'Richard Thomas', 120.00, '2025-10-06', '2025-11-06', 'lent', 'Certification help'),
(6, 'Nancy Jackson', 80.00, '2025-10-11', '2025-11-11', 'lent', 'Book purchase assistance');

-- ==========================================
-- PLANNED_EXPENSES TABLE
-- ==========================================
CREATE TABLE `planned_expenses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `team_id` INT DEFAULT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `planned_date` DATE NOT NULL,
  `status` ENUM('planned','in_progress','completed','cancelled') DEFAULT 'planned',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `planned_expenses` (`user_id`, `team_id`, `amount`, `description`, `category`, `planned_date`, `status`) VALUES 
(1, NULL, 200.00, 'Quarterly software license', 'Other', '2025-11-01', 'planned'),
(1, NULL, 150.00, 'Professional development course', 'Education', '2025-10-15', 'planned'),
(1, NULL, 300.00, 'Annual conference', 'Education', '2025-12-01', 'planned'),
(2, NULL, 100.00, 'Team lunch', 'Food & Dining', '2025-10-20', 'planned'),
(2, NULL, 250.00, 'Marketing materials', 'Other', '2025-11-05', 'planned'),
(2, NULL, 180.00, 'Business tools subscription', 'Other', '2025-10-25', 'planned'),
(3, NULL, 80.00, 'Birthday gift', 'Gifts & Donations', '2025-10-18', 'planned'),
(3, NULL, 120.00, 'Winter clothes', 'Shopping', '2025-11-10', 'planned'),
(3, NULL, 60.00, 'Dentist appointment', 'Healthcare', '2025-10-30', 'planned'),
(4, NULL, 150.00, 'Camera lens filter', 'Other', '2025-11-15', 'planned'),
(4, NULL, 90.00, 'Fitness tracker', 'Health & Fitness', '2025-10-22', 'planned'),
(4, NULL, 70.00, 'Online photography course', 'Education', '2025-11-05', 'planned'),
(5, NULL, 500.00, 'Team training workshop', 'Education', '2025-11-01', 'planned'),
(5, NULL, 350.00, 'Project management software', 'Other', '2025-10-28', 'planned'),
(5, NULL, 200.00, 'Team appreciation event', 'Entertainment', '2025-12-15', 'planned'),
(6, NULL, 50.00, 'Team lunch contribution', 'Food & Dining', '2025-10-25', 'planned'),
(6, NULL, 120.00, 'Professional certification', 'Education', '2025-11-20', 'planned'),
(6, NULL, 80.00, 'Work-related books', 'Education', '2025-10-30', 'planned');

-- ==========================================
-- SAVINGS TABLE
-- ==========================================
CREATE TABLE `savings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `goal_name` VARCHAR(100) NOT NULL,
  `target_amount` DECIMAL(10,2) NOT NULL,
  `current_amount` DECIMAL(10,2) DEFAULT 0.00,
  `target_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- SAVINGS_GOALS TABLE
-- ==========================================
CREATE TABLE `savings_goals` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `target_amount` DECIMAL(10,2) NOT NULL,
  `current_amount` DECIMAL(10,2) DEFAULT 0.00,
  `target_date` DATE DEFAULT NULL,
  `status` ENUM('active','completed','cancelled') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `savings_goals` (`user_id`, `name`, `target_amount`, `current_amount`, `target_date`, `status`) VALUES 
(1, 'New Laptop', 1500.00, 750.00, '2025-06-01', 'active'),
(1, 'Vacation Fund', 3000.00, 1200.00, '2025-12-01', 'active'),
(1, 'Emergency Fund', 5000.00, 2500.00, '2025-12-31', 'active'),
(2, 'Car Down Payment', 5000.00, 2000.00, '2025-08-01', 'active'),
(2, 'Home Renovation', 10000.00, 3500.00, '2025-11-01', 'active'),
(2, 'Investment Fund', 8000.00, 4000.00, '2025-09-01', 'active'),
(3, 'Smartphone Upgrade', 800.00, 400.00, '2025-07-01', 'active'),
(3, 'Weekend Getaway', 600.00, 250.00, '2025-08-15', 'active'),
(3, 'Gaming Console', 500.00, 300.00, '2025-06-30', 'active'),
(4, 'Camera Equipment', 2000.00, 800.00, '2025-10-01', 'active'),
(4, 'Fitness Gear', 600.00, 350.00, '2025-07-15', 'active'),
(4, 'Books and Courses', 400.00, 200.00, '2025-08-30', 'active'),
(5, 'Team Equipment', 2500.00, 1000.00, '2025-09-01', 'active'),
(5, 'Training Budget', 1500.00, 600.00, '2025-08-01', 'active'),
(5, 'Team Retreat', 4000.00, 1500.00, '2025-11-01', 'active'),
(6, 'New Headphones', 200.00, 120.00, '2025-07-01', 'active'),
(6, 'Online Course', 300.00, 180.00, '2025-08-15', 'active'),
(6, 'Charity Donation', 500.00, 250.00, '2025-12-01', 'active'),
(3, 'Laptop', 20000.00, 2020.00, NULL, 'active');

-- ==========================================
-- TRANSACTIONS TABLE
-- ==========================================
CREATE TABLE `transactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `type` ENUM('expense','income') NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `description` TEXT,
  `date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- ==========================================
-- CREATE TABLE: notifications
-- ==========================================

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_notifications_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- INSERT SAMPLE DATA: notifications
-- ==========================================

INSERT INTO `notifications` (`user_id`, `title`, `message`, `type`, `is_read`) VALUES
(1, 'Budget Alert', 'You have exceeded your Food & Dining budget', 'budget', 0),
(1, 'Expense Approved', 'Your expense for office supplies has been approved', 'expense', 1),
(1, 'Savings Goal Update', 'You are 50% towards your New Laptop goal', 'savings', 0),
(2, 'Team Update', 'New member joined your team', 'team', 0),
(2, 'Expense Reminder', 'You have pending expenses to review', 'expense', 1),
(2, 'Budget Created', 'New budget for Travel has been created', 'budget', 0),
(3, 'Welcome', 'Welcome to FinMate! Start tracking your expenses', 'system', 1),
(3, 'Expense Added', 'New expense added: Coffee and snacks', 'expense', 1),
(3, 'Savings Progress', 'Great progress on your Smartphone Upgrade goal', 'savings', 1),
(4, 'Budget Warning', 'You are close to your Transportation budget limit', 'budget', 0),
(4, 'Expense Approved', 'Your restaurant dinner expense was approved', 'expense', 1),
(4, 'Goal Completed', 'Congratulations! You reached your Fitness Gear goal', 'savings', 0),
(5, 'Team Expense', 'New team expense needs approval', 'team', 0),
(5, 'Budget Update', 'Team budget has been updated', 'budget', 1),
(5, 'Expense Report', 'Monthly expense report is ready', 'report', 0),
(6, 'Welcome to Team', 'You have been added to Development Team', 'team', 1),
(6, 'Expense Added', 'New personal expense recorded', 'expense', 0),
(6, 'Budget Alert', 'You are under budget for Personal Care', 'budget', 0);


-- ==========================================
-- CREATE TABLE: user_settings
-- ==========================================

CREATE TABLE IF NOT EXISTS `user_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_setting` (`user_id`, `setting_key`),
  CONSTRAINT `fk_user_settings_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci;




  -- ==========================================
-- INCOMES TABLE
-- ==========================================
CREATE TABLE `incomes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `team_id` INT DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `description` TEXT,
  `source` VARCHAR(100) DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `received_date` DATE NOT NULL,
  `status` ENUM('pending','cleared','cancelled') DEFAULT 'cleared',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL,
  INDEX `idx_incomes_user_id` (`user_id`),
  INDEX `idx_incomes_received_date` (`received_date`),
  INDEX `idx_incomes_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- SETUP COMPLETE
-- ==========================================
