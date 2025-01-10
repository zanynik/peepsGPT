import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { users, matches, genderEnum } from "@db/schema";
import { eq, and, desc, between } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import createMemoryStore from "memorystore";
import { startNewsletterScheduler } from "./services/newsletter";
import { validateAndGetLocation, getSuggestions } from "./services/geonames";
import { z } from "zod";

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


  app.get("/api/locations/suggest", async (req, res) => {
    try {
      const { q } = req.query;
      if (typeof q !== 'string' || q.length < 2) {
        return res.status(400).json({ suggestions: [] });
      }
      
      const suggestions = await getSuggestions(q);
      if (!suggestions || suggestions.length === 0) {
        return res.json({ suggestions: [] });
      }
      
      res.json({ suggestions });
    } catch (error: any) {
      console.error("Location suggestion error:", error);
      res.json({ suggestions: [] });
    }
  });


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
      const { username, password, email, location, ...profile } = req.body;

      // Validate gender
      if (!genderEnum.safeParse(profile.gender).success) {
        return res.status(400).send("Invalid gender value");
      }

      // Validate and get location data
      const locationData = await validateAndGetLocation(location);
      if (!locationData) {
        return res.status(400).send("Invalid location");
      }

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
          location: locationData.name,
          latitude: locationData.latitude.toString(),
          longitude: locationData.longitude.toString(),
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
        columns: {
          id: true,
          username: true,
          password: true
        }
      });

      if (!user || !(await crypto.compare(password, user.password))) {
        return res.status(401).send("Invalid credentials");
      }

      req.session.userId = user.id;

      // Fetch full user data after successful authentication
      const fullUser = await db.query.users.findFirst({
        where: eq(users.id, user.id)
      });

      res.json(fullUser);
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
      const { minAge, maxAge, gender, maxDistance } = req.query;

      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
      });

      if (!currentUser) {
        return res.status(404).send("User not found");
      }

      let allUsers = await db.query.users.findMany();

      // Filter users based on criteria
      const filteredUsers = allUsers
        .filter(user => user.id !== req.session.userId)
        .filter(user => {
          // Age filter
          if (minAge && user.age < parseInt(minAge as string)) return false;
          if (maxAge && user.age > parseInt(maxAge as string)) return false;

          // Gender filter
          if (gender && gender !== 'all' && user.gender !== gender) return false;

          // Distance filter
          if (maxDistance && currentUser.latitude && currentUser.longitude) {
            const distance = calculateDistance(
              parseFloat(currentUser.latitude),
              parseFloat(currentUser.longitude),
              parseFloat(user.latitude || "0"),
              parseFloat(user.longitude || "0")
            );
            if (distance > parseInt(maxDistance as string)) return false;
          }

          return true;
        });

      const usersWithMatches = await Promise.all(
        filteredUsers.map(async (user) => {
          const existingMatch = await db.query.matches.findFirst({
            where: and(
              eq(matches.user1Id, currentUser.id),
              eq(matches.user2Id, user.id)
            ),
          });

          if (!existingMatch) {
            const matchScore = calculateMatch(user, currentUser);
            const [newMatch] = await db
              .insert(matches)
              .values({
                user1Id: currentUser.id,
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
      const { location, gender, ...profile } = req.body;

      // Validate gender
      if (!genderEnum.safeParse(gender).success) {
        return res.status(400).send("Invalid gender value");
      }

      // Validate and get location data if location is being updated
      let locationUpdate = {};
      if (location) {
        const locationData = await validateAndGetLocation(location);
        if (!locationData) {
          return res.status(400).send("Invalid location");
        }
        locationUpdate = {
          location: locationData.name,
          latitude: locationData.latitude.toString(),
          longitude: locationData.longitude.toString(),
        };
      }

      const [user] = await db
        .update(users)
        .set({
          ...profile,
          ...locationUpdate,
          gender,
          updatedAt: new Date().toISOString(),
        })
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

function calculateMatch(user1: any, user2: any): number {
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

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}