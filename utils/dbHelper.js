const db = require('../config/db');

async function safeQuery(sql, params = []) {
  try {
    const result = await db.query(sql, params);

    // Normalize output
    const rows = Array.isArray(result[0]) ? result[0] : result;

    console.log('✅ Query Result Type:', Array.isArray(rows) ? 'Array' : typeof rows);
    console.log('✅ Query Returned:', Array.isArray(rows) ? rows.length + ' rows' : JSON.stringify(rows));

    // Return consistent data
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return Array.isArray(rows) ? rows : [];
    }

    return rows;
  } catch (error) {
    console.error('❌ Database query failed:', error.message);
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return [];
    }
    return null;
  }
}

module.exports = { safeQuery };
