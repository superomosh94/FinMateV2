USE defaultdb;

-- Add 'status' column to expenses table
ALTER TABLE expenses 
ADD COLUMN status VARCHAR(50) DEFAULT 'pending';

-- Create incomes table
CREATE TABLE IF NOT EXISTS incomes (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  team_id INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  source VARCHAR(100) DEFAULT NULL,
  category VARCHAR(100) DEFAULT NULL,
  received_date DATE NOT NULL,
  status ENUM('pending','cleared','cancelled') DEFAULT 'cleared',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  INDEX idx_incomes_user_id (user_id),
  INDEX idx_incomes_received_date (received_date),
  INDEX idx_incomes_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
