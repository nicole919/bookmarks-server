module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || "development",
  API_TOKEN: process.env.API_TOKEN || "dummy-api-token",
  DATABASE_URL:
    process.env.DB_URL ||
    "postgresql://dunder_mifflin:1234@localhost/bookmarks",
  TEST_DATABASE_URL:
    process.env.DB_URL ||
    "postgresql://dunder_mifflin:1234@localhost/bookmarks-test"
};
