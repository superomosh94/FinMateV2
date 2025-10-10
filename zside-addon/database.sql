-- ==============================================
-- Full Database Reset & Recreate Script
-- ==============================================

DROP TABLE IF EXISTS RolePermissions;
DROP TABLE IF EXISTS Permissions;
DROP TABLE IF EXISTS Notifications;
DROP TABLE IF EXISTS Budgets;
DROP TABLE IF EXISTS Savings;
DROP TABLE IF EXISTS LentMoney;
DROP TABLE IF EXISTS PlannedExpenses;
DROP TABLE IF EXISTS Expenses;
DROP TABLE IF EXISTS TeamMembers;
DROP TABLE IF EXISTS Teams;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Roles;

CREATE TABLE Roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE RolePermissions (
    roleId INT NOT NULL,
    permissionId INT NOT NULL,
    PRIMARY KEY (roleId, permissionId),
    FOREIGN KEY (roleId) REFERENCES Roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permissionId) REFERENCES Permissions(id) ON DELETE CASCADE
);

CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    fullName VARCHAR(255),
    passwordHash VARCHAR(512) NOT NULL,
    roleId INT NOT NULL,
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NULL,
    FOREIGN KEY (roleId) REFERENCES Roles(id)
);

CREATE TABLE Teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    leaderId INT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY UQ_Teams_Leader (leaderId),
    FOREIGN KEY (leaderId) REFERENCES Users(id)
);

CREATE TABLE TeamMembers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teamId INT NOT NULL,
    userId INT NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_member (teamId, userId),
    FOREIGN KEY (teamId) REFERENCES Teams(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NULL,
    teamId INT NULL,
    itemName VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description VARCHAR(500),
    price DECIMAL(18,2) NOT NULL,
    paymentMethod VARCHAR(50) NOT NULL,
    datePurchased DATE NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (teamId) REFERENCES Teams(id)
);

CREATE TABLE PlannedExpenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NULL,
    teamId INT NULL,
    itemName VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    expectedPrice DECIMAL(18,2) NOT NULL,
    plannedDate DATE NOT NULL,
    isConverted BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (teamId) REFERENCES Teams(id)
);

CREATE TABLE LentMoney (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lenderId INT NOT NULL,
    borrowerName VARCHAR(255),
    amount DECIMAL(18,2) NOT NULL,
    dateLent DATE NOT NULL,
    expectedRepaymentDate DATE,
    repaymentMethod VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lenderId) REFERENCES Users(id)
);

CREATE TABLE Savings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NULL,
    teamId INT NULL,
    goalName VARCHAR(255),
    amount DECIMAL(18,2) NOT NULL,
    targetAmount DECIMAL(18,2),
    type VARCHAR(50) NOT NULL,
    note VARCHAR(500),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (teamId) REFERENCES Teams(id)
);

CREATE TABLE Budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NULL,
    teamId INT NULL,
    periodStart DATE NOT NULL,
    periodEnd DATE NOT NULL,
    category VARCHAR(100),
    amount DECIMAL(18,2) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (teamId) REFERENCES Teams(id)
);

CREATE TABLE Notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NULL,
    title VARCHAR(255),
    body TEXT,
    type VARCHAR(100) DEFAULT 'general',
    isRead BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Insert Data
INSERT INTO Roles (name) VALUES 
('super_admin'), ('admin'), ('team_leader'), ('team_member'), ('individual_user'),
('finance_analyst'), ('guest'), ('partner'), ('accountant'), ('manager');

INSERT INTO Permissions (name, description) VALUES
('create_admin','Create admin accounts'),
('edit_admin','Edit admin accounts'),
('delete_admin','Delete admin accounts'),
('manage_users','View/Edit/Activate/Deactivate/Delete users'),
('reset_password','Reset passwords for any user/admin'),
('assign_roles','Assign/change roles for users/admins'),
('view_teams','View all teams and members'),
('approve_teams','Approve or delete teams'),
('assign_leader','Assign/change team leaders'),
('remove_member','Remove members from teams');

INSERT INTO RolePermissions (roleId, permissionId)
SELECT r.id, p.id FROM Roles r CROSS JOIN Permissions p WHERE r.id <= 5;

INSERT INTO Users (email, phone, fullName, passwordHash, roleId) VALUES
('superadmin@finmate.com','0712345670','Super Admin','$2b$10$hash1',1),
('admin@finmate.com','0712345671','System Admin','$2b$10$hash2',2),
('leader@finmate.com','0712345672','Team Leader','$2b$10$hash3',3),
('user1@finmate.com','0712345673','User One','$2b$10$hash4',5),
('user2@finmate.com','0712345674','User Two','$2b$10$hash5',5),
('user3@finmate.com','0712345675','User Three','$2b$10$hash6',5),
('user4@finmate.com','0712345676','User Four','$2b$10$hash7',5),
('user5@finmate.com','0712345677','User Five','$2b$10$hash8',5),
('user6@finmate.com','0712345678','User Six','$2b$10$hash9',5),
('user7@finmate.com','0712345679','User Seven','$2b$10$hash10',5);

INSERT INTO Teams (name, leaderId) VALUES
('Finance Team',3), ('Marketing Team',4), ('Development Team',5),
('HR Team',6), ('Operations Team',7), ('Research Team',8),
('Support Team',9), ('Strategy Team',10), ('Audit Team',2),
('Project Team',1);

INSERT INTO TeamMembers (teamId, userId, role) VALUES
(1,3,'leader'),(1,4,'member'),(2,5,'leader'),(2,6,'member'),
(3,7,'leader'),(3,8,'member'),(4,9,'leader'),(4,10,'member'),
(5,1,'leader'),(5,2,'member');

