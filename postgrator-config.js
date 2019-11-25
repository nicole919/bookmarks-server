require("dotenv").config();

console.log("DB BITCH: ", process.env.DATABASE_URL);
module.exports = {
  validateChecksums: false,
  migrationDirectory: "migrations",
  driver: "pg",
  connectionString:
    process.env.NODE_ENV === "test"
      ? process.env.TEST_DATABASE_URL
      : process.env.DATABASE_URL,
  ssl: !!process.env.SSL
};
