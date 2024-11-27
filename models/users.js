const db = require('../db/connection');

exports.selectUsers = async () => {
  const result = await db.query(`SELECT * FROM USERS;`);
  return result.rows;
};

exports.selectUserByUsername = async (username) => {
  const user = await db
    .query(`SELECT * FROM USERS WHERE username = $1;`, [username])
    .then((result) => result.rows[0]);
  if (!user) return Promise.reject({ status: 404, msg: 'user not found' });
  return user;
};