INSERT INTO Expenses (userId, teamId, itemName, category, description, price, paymentMethod, datePurchased) VALUES
(4,NULL,'Lunch','Food','Lunch at Cafe',350,'Cash','2025-10-07'),
(5,NULL,'Coffee','Food','Morning coffee',200,'Card','2025-10-07'),
(6,2,'Software License','Tech','Monthly software subscription',1500,'Card','2025-10-06'),
(7,NULL,'Book','Education','Programming book',1200,'Cash','2025-10-05'),
(8,3,'Office Chair','Office','Ergonomic chair',5000,'Card','2025-10-04'),
(9,NULL,'Groceries','Food','Weekly groceries',4000,'Cash','2025-10-03'),
(10,1,'Taxi','Transport','Ride to work',800,'Cash','2025-10-02'),
(1,NULL,'Flight Ticket','Travel','Business trip',20000,'Card','2025-09-30'),
(2,NULL,'Conference','Education','Tech conference',15000,'Card','2025-09-29'),
(3,NULL,'Printer Ink','Office','Printer maintenance',3500,'Cash','2025-09-28');

INSERT INTO PlannedExpenses (userId, teamId, itemName, category, expectedPrice, plannedDate, isConverted) VALUES
(4,NULL,'Book','Education',1200,'2025-10-15',FALSE),(5,NULL,'Laptop','Tech',60000,'2025-10-20',FALSE),
(6,NULL,'Conference Ticket','Education',5000,'2025-11-01',FALSE),(7,NULL,'New Chair','Office',4500,'2025-10-18',FALSE),
(8,NULL,'Headphones','Tech',8000,'2025-10-25',FALSE),(9,NULL,'Groceries','Food',3000,'2025-10-10',FALSE),
(10,NULL,'Flight','Travel',20000,'2025-11-05',FALSE),(1,NULL,'Subscription','Tech',1000,'2025-10-12',FALSE),
(2,NULL,'Workshop','Education',7000,'2025-10-22',FALSE),(3,NULL,'Printer','Office',8000,'2025-10-28',FALSE);

INSERT INTO LentMoney (lenderId, borrowerName, amount, dateLent, expectedRepaymentDate, repaymentMethod, status) VALUES
(4,'John Doe',1000,'2025-09-01','2025-09-10','Cash','unpaid'),
(5,'Jane Smith',500,'2025-09-05','2025-09-15','Bank Transfer','unpaid'),
(6,'Mike Brown',2000,'2025-09-07','2025-09-20','Cash','paid'),
(7,'Anna Lee',1500,'2025-09-08','2025-09-18','Card','unpaid'),
(8,'Tom Clark',2500,'2025-09-09','2025-09-25','Cash','unpaid'),
(9,'Lucy Green',3000,'2025-09-10','2025-09-30','Bank Transfer','paid'),
(10,'Mark White',1200,'2025-09-11','2025-09-21','Cash','unpaid'),
(1,'Sara Black',800,'2025-09-12','2025-09-22','Card','paid'),
(2,'Peter Gray',2200,'2025-09-13','2025-09-27','Cash','unpaid'),
(3,'Emma Blue',1700,'2025-09-14','2025-09-29','Card','unpaid');

INSERT INTO Savings (userId, teamId, goalName, amount, targetAmount, type, note) VALUES
(4,NULL,'Emergency Fund',5000,20000,'Personal','For emergencies'),
(5,NULL,'Vacation',10000,50000,'Personal','Summer trip'),
(6,NULL,'New Laptop',20000,80000,'Personal','Work purposes'),
(7,NULL,'Office Setup',15000,40000,'Team','Better workspace'),
(8,NULL,'Car',25000,150000,'Personal','Personal transportation'),
(9,NULL,'Home Renovation',30000,100000,'Personal','Improve living space'),
(10,NULL,'Course Fee',12000,40000,'Personal','Learning expenses'),
(1,NULL,'Conference',20000,60000,'Team','Professional growth'),
(2,NULL,'Investment',50000,200000,'Personal','Future plans'),
(3,NULL,'Emergency Fund',8000,25000,'Personal','Unexpected needs');

INSERT INTO Budgets (userId, teamId, periodStart, periodEnd, category, amount) VALUES
(4,NULL,'2025-10-01','2025-10-31','Food',15000),(5,NULL,'2025-10-01','2025-10-31','Transport',10000),
(6,NULL,'2025-10-01','2025-10-31','Office',20000),(7,NULL,'2025-10-01','2025-10-31','Education',12000),
(8,NULL,'2025-10-01','2025-10-31','Health',8000),(9,NULL,'2025-10-01','2025-10-31','Entertainment',5000),
(10,NULL,'2025-10-01','2025-10-31','Savings',20000),(1,NULL,'2025-10-01','2025-10-31','Travel',30000),
(2,NULL,'2025-10-01','2025-10-31','Tech',25000),(3,NULL,'2025-10-01','2025-10-31','Misc',10000);

INSERT INTO Notifications (userId, title, body, type) VALUES
(4,'Welcome','Your account is ready','general'),
(5,'Budget Alert','You are close to exceeding your budget','alert'),
(6,'Payment Reminder','Your subscription is due','reminder'),
(7,'Goal Update','You are 50% toward your savings goal','update'),
(8,'Lending Reminder','A repayment is due soon','reminder'),
(9,'Team Notice','Team meeting tomorrow','general'),
(10,'Expense Alert','New expense recorded','alert'),
(1,'Report Ready','Your monthly report is ready','report'),
(2,'System Update','System maintenance tonight','update'),
(3,'Security Alert','New login from unknown device','alert');
