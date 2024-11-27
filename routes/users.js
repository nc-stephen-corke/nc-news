const usersRouter = require('express').Router();
const { getUser, getUsers } = require('../controllers/users');
const { withErrorHandling, methodNotAllowed } = require('../errors');

usersRouter.route('/').get(withErrorHandling(getUsers)).all(methodNotAllowed);

usersRouter
  .route('/:username')
  .get(withErrorHandling(getUser))
  .all(methodNotAllowed);

module.exports = usersRouter;
