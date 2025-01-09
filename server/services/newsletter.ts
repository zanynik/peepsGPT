import cron from "node-cron";
import { db } from "@db";
import { users, matches } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { sendMatchRecommendations } from "./email";

export function startNewsletterScheduler() {
  // Run every Sunday at 9 AM
  cron.schedule("0 9 * * 0", async () => {
    try {
      // Get all users with newsletter enabled
      const subscribedUsers = await db.query.users.findMany({
        where: eq(users.newsletterEnabled, true),
      });

      // Send recommendations to each user
      for (const user of subscribedUsers) {
        const userMatches = await db.query.matches.findMany({
          where: eq(matches.user1Id, user.id),
          orderBy: [desc(matches.percentage)],
          limit: 5,
        });

        if (userMatches.length > 0) {
          // Get full user details for matches
          const matchedUsers = await Promise.all(
            userMatches.map(async (match) => {
              const matchedUser = await db.query.users.findFirst({
                where: eq(users.id, match.user2Id),
              });
              return {
                ...matchedUser!,
                matchPercentage: match.percentage,
              };
            })
          );

          await sendMatchRecommendations({
            user,
            matches: matchedUsers,
          });
        }
      }
    } catch (error) {
      console.error("Failed to send newsletters:", error);
    }
  });
}
