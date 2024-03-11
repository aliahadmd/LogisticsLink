// Import Sequelize
import { Sequelize } from "sequelize";

// Create a Sequelize instance with PostgreSQL
const sequelize = new Sequelize(
  process.env.DB_NAME, // Database name
  process.env.DB_USER, // Database user
  process.env.DB_PASSWORD, // Database password
  {
    host: process.env.DB_HOST, // Hostname of the PostgreSQL service in Docker Compose
    dialect: "postgres", // Specify PostgreSQL as the dialect
    port: 5432, // Default PostgreSQL port
  }
);

export default sequelize;
