const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true // Crucial for executing full dumps
};

async function seed() {
    let connection;
    try {
        console.log('🚀 Starting database seeding...');
        console.log(`📊 Connecting to: ${dbConfig.host} / ${dbConfig.database}`);

        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        const sqlPath = path.join(__dirname, '..', 'backup_utf8.sql');

        // Read the SQL file. Handle potential BOM
        console.log('📖 Reading backup_utf8.sql...');
        let sql = fs.readFileSync(sqlPath, 'utf8');

        // Remove BOM if present
        if (sql.charCodeAt(0) === 0xFEFF) {
            console.log('🧹 Removing UTF-8 BOM...');
            sql = sql.slice(1);
        }

        // Replace incompatible collation (often from newer MySQL versions)
        console.log('🔄 Fixing collation incompatibilities...');
        sql = sql.replace(/utf8mb4_0900_ai_ci/g, 'utf8mb4_unicode_ci');
        sql = sql.replace(/utf8mb4_general_ci/g, 'utf8mb4_unicode_ci');

        // Basic cleaning - removing some common dump headers that might cause issues if not handled by mysql2
        // but usually mysql2 handles them fine if passed as a single string with multipleStatements: true

        console.log('⏳ Executing SQL statements... This might take a moment.');
        await connection.query(sql);

        console.log('✨ Seeding completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        if (error.message.includes('malformed')) {
            console.log('💡 Retrying with utf8 encoding...');
            try {
                const sqlPath = path.join(__dirname, '..', 'backup_full.sql');
                let sql = fs.readFileSync(sqlPath, 'utf8');
                await connection.query(sql);
                console.log('✨ Seeding completed successfully (with utf8)!');
                return;
            } catch (retryError) {
                console.error('❌ Retry failed:', retryError.message);
            }
        }
    } finally {
        if (connection) await connection.end();
    }
}

seed();
