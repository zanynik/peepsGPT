import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { users, matches } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import createMemoryStore from "memorystore";
import { startNewsletterScheduler } from "./services/newsletter";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const scryptAsync = promisify(scrypt);

const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

export function registerRoutes(app: Express): Server {
  const MemoryStore = createMemoryStore(session);
  app.use(
    session({
      secret: process.env.REPL_ID || "matching-app-secret",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000,
      }),
    })
  );

  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, email, ...profile } = req.body;

      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const hashedPassword = await crypto.hash(password);
      const [user] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          email,
          ...profile,
          photoUrl: profile.photoUrl || "https://via.placeholder.com/150",
          publicDescription: profile.publicDescription || "",
          privateDescription: profile.privateDescription || "",
          socialIds: profile.socialIds || "",
          newsletterEnabled: true,
        })
        .returning();

      req.session.userId = user.id;
      res.json(user);
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).send(error.message || "Server error");
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (!user || !(await crypto.compare(password, user.password))) {
        return res.status(401).send("Invalid credentials");
      }

      req.session.userId = user.id;
      res.json(user);
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).send(error.message || "Server error");
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.send("Logged out");
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
      });

      if (!user) {
        return res.status(404).send("User not found");
      }

      res.json(user);
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).send(error.message || "Server error");
    }
  });

  app.get("/api/users", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const allUsers = await db.query.users.findMany();
      const currentUserId = req.session.userId;

      const usersWithMatches = await Promise.all(
        allUsers
          .filter(user => user.id !== currentUserId)
          .map(async (user) => {
            const existingMatch = await db.query.matches.findFirst({
              where: and(
                eq(matches.user1Id, currentUserId),
                eq(matches.user2Id, user.id)
              ),
            });

            if (!existingMatch) {
              const matchScore = calculateMatch(user, allUsers.find(u => u.id === currentUserId));
              const [newMatch] = await db
                .insert(matches)
                .values({
                  user1Id: currentUserId,
                  user2Id: user.id,
                  percentage: matchScore,
                })
                .returning();

              return { ...user, matchPercentage: newMatch.percentage };
            }

            return { ...user, matchPercentage: existingMatch.percentage };
          })
      );

      const sortedUsers = usersWithMatches.sort((a, b) => 
        (b.matchPercentage || 0) - (a.matchPercentage || 0)
      );

      res.json(sortedUsers);
    } catch (error: any) {
      console.error("Get users error:", error);
      res.status(500).send(error.message || "Server error");
    }
  });

  app.put("/api/profile", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [user] = await db
        .update(users)
        .set(req.body)
        .where(eq(users.id, req.session.userId))
        .returning();

      res.json(user);
    } catch (error: any) {
      console.error("Update profile error:", error);
      res.status(500).send(error.message || "Server error");
    }
  });

  app.post("/api/newsletter/toggle", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
      });

      if (!user) {
        return res.status(404).send("User not found");
      }

      const [updatedUser] = await db
        .update(users)
        .set({ newsletterEnabled: !user.newsletterEnabled })
        .where(eq(users.id, req.session.userId))
        .returning();

      res.json(updatedUser);
    } catch (error: any) {
      console.error("Newsletter toggle error:", error);
      res.status(500).send(error.message || "Server error");
    }
  });

  const httpServer = createServer(app);

  // Start the newsletter scheduler
  startNewsletterScheduler();

  return httpServer;
}

function calculateMatch(user1: any, user2: any | undefined): number {
  if (!user2) return 50; // Default score if no comparison user found

  const baseScore = 50;
  let score = baseScore;

  // Age comparison
  const ageDiff = Math.abs(user1.age - user2.age);
  score += Math.max(0, 20 - ageDiff);

  // Location matching
  if (user1.location === user2.location) {
    score += 20;
  }

  // Add some randomness to prevent identical scores
  score += Math.floor(Math.random() * 20) - 10;

  // Ensure score is between 0 and 100
  return Math.min(100, Math.max(0, score));
}