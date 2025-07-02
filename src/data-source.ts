import "reflect-metadata";
import { DataSource } from "typeorm";
import { Contact } from "./entities/Contact";
import dotenv from 'dotenv';

dotenv.config();

const isDevelopment = process.env.NODE_ENV !== "production";

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
        : {
            // MySQL configuration for production
            type: "mysql",
            host: process.env.DB_HOST || "localhost",
            port: parseInt(process.env.DB_PORT || "3306"),
            username: process.env.DB_USERNAME || "root",
            password: process.env.DB_PASSWORD || "password",
            database: process.env.DB_NAME || "fluxkart_identity",
            synchronize: false,
            logging: false,
            entities: [Contact],
            migrations: [],
            subscribers: [],
        }
);