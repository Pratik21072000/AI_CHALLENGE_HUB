import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  getAllChallenges,
  getChallengeById,
  createChallenge,
  acceptChallenge,
  getUserAcceptances,
  getChallengeAcceptances,
  withdrawChallenge,
  getChallengeAcceptanceStatus
} from "./routes/challenges";
import {
  getAllSubmissions,
  getSubmissionById,
  submitSolution,
  getAllReviews,
  reviewSubmission,
  getUserSubmissions,
  getChallengeSubmissions
} from "./routes/submissions";
import {
  getUserData,
  getAllUsers
} from "./routes/users";
import { mysqlRouter, initializeMySQL } from "./routes/mysql";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Challenge routes
  app.get("/api/challenges", getAllChallenges);
  app.get("/api/challenges/:id", getChallengeById);
  app.get("/api/challenges/:id/acceptance-status", getChallengeAcceptanceStatus);
  app.post("/api/challenges", createChallenge);
  app.post("/api/challenges/accept", acceptChallenge);
  app.get("/api/challenges/acceptances/:username", getUserAcceptances);
  app.get("/api/challenges/:id/acceptances", getChallengeAcceptances);
  app.delete("/api/challenges/accept/:id", withdrawChallenge);

  // Submission routes
  app.get("/api/submissions", getAllSubmissions);
  app.get("/api/submissions/:id", getSubmissionById);
  app.post("/api/submissions", submitSolution);
  app.get("/api/submissions/reviews", getAllReviews);
  app.patch("/api/submissions/:id/review", reviewSubmission);
  app.get("/api/submissions/user/:username", getUserSubmissions);
  app.get("/api/submissions/challenge/:challengeId", getChallengeSubmissions);

  // User routes
  app.get("/api/users/:username", getUserData);
  app.get("/api/users", getAllUsers);

  // MySQL API routes
  app.use("/api/mysql", mysqlRouter);

  // Initialize MySQL connection if environment variables are available
  if (process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_PASSWORD && process.env.MYSQL_DATABASE) {
    console.log('🔄 Initializing MySQL connection...');
    try {
      initializeMySQL({
        host: process.env.MYSQL_HOST,
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
      });
      console.log('✅ MySQL connection initialized');
    } catch (error) {
      console.error('❌ MySQL initialization failed:', error);
    }
  } else {
    console.log('⚠️ MySQL environment variables not found - MySQL features disabled');
  }

  return app;
}
