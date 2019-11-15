const knex = require("knex");
const fixtures = require("./bookmarks-fixtures");
const app = require("..src/app");
const store = require("..src/store");

describe("Bookmarks Endpoints", () => {
  let bookmarksCopy, db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL
    });
    app.set("db", db);
  });
  after("disconnect from db", () => db.destory());
  before("cleanup", () => db("bookmarks").truncate());
  afterEach("cleanup", () => db("bookmarks").truncate());

  beforeEach("copy the bookmarks", () => {
    bookmarksCopy = store.bookmarks.slice();
  });
  afterEach("restore the bookmarks", () => {
    store.bookmarks = bookmarksCopy;
  });

  describe("unauthorized requests", () => {
    it("responds with 401 for GET / bookmarks", () => {
      return supertest(app)
        .get("/bookmarks")
        .expect(401, { error: "unauthorized request" });
    });

    it("responds with 401 for GET /bookmarks/:id", () => {
      const secondBookmark = store.bookmarks[1];
      return supertest(app)
        .get("/bookmarks/${secondBookmark.id")
        .expect(401, { error: "unauthorized request" });
    });
    it("responds with 401 for DELETE /bookmarks/:id", () => {
      const aBookmark = store.bookmarks[1];
      return supertest(app)
        .get("/bookmarks/${aBookmark.id")
        .expect(401, { error: "unauthorized request" });
    });
  });

  describe("GET /bookmarks", () => {
    context("given no bookmarks", () => {
      it("responds with 200 and an empty list", () => {
        return supertest(app)
          .get("/bookmarks")
          .set("authorization", `bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });
    context("given there are bookmarks in the database", () => {
      const testBookmarks = fixtures.makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });
      it("gets bookmarks from the store", () => {
        return supertest(app)
          .get("/bookmarks")
          .set("authorization", `Bearter ${process.env.API_TOKEN}`)
          .expect(200, testBookmarks);
      });
    });
  });
  describe("GET /bookmarks/:id", () => {
    context("given no bookmarks", () => {
      it("responds 404 when bookmark doesnt exist", () => {
        return supertest(app)
          .get("/bookmarks/123")
          .set("authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: "bookmark not found" }
          });
      });
    });
    context("given there are bookmarks in the database", () => {
      const testBookmarks = fixtures.makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });
      it("responds with 200 and the specified bookmark", () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get("/bookmarks/${bookmarkId}")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBookmark);
      });
    });
  });
  describe("DELETE /bookmarks/:id", () => {
    it("removes the bookmark by ID from the store", () => {
      const secondBookmark = store.bookmarks[1];
      const expectedBookmarks = store.bookmarks.filter(
        s => s.id !== secondBookmark.id
      );
      return supertest(app)
        .delete(`/bookmarks/${secondBookmark.id}`)
        .set("authorization", `Bearer ${process.env.API_TOKEN}`)
        .expect(204)
        .then(() => {
          expect(store.bookmarks).to.eql(expectedBookmarks);
        });
    });
    it("returns 404 when bookmark doesnt exist", () => {
      return supertest(app)
        .delete(`/bookmarks/doesntexist`)
        .set("authorization", `Bearer ${process.env.API_TOKEN}`)
        .expect(404, "bookmark not found");
    });
  });

  describe("POST /bookmarks", () => {
    it("responds with 400 missing title if not supplied", () => {
      const newBookmarkMissingTitle = {
        url: "https://test.com",
        rating: 1
      };
      return supertest(app)
        .post("/bookmarks")
        .send(newBookmarkMissingTitle)
        .set("authorization", `Bearer ${process.env.API_TOKEN}`)
        .expect(400, "title is required");
    });
    it(`responds with 400 missing 'url' if not supplied`, () => {
      const newBookmarkMissingUrl = {
        title: "test-title",
        // url: 'https://test.com',
        rating: 1
      };
      return supertest(app)
        .post(`/bookmarks`)
        .send(newBookmarkMissingUrl)
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .expect(400, `'url' is required`);
    });

    it(`responds with 400 missing 'rating' if not supplied`, () => {
      const newBookmarkMissingRating = {
        title: "test-title",
        url: "https://test.com"
        // rating: 1,
      };
      return supertest(app)
        .post(`/bookmarks`)
        .send(newBookmarkMissingRating)
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .expect(400, `'rating' is required`);
    });

    it(`responds with 400 invalid 'rating' if not between 0 and 5`, () => {
      const newBookmarkInvalidRating = {
        title: "test-title",
        url: "https://test.com",
        rating: "invalid"
      };
      return supertest(app)
        .post(`/bookmarks`)
        .send(newBookmarkInvalidRating)
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .expect(400, `'rating' must be a number between 0 and 5`);
    });

    it(`responds with 400 invalid 'url' if not a valid URL`, () => {
      const newBookmarkInvalidUrl = {
        title: "test-title",
        url: "htp://invalid-url",
        rating: 1
      };
      return supertest(app)
        .post(`/bookmarks`)
        .send(newBookmarkInvalidUrl)
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .expect(400, `'url' must be a valid URL`);
    });

    it("adds a new bookmark to the store", () => {
      const newBookmark = {
        title: "test-title",
        url: "https://test.com",
        description: "test description",
        rating: 1
      };
      return supertest(app)
        .post(`/bookmarks`)
        .send(newBookmark)
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body.id).to.be.a("string");
        })
        .then(res => {
          expect(store.bookmarks[store.bookmarks.length - 1]).to.eql(res.body);
        });
    });
  });
});
