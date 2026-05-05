import dotenv from "dotenv"; 
import { PrismaPg } from "@prisma/adapter-pg"; //This imports Prisma’s Postgres adapter.
import { PrismaClient } from "../generated/prisma/client.js";//This imports your generated Prisma client. PrismaClient is the main object your app uses to query the database.

dotenv.config({ path: "../.env" }); 

const connectionString = process.env.DATABASE_URL; 

if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}

const adapter  = new PrismaPg({connectionString}); 
//Prisma, use the pg Postgres driver, and here is the database URL you should connect with.
export const prisma = new PrismaClient({ adapter }); 
//Create the Prisma API object my server code will use, and make it use that Postgres adapter.