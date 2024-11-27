const request = require('supertest');

const app = require('../app');
const db = require('../db/connection');
const seed = require('../db/seed');
const data = require('../db/data/test-data');

describe('/', () => {
  beforeEach(() => seed(data));
  afterAll(() => db.end());

  describe('/api', () => {
    it('GET status:200', async () => {
      const { body } = await request(app).get('/api').expect(200);
      expect(body.ok).toBe(true);
    });

    describe('/topics', () => {
      it('GET status:200, serves all topics', async () => {
        const { body } = await request(app).get('/api/topics').expect(200);
        expect(body).toContainKeys(['topics']);
        expect(body.topics).toBeArray();
        expect(body.topics.length).toBe(3);
        expect(body.topics[0]).toContainKeys(['slug', 'description']);
      });
      it('INVALID METHOD status:405', async () => {
        const { body } = await request(app).put('/api/topics').expect(405);
        expect(body.msg).toBe('Method Not Allowed');
      });
    });

    describe('/articles', () => {
      it('GET status:200, serves an array of articles', async () => {
        const { body } = await request(app).get('/api/articles').expect(200);
        expect(body).toContainKeys(['articles']);
        expect(body.articles).toBeArray();
        expect(body.articles[0]).toContainKeys([
          'article_id',
          'author',
          'title',
          'topic',
          'created_at',
          'votes',
        ]);
      });
      it('GET status:200, articles are sorted descending by date by default', async () => {
        const { body } = await request(app).get('/api/articles').expect(200);
        expect(body.articles).toBeSortedBy('created_at', { descending: true });
      });
      it('GET status:200, each article has a comment count', async () => {
        const { body } = await request(app).get('/api/articles').expect(200);
        expect(body.articles[1].comment_count).toBe('1');
        expect(body.articles[3].comment_count).toBe('0');
      });
      it('GET status:200, accepts a sort_by query to sort articles', async () => {
        const { body } = await request(app)
          .get('/api/articles?sort_by=votes')
          .expect(200);
        expect(body.articles).toBeSortedBy('votes', { descending: true });
      });
      it('GET status:400, when passed an invalid sort_by query', async () => {
        const { body } = await request(app)
          .get('/api/articles?sort_by=not-a-column')
          .expect(400);
        expect(body.msg).toBe('Invalid sort by query');
      });
      it('GET status:200, accepts an order query (asc / desc)', async () => {
        const { body } = await request(app)
          .get('/api/articles?order=asc')
          .expect(200);
        expect(body.articles).toBeSortedBy('created_at');
      });
      it('GET status:400, when passed an invalid order query', async () => {
        const { body } = await request(app)
          .get('/api/articles?order=not-asc-or-desc')
          .expect(400);
        expect(body.msg).toBe('Invalid order query');
      });
      it('GET status:400, when passed an invalid order query', async () => {
        const { body } = await request(app)
          .get('/api/articles?order=not-asc-or-desc')
          .expect(400);
        expect(body.msg).toBe('Invalid order query');
      });
      it('GET status:200, accepts a topic query', async () => {
        const { body } = await request(app)
          .get('/api/articles?topic=cats')
          .expect(200);
        expect(body.articles).toSatisfy((articles) => {
          return articles.every(({ topic }) => topic === 'cats');
        });
      });
      it('GET status:200, when passed a topic that exists, but has no articles', async () => {
        const { body } = await request(app)
          .get('/api/articles?topic=paper')
          .expect(200);
        expect(body.articles).toEqual([]);
      });
      it('GET status:404, when passed an topic that does not exist', async () => {
        const { body } = await request(app)
          .get('/api/articles?topic=not-a-topic')
          .expect(404);
        expect(body.msg).toBe('Topic Not Found');
      });
      it('INVALID METHOD status:405', async () => {
        const { body } = await request(app).put('/api/articles').expect(405);
        expect(body.msg).toBe('Method Not Allowed');
      });

      describe('/:article_id', () => {
        it('GET status:200, serves up an article by id', async () => {
          const { body } = await request(app)
            .get('/api/articles/2')
            .expect(200);
          expect(body).toContainKeys(['article']);
          expect(body.article).toBeObject();
          expect(body.article).toContainKeys([
            'article_id',
            'author',
            'title',
            'topic',
            'created_at',
            'votes',
          ]);
          expect(body.article.article_id).toBe(2);
        });
        it('GET status:200, serves up an article with corresponding comment_count', async () => {
          const { body } = await request(app)
            .get('/api/articles/2')
            .expect(200);
          expect(body.article.comment_count).toBe('0');
        });
        it('GET status:404, when passed a valid non-existent article_id', async () => {
          const { body } = await request(app)
            .get('/api/articles/9999')
            .expect(404);
          expect(body.msg).toBe('article_id not found');
        });
        it('GET status:400, when passed an invalid article_id', async () => {
          const { body } = await request(app)
            .get('/api/articles/not-a-valid-id')
            .expect(400);
          expect(body.msg).toBe('Bad Request');
        });
        it('INVALID METHOD status:405', async () => {
          const { body } = await request(app)
            .put('/api/articles/1')
            .expect(405);
          expect(body.msg).toBe('Method Not Allowed');
        });

        it('PATCH status:200, increments the votes when passed inc_votes value of 1', async () => {
          const { body } = await request(app)
            .patch('/api/articles/1')
            .send({ inc_votes: 1 })
            .expect(200);
          expect(body.article.votes).toBe(101);
        });
        it('PATCH status:200, increments the votes when passed inc_votes value', async () => {
          const { body } = await request(app)
            .patch('/api/articles/2')
            .send({ inc_votes: 2 })
            .expect(200);
          expect(body.article.votes).toBe(2);
        });
        it('PATCH status:200, increments the votes when passed a negative inc_votes value', async () => {
          const { body } = await request(app)
            .patch('/api/articles/4')
            .send({ inc_votes: -2 })
            .expect(200);
          expect(body.article.votes).toBe(-2);
        });
        it('PATCH status:200, votes do not change when not passed an inc_votes value', async () => {
          const { body } = await request(app)
            .patch('/api/articles/5')
            .send({})
            .expect(200);
          expect(body.article.votes).toBe(0);
        });
        it('PATCH status:200, votes changes persist', async () => {
          await request(app)
            .patch('/api/articles/6')
            .send({ inc_votes: -5 })
            .expect(200);
          const { body } = await request(app)
            .patch('/api/articles/6')
            .send({ inc_votes: -1 })
            .expect(200);
          expect(body.article.votes).toBe(-6);
        });
        it('PATCH status:404, when passed a valid non-existant article_id', async () => {
          const article_id = 10000;
          const { body } = await request(app)
            .patch(`/api/articles/${article_id}`)
            .send({})
            .expect(404);
          expect(body.msg).toBe(`Article with id: ${article_id} not found`);
        });
        it('PATCH status:400, when passed a malformed article_id', async () => {
          const { body } = await request(app)
            .patch('/api/articles/not-an-id')
            .send({})
            .expect(400);
          expect(body.msg).toBe('Bad Request');
        });
        it('PATCH status:400, when passed an invalid inc_votes property', async () => {
          const { body } = await request(app)
            .patch('/api/articles/1')
            .send({ inc_votes: 'not a number' })
            .expect(400);
          expect(body.msg).toBe('Bad Request');
        });

        describe('/comments', () => {
          it('GET status:200, serves an array of all comments belonging to an article', async () => {
            const { body } = await request(app)
              .get('/api/articles/1/comments')
              .expect(200);
            expect(body).toContainKeys(['comments']);
            expect(body.comments).toBeArray();
            expect(body.comments[0]).toContainKeys([
              'comment_id',
              'body',
              'article_id',
              'author',
              'votes',
              'created_at',
            ]);
            expect(body.comments).toSatisfy((comments) => {
              return comments.every(({ article_id }) => {
                return article_id === 1;
              });
            });
          });
          it('GET status:404, when passed a valid non-existent article_id', async () => {
            const { body } = await request(app)
              .get('/api/articles/1000/comments')
              .expect(404);
            expect(body.msg).toBe('Article Not Found');
          });
          it('GET status:200, serves an empty array when article has no comments', async () => {
            const { body } = await request(app)
              .get('/api/articles/2/comments')
              .expect(200);
            expect(body.comments).toEqual([]);
          });
          it('GET status:200, comments are sorted by date created by default', async () => {
            const { body } = await request(app)
              .get('/api/articles/1/comments')
              .expect(200);
            expect(body.comments).toBeSortedBy('created_at', {
              descending: true,
            });
          });
          it('GET status:200, accepts a sort_by query', async () => {
            const { body } = await request(app)
              .get('/api/articles/1/comments?sort_by=votes')
              .expect(200);
            expect(body.comments).toBeSortedBy('votes', { descending: true });
          });
          it('GET status:400, for invalid sort_by query', async () => {
            const { body } = await request(app)
              .get('/api/articles/1/comments?sort_by=not-a-column')
              .expect(400);
            expect(body.msg).toBe('Invalid sort by query');
          });
          it('GET status:200, accepts an order query', async () => {
            const { body } = await request(app)
              .get('/api/articles/1/comments?order=asc')
              .expect(200);
            expect(body.comments).toBeSortedBy('created_at');
          });
          it('GET status:400, for invalid order query', async () => {
            const { body } = await request(app)
              .get('/api/articles/1/comments?order=not-asc-or-desc')
              .expect(400);
            expect(body.msg).toBe('Invalid order query');
          });

          it('POST status:201, returns new comment when passed a valid comment', async () => {
            const commentToPost = { body: 'new comment', username: 'rogersop' };
            const { body } = await request(app)
              .post('/api/articles/1/comments')
              .send(commentToPost)
              .expect(201);
            expect(body.comment).toContainKeys([
              'comment_id',
              'body',
              'author',
              'created_at',
              'votes',
              'article_id',
            ]);
            expect(body.comment.body).toBe(commentToPost.body);
            expect(body.comment.author).toBe(commentToPost.username);
            expect(body.comment.votes).toBe(0);
            expect(body.comment.article_id).toBe(1);
          });
          it('POST status:400, when posted comment is missing properties', async () => {
            const commentToPost = { username: 'rogersop' };
            const { body } = await request(app)
              .post('/api/articles/2/comments')
              .send(commentToPost)
              .expect(400);
            expect(body.msg).toBe('Bad Request');
          });
          it('POST status:404, when given a non-existent article_id', async () => {
            const commentToPost = { body: 'new comment', username: 'rogersop' };
            const { body } = await request(app)
              .post('/api/articles/1000/comments')
              .send(commentToPost)
              .expect(404);
            expect(body.msg).toBe('Not Found');
          });

          it('INVALID METHOD status:405', async () => {
            const { body } = await request(app)
              .put('/api/articles/1/comments')
              .expect(405);
            expect(body.msg).toBe('Method Not Allowed');
          });
        });
      });
    });

    describe('/comments', () => {
      describe('/:comment_id', () => {
        it('PATCH status:200, increments votes when passed a inc_vote property', async () => {
          const { body } = await request(app)
            .patch('/api/comments/1')
            .send({ inc_votes: 1 })
            .expect(200);
          expect(body.comment.votes).toBe(17);
        });
        it('PATCH status:200, votes stay the same when not sent inc_votes property', async () => {
          const { body } = await request(app)
            .patch('/api/comments/3')
            .send({})
            .expect(200);
          expect(body.comment.votes).toBe(100);
        });
        it('PATCH status:200, votes are persistent', async () => {
          await request(app)
            .patch('/api/comments/2')
            .send({ inc_votes: 10 })
            .expect(200);
          const { body } = await request(app)
            .patch('/api/comments/2')
            .send({ inc_votes: 1 })
            .expect(200);
          expect(body.comment.votes).toBe(25);
        });
        it('PATCH status:400, when sent an invalid inc_votes property', async () => {
          const { body } = await request(app)
            .patch('/api/comments/1')
            .send({ inc_votes: 'not a number' })
            .expect(400);
          expect(body.msg).toBe('Bad Request');
        });
        it('PATCH status:404, when sent an valid non-existent comment_id', async () => {
          const { body } = await request(app)
            .patch('/api/comments/1000')
            .send({ inc_votes: 1 })
            .expect(404);
          expect(body.msg).toBe('comment not found');
        });
        it('PATCH status:400, when sent an invalid comment_id', async () => {
          const { body } = await request(app)
            .patch('/api/comments/not-an-id')
            .send({ inc_votes: 1 })
            .expect(400);
          expect(body.msg).toBe('Bad Request');
        });

        it('DELETE status:204, deletes a comment', () => {
          return request(app).delete('/api/comments/1').expect(204);
        });
        it('DELETE status:404, when passed valid id that does not exist', async () => {
          const { body } = await request(app)
            .delete('/api/comments/1000')
            .expect(404);
          expect(body.msg).toBe('comment not found');
        });
        it('DELETE status:400, when passed an invalid id', async () => {
          const { body } = await request(app)
            .delete('/api/comments/not-an-id')
            .expect(400);
          expect(body.msg).toBe('Bad Request');
        });

        it('INVALID METHOD status:405', async () => {
          const { body } = await request(app)
            .put('/api/comments/1')
            .expect(405);
          expect(body.msg).toBe('Method Not Allowed');
        });
      });
    });

    describe('/users', () => {
      describe('/', () => {
        it('GET status:200, serves all users', async () => {
          const { body } = await request(app).get('/api/users').expect(200);
          expect(body).toContainKeys(['users']);
          expect(body.users).toBeArray();
          expect(body.users.length).toBe(4);
          expect(body.users[0]).toContainKeys([
            'username',
            'name',
            'avatar_url',
          ]);
        });
        it('INVALID METHOD status:405', async () => {
          const { body } = await request(app).put('/api/users').expect(405);
          expect(body.msg).toBe('Method Not Allowed');
        });
      });
      describe('/:username', () => {
        it('GET status:200, serves up correct user', async () => {
          const { body } = await request(app)
            .get('/api/users/rogersop')
            .expect(200);
          expect(body).toContainKeys(['user']);
          expect(body.user).toContainKeys(['username', 'avatar_url', 'name']);
          expect(body.user.username).toBe('rogersop');
        });
        it('GET status:404, when passed a valid username that does not exist', async () => {
          const { body } = await request(app)
            .get('/api/users/not-a-user')
            .expect(404);
          expect(body.msg).toBe('user not found');
        });

        it('INVALID METHOD status:405', async () => {
          const { body } = await request(app)
            .put('/api/users/rogersop')
            .expect(405);
          expect(body.msg).toBe('Method Not Allowed');
        });
      });
    });
  });
});
