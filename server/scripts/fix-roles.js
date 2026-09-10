require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { getDb, initializeDatabase, runSql, saveDb, queryAll } = require('../database/database');

(async () => {
  const db = await getDb();
  initializeDatabase(db);
  runSql("UPDATE users SET role='user' WHERE role='editor'");
  saveDb();
  const users = queryAll('SELECT id,name,email,role FROM users');
  console.log('Users after fix:', users);
})();
