import "reflect-metadata";
import { DataSource } from "typeorm";
import { Contact } from "./entities/Contact";
import dotenv from 'dotenv';

dotenv.config();

const isDevelopment = process.env.NODE_ENV !== "production";
const useMySQL = process.env.DB_HOST && process.env.DB_USERNAME && process.env.DB_PASSWORD;

export const AppDataSource = new DataSource(
    isDevelopment 
        ? {
            // SQLite configuration for development
            type: "sqlite",
            database: "./fluxkart_identity.db",
            synchronize: true,
            logging: false,
            entities: [Contact],
            migrations: [],
            subscribers: [],
        }
        : useMySQL 
        ? {
            // MySQL configuration for production (when all MySQL env vars are provided)
            type: "mysql",
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || "3306"),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || "fluxkart_identity",
            synchronize: false,
            logging: false,
            entities: [Contact],
            migrations: [],
            subscribers: [],
        }
        : {
            // SQLite configuration for production (when MySQL not configured)
            type: "sqlite",
            database: "./fluxkart_identity_prod.db",
            synchronize: true,
            logging: false,
            entities: [Contact],
            migrations: [],
            subscribers: [],
        }
);