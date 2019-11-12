const express = require("express");
const uuid = require("uuid/v4");
const logger = require("../logger");
const store = require("../store");

const bookmarksRouter = express.Router();
const bodyParser = express.json();

bookmarksRouter
  .route("/bookmarks")
  .get((req, res) => {
    res.json(store.bookmarks);
  })
  .post(bodyParser, (req, res) => {
    const { title, url, description, rating } = req.body;
    if (!title) {
      logger.error(`Title is required`);
      return res.status(400).send("title is required");
    }

    if (!url) {
      logger.error(`url is required`);
      return res.status(400).send("url is required");
    }
    if (!description) {
      logger.error(`description is required`);
      return res.status(400).send("description is required");
    }

    if (!rating) {
      logger.error(`rating is required`);
      return res.status(400).send("rating");
    }

    const id = uuid();

    const bookmark = {
      id: uuid(),
      title,
      url,
      description,
      rating
    };

    store.bookmarks.push(bookmark);
    logger.info(`Bookmark with id ${id} created`);

    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${id}`)
      .json(bookmark);
  });

bookmarksRouter
  .route("/bookmarks/:id")
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = store.bookmarks.find(c => c.id == id);

    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found`);
      return res.status(404).send("404 Not Found");
    }
    res.json(bookmark);
  })
  .delete((req, res) => {
    const { id } = req.params;

    const bookmarkIndex = store.bookmarks.findIndex(b => b.id == id);

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found`);
      return res.status(404).send("Not Found");
    }
    store.bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted.`);
    res.status(204).end();
  });

module.exports = bookmarksRouter;

