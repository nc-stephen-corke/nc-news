const { selectUsers, selectUserByUsername } = require('../models/users');

exports.getUsers = async (req, res) => {
  const users = await selectUsers();
  res.send({ users });
};

exports.getUser = async (req, res) => {
  const { username } = req.params;
  const user = await selectUserByUsername(username);
  res.send({ user });
};
