import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { users, matches, genderEnum, messages, notifications } from "@db/schema";
import { eq, and, desc, between, sql } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import createMemoryStore from "memorystore";
import { startNewsletterScheduler } from "./services/newsletter";
import { validateAndGetLocation, getSuggestions } from "./services/geonames";
import { z } from "zod";
import { setupWebSocket } from "./websocket";
import { updateUserEmbedding, generateEmbedding } from './services/embeddings';

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

  // Add messaging endpoints
  app.get("/api/messages/:userId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const messagesData = await db.query.messages.findMany({
        where: and(
          eq(messages.senderId, req.session.userId),
          eq(messages.receiverId, parseInt(req.params.userId))
        ),
        orderBy: desc(messages.createdAt),
        limit: 50
      });

      res.json(messagesData);
    } catch (error: any) {
      console.error("Get messages error:", error);
      res.status(500).send(error.message || "Server error");
    }
  });

  app.get("/api/notifications", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const notificationsData = await db.query.notifications.findMany({
        where: eq(notifications.userId, req.session.userId),
        orderBy: desc(notifications.createdAt),
        limit: 20
      });

      res.json(notificationsData);
    } catch (error: any) {
      console.error("Get notifications error:", error);
      res.status(500).send(error.message || "Server error");
    }
  });

  app.post("/api/notifications/read", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [notification] = await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, req.body.notificationId))
        .returning();

      res.json(notification);
    } catch (error: any) {
      console.error("Mark notification read error:", error);
      res.status(500).send(error.message || "Server error");
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, email, location, ...profile } = req.body;

      // Validate gender
      const validGenders = ["male", "female", "other"];
      if (profile.gender && !validGenders.includes(profile.gender?.toLowerCase())) {
        return res.status(400).send("Invalid gender value");
      }

      // Validate and get location data
      let locationData = { name: location, latitude: 0, longitude: 0 };
      if (location) {
        try {
          const validatedLocation = await validateAndGetLocation(location);
          if (validatedLocation) {
            locationData = validatedLocation;
          }
        } catch (error) {
          console.log("Location validation failed, using provided location");
        }
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
          name: profile.name,
          age: profile.age,
          gender: profile.gender?.toLowerCase(),
          location: locationData.name,
          latitude: locationData.latitude.toString(),
          longitude: locationData.longitude.toString(),
          photoUrl: profile.photoUrl || "https://via.placeholder.com/150",
          publicDescription: profile.publicDescription || "",
          privateDescription: profile.privateDescription || "",
          socialIds: profile.socialIds || "",
          newsletterEnabled: true,
          lastSeen: new Date(),
          isOnline: true,
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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
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

  // Enhanced conversations endpoint with last messages and unread counts
  app.get("/api/conversations", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send("Not authenticated");
    }

    try {
      // Get users who have had conversations with the current user
      const conversationUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          photoUrl: users.photoUrl,
          isOnline: users.isOnline,
          lastSeen: users.lastSeen,
          location: users.location,
        })
        .from(users)
        .where(sql`${users.id} IN (
          SELECT DISTINCT CASE 
            WHEN ${messages.senderId} = ${req.session.userId} THEN ${messages.receiverId}
            ELSE ${messages.senderId}
          END
          FROM ${messages}
          WHERE ${messages.senderId} = ${req.session.userId} OR ${messages.receiverId} = ${req.session.userId}
        )`);

      // Get last message and unread count for each conversation
      const conversationsWithData = await Promise.all(
        conversationUsers.map(async (user) => {
          // Get last message
          const lastMessage = await db.query.messages.findFirst({
            where: or(
              and(eq(messages.senderId, user.id), eq(messages.receiverId, req.session.userId)),
              and(eq(messages.senderId, req.session.userId), eq(messages.receiverId, user.id))
            ),
            orderBy: desc(messages.createdAt),
          });

          // Get unread count
          const unreadCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(messages)
            .where(
              and(
                eq(messages.senderId, user.id),
                eq(messages.receiverId, req.session.userId),
                sql`${messages.readAt} IS NULL`
              )
            );

          return {
            ...user,
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
            } : null,
            unreadCount: unreadCount[0]?.count || 0,
          };
        })
      );

      // Sort by last message time
      conversationsWithData.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      res.json(conversationsWithData);
    } catch (error: any) {
      console.error("Get conversations error:", error);
      res.status(500).send(error.message || "Server error");
    }
  });

  app.get("/api/users", async (req, res) => {
    // Prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (!req.session.userId) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const minAge = parseInt(req.query.minAge as string) || 18;
      const maxAge = parseInt(req.query.maxAge as string) || 75;
      const gender = (req.query.gender as string) || 'all';
      const maxDistance = parseInt(req.query.maxDistance as string) || 0;

      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
      });

      if (!currentUser) {
        return res.status(404).send("User not found");
      }

      let allUsers = await db.query.users.findMany();

      // Filter users based on criteria
      const filteredUsers = allUsers
        .filter((user) => user.id !== req.session.userId)
        .filter((user) => {
          // Age filter
          if (user.age && (user.age < minAge || user.age > maxAge)) return false;

          // Gender filter
          if (gender !== "all" && user.gender && user.gender.toLowerCase() !== gender.toLowerCase()) return false;

          // Distance filter (skip if maxDistance is "0")
          if (
            maxDistance &&
            maxDistance !== 0 &&
            currentUser.latitude &&
            currentUser.longitude &&
            user.latitude &&
            user.longitude
          ) {
            const distance = calculateDistance(
              parseFloat(currentUser.latitude),
              parseFloat(currentUser.longitude),
              parseFloat(user.latitude),
              parseFloat(user.longitude)
            );
            if (distance > maxDistance) return false;
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

      const sortedUsers = usersWithMatches.sort(
        (a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0)
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
      const validGenders = ["male", "female", "other"];
      if (gender && !validGenders.includes(gender.toLowerCase())) {
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

      // Always update embedding to ensure it stays in sync
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
      });
      
      if (existingUser) {
        await updateUserEmbedding(
          user.id,
          profile.publicDescription || existingUser.publicDescription,
          profile.privateDescription || existingUser.privateDescription
        );
      }
      
      res.json(user);
    } catch (error: any) {
      console.error("Update profile error:", error);
      res.status(500).send(error.message || "Server error");
    }
  });

  app.post("/api/search", async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.json([]);
    }

    const searchTerm = query.toLowerCase().trim();
    
    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        username: true,
        name: true,
        publicDescription: true,
        photoUrl: true,
        age: true,
        gender: true,
        location: true
      }
    });

    const results = allUsers
      .filter(user => {
        if (!user.name && !user.publicDescription) return false;
        
        const nameMatch = user.name?.toLowerCase().includes(searchTerm);
        const descMatch = user.publicDescription?.toLowerCase().includes(searchTerm);
        const locationMatch = user.location?.toLowerCase().includes(searchTerm);
        const usernameMatch = user.username?.toLowerCase().includes(searchTerm);
        
        return nameMatch || descMatch || locationMatch || usernameMatch;
      })
      .map(user => {
        // Calculate similarity score based on text matching
        let similarity = 0;
        const searchWords = searchTerm.split(' ').filter(w => w.length > 0);
        
        searchWords.forEach(word => {
          if (user.name?.toLowerCase().includes(word)) similarity += 0.4;
          if (user.publicDescription?.toLowerCase().includes(word)) similarity += 0.3;
          if (user.location?.toLowerCase().includes(word)) similarity += 0.2;
          if (user.username?.toLowerCase().includes(word)) similarity += 0.1;
        });
        
        // Boost exact matches
        if (user.name?.toLowerCase() === searchTerm) similarity += 0.5;
        if (user.publicDescription?.toLowerCase().includes(searchTerm)) similarity += 0.2;
        
        return {
          id: user.id,
          name: user.name || user.username,
          photo_url: user.photoUrl,
          public_description: user.publicDescription,
          age: user.age,
          gender: user.gender,
          location: user.location,
          similarity: Math.min(similarity, 1.0)
        };
      })
      .filter(user => user.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);

    res.json(results);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

  // Get messages between current user and another user
  app.get("/api/messages/:userId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const otherUserId = parseInt(req.params.userId);
      const userMessages = await db.query.messages.findMany({
        where: sql`(${messages.senderId} = ${req.session.userId} AND ${messages.receiverId} = ${otherUserId}) 
                  OR (${messages.senderId} = ${otherUserId} AND ${messages.receiverId} = ${req.session.userId})`,
        orderBy: [messages.createdAt],
      });

      res.json(userMessages);
    } catch (error: any) {
      console.error("Get messages error:", error);
      res.status(500).send(error.message || "Server error");
    }
  });

  // Send a new message
  app.post("/api/messages", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { receiverId, content } = req.body;
      
      if (!receiverId || !content) {
        return res.status(400).send("Missing required fields");
      }

      const [newMessage] = await db
        .insert(messages)
        .values({
          senderId: req.session.userId,
          receiverId,
          content,
          messageType: "text",
        })
        .returning();

      res.json(newMessage);
    } catch (error: any) {
      console.error("Send message error:", error);
      res.status(500).send(error.message || "Server error");
    }
  });

  // Mark messages as read
  app.post("/api/messages/mark-read/:userId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const otherUserId = parseInt(req.params.userId);
      await db
        .update(messages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(messages.senderId, otherUserId),
            eq(messages.receiverId, req.session.userId),
            sql`${messages.readAt} IS NULL`
          )
        );

      res.json({ success: true });
    } catch (error: any) {
      console.error("Mark read error:", error);
      res.status(500).send(error.message || "Server error");
    }
  });

app.get("/api/share/:userId", async (req, res) => {
    const { userId } = req.params;
    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(userId))
    });

    if (!user) return res.status(404).send("User not found");

    const notes = await db.query.notes.findMany({
      where: and(
        eq(notes.userId, parseInt(userId)),
        eq(notes.type, "public")
      )
    });

    res.json({ user, notes });
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

  // Setup WebSocket server
  setupWebSocket(httpServer, app);

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