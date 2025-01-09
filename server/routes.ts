import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { users, matches } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import createMemoryStore from "memorystore";

// Extend Express Session type
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
      const { username, password, ...profile } = req.body;

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
          ...profile,
          photoUrl: profile.photoUrl || "https://via.placeholder.com/150",
          publicDescription: profile.publicDescription || "",
          privateDescription: profile.privateDescription || "",
          socialIds: profile.socialIds || "",
        })
        .returning();

      req.session.userId = user.id;
      res.json(user);
    } catch (error) {
      res.status(500).send("Server error");
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
    } catch (error) {
      res.status(500).send("Server error");
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

    const user = await db.query.users.findFirst({
      where: eq(users.id, req.session.userId),
    });

    if (!user) {
      return res.status(404).send("User not found");
    }

    res.json(user);
  });

  app.get("/api/users", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send("Not authenticated");
    }

    const allUsers = await db.query.users.findMany();
    const matchPercentages = await Promise.all(
      allUsers.map(async (user) => {
        if (user.id === req.session.userId) return user;

        const match = await db.query.matches.findFirst({
          where: and(
            eq(matches.user1Id, req.session.userId),
            eq(matches.user2Id, user.id)
          ),
        });

        return {
          ...user,
          matchPercentage: match?.percentage || calculateMatch(user, req.session.userId),
        };
      })
    );

    res.json(matchPercentages);
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
    } catch (error) {
      res.status(500).send("Server error");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Simple matching algorithm based on profile similarity
function calculateMatch(user1: any, user2Id: number): number {
  return Math.floor(Math.random() * 100);
}