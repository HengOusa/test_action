# Node.js Setup for GitHub Actions Testing

This guide shows how to set up a Node.js API project on Windows 11, write automated tests, and use GitHub Actions to run those tests when code is pushed to `main` or a pull request targets `main`.

## 1. Understand the workflow

The workflow runs these steps:

1. A developer pushes code to GitHub or opens a pull request targeting `main`.
2. GitHub Actions starts a clean Ubuntu runner.
3. The runner checks out the repository and sets up Node.js.
4. Dependencies are installed.
5. `npm test` runs the automated tests.
6. GitHub reports whether the workflow passed or failed.

## 2. Create your Node.js project

Open the VS Code terminal on Windows 11 and run:

```bash
mkdir test_action
cd test_action
npm init -y
```

Install Express and the testing tools:

```bash
npm install express
npm install --save-dev jest supertest
```

- **Express** builds the API.
- **Jest** runs automated tests.
- **Supertest** sends HTTP requests to the API during tests.

## 3. Configure `package.json`

Keep the dependencies and versions that npm installed. Make sure the `scripts` section includes:

```json
"scripts": {
  "start": "node app.js",
  "test": "jest --runInBand"
}
```

Do not replace your entire `package.json` with example dependency versions. Edit only the relevant scripts if needed.

## 4. Create the API

Create `app.js` in the project root:

```javascript
const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is working!"
  });
});

app.post("/api/subscribe", (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({
      success: false,
      message: "A valid email is required."
    });
  }

  return res.status(201).json({
    success: true,
    message: "Subscribed successfully!",
    data: { email }
  });
});

// Export the app so tests can import it.
module.exports = app;

// Start the server only when running `node app.js`.
if (require.main === module) {
  app.listen(3000, () => {
    console.log("API running at http://localhost:3000");
  });
}
```

This example uses CommonJS (`require` and `module.exports`). If your `package.json` contains `"type": "module"`, either remove that field for this beginner example or convert the code to ES modules.

## 5. Write automated tests

Create `app.test.js` in the project root:

```javascript
const request = require("supertest");
const app = require("./app");

describe("Node.js API tests", () => {
  test("GET / should return 200", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("API is working!");
  });

  test("POST /api/subscribe should accept a valid email", async () => {
    const response = await request(app)
      .post("/api/subscribe")
      .send({ email: "ousa@example.com" });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe("ousa@example.com");
  });

  test("POST /api/subscribe should reject an invalid email", async () => {
    const response = await request(app)
      .post("/api/subscribe")
      .send({ email: "invalid-email" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

These tests check:

- `GET /` returns a successful response.
- A valid email can subscribe.
- An invalid email is rejected.

## 6. Run tests locally

Run:

```bash
npm test
```

You should see three passing tests, similar to:

```text
PASS  ./app.test.js

Node.js API tests
  ✓ GET / should return 200
  ✓ POST /api/subscribe should accept a valid email
  ✓ POST /api/subscribe should reject an invalid email

Tests: 3 passed, 3 total
```

The exact output formatting may differ. If a test fails, read the error output and fix the issue before continuing.

## 7. Create the GitHub Actions workflow

Create this directory and file:

```text
node-api/
├── .github/
│   └── workflows/
│       └── test.yml
├── app.js
├── app.test.js
├── package.json
├── package-lock.json
└── node_modules/
```

Add the following to `.github/workflows/test.yml`:

```yaml
name: Test API

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

permissions:
  contents: read

jobs:
  test:
    name: Run Node.js Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v7

      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: "24"
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
```

### What each workflow section means

- `name`: the workflow name displayed in GitHub Actions.
- `on.push`: run when commits are pushed to `main`.
- `on.pull_request`: run for pull requests targeting `main`.
- `runs-on: ubuntu-latest`: use a hosted Ubuntu runner.
- `actions/checkout`: checks out the repository code.
- `actions/setup-node`: configures Node.js 24.
- `cache: npm`: caches npm's download cache to speed up future runs.
- `npm ci`: installs dependencies from the committed `package-lock.json`.
- `npm test`: runs the test script defined in `package.json`.

> **Note:** GitHub Actions action versions can change. If your organization requires specific approved versions, use those versions. The workflow above uses the versions shown in this guide.

## 8. Add a `.gitignore` file

Create `.gitignore` in the project root:

```gitignore
node_modules/
.env
coverage/
```

Do not commit `node_modules/` or secret environment files. Commit `package-lock.json` so `npm ci` can install the locked dependencies.

## 9. Push the project to GitHub

First, run tests locally:

```bash
npm test
```

Then commit and push your files:

```bash
git add app.js app.test.js package.json package-lock.json .gitignore .github/workflows/test.yml
git commit -m "Add automated API tests"
git push origin main
```

If Git has not been initialized or the remote has not been configured, initialize the repository and set the correct GitHub remote before pushing.

## 10. Check the results on GitHub

1. Open your repository on GitHub.
2. Click the **Actions** tab.
3. Open the latest run named **Test API**.
4. Inspect the steps.
5. Confirm that **Run tests** succeeded.

A green check means the workflow passed. A red X means a step failed; open the logs to investigate the error.

## 11. Troubleshooting

### `npm ci` fails

- Confirm that `package-lock.json` exists and is committed.
- Run `npm install` locally to update the lock file after dependency changes.
- Commit the updated `package.json` and `package-lock.json`.

### `npm test` fails locally

- Check that `jest` and `supertest` are installed as development dependencies.
- Confirm `package.json` contains `"test": "jest --runInBand"`.
- Ensure `app.js` exports the Express app with `module.exports = app`.
- Check the test output for the failing assertion.

### Workflow does not run

- Confirm `.github/workflows/test.yml` is committed to the repository.
- Verify the branch is named `main`.
- Confirm the push or pull request targets `main`.
- Check the repository's Actions settings and workflow permissions.

### `require is not defined`

This often happens when the project uses `"type": "module"` in `package.json` but the code uses CommonJS. For this beginner example, remove `"type": "module"` or convert the files to ES module syntax consistently.

## 12. Final checklist

- [ ] Node.js and npm are installed.
- [ ] Express, Jest, and Supertest are installed.
- [ ] `app.js` and `app.test.js` are created.
- [ ] `npm test` passes locally.
- [ ] `.github/workflows/test.yml` is created.
- [ ] `package-lock.json` is committed.
- [ ] `.gitignore` excludes `node_modules/` and `.env`.
- [ ] Code is pushed to `main`.
- [ ] GitHub Actions completes successfully.

## 13. Next steps

Once this workflow works, add tests for your real application features, such as:

- User registration and login
- Subscribe and unsubscribe
- Database operations
- Input validation and error handling
- Authentication and authorization

For database tests, use a separate test database. Never run destructive automated tests against production data.

## Official resources

- [Node.js downloads](https://nodejs.org/en/download)
- [GitHub Actions: Building and testing Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs)
- [Jest documentation](https://jestjs.io/docs/getting-started)
- [Supertest documentation](https://github.com/ladjs/supertest)
- [Express documentation](https://expressjs.com/)
