const bcrypt = require('bcryptjs');

async function generatePasswordHash(password) {
  try {
    const saltRounds = 12; // Adjust for security vs performance
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Hashed Password:', hash);
  } catch (error) {
    console.error('Error hashing password:', error);
  }
}

// Example usage
generatePasswordHash('password123');
