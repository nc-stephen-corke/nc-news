# NC News Example API

### Setup

- Create a fresh GitHub repo and push this up
- Follow [Hosting Notes](https://notes.northcoders.com/courses/js-back-end/api-hosting) to host api with render and database with elephant sql.
- `.env` files will be required if you wish to:
  - Run tests locally
    - `.env.test -> PGDATABASE=<db_name>`
  - Run server locally
    - `.env.development -> PGDATABASE=<db_name>`
  - Seed production database
    - `.env.production -> DATABASE_URL=<hosted database url>`

### Workflow

- Example workflow triggers on pull requests to main as deployments to render are already tracked via new commits on main

Jobs include:

- `greeting`
  - Initial example to show basic interaction with VM
- `test-utils`
  - Test only the util functions concurrently with the `greeting` job
- `test-app`
  - Runs integration tests on a local database upon successful completion of `test-utils`
- `test-app-live-database`
  - Runs same integration tests with a hosted database on elephant upon successful completion of `test-app`
  - The inclusion of this job was a good reason to showcase secrets and hide genuinely sensitive information
    - If you wish to do this, you'll want an extra hosted database available and have its DATABASE_URL stored as a GitHub Secret
