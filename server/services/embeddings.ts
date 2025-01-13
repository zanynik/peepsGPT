
import OpenAI from 'openai';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    input: text,
    model: "text-embedding-ada-002"
  });
  
  return response.data[0].embedding;
}

export async function updateUserEmbedding(userId: number, publicDesc: string, privateDesc: string) {
  const combinedText = `${publicDesc} ${privateDesc}`.trim();
  if (!combinedText) return;
  
  const embedding = await generateEmbedding(combinedText);
  
  await db.update(users)
    .set({ embedding })
    .where(eq(users.id, userId));
}

export async function vectorizeAllProfiles() {
  const allUsers = await db.select().from(users);
  
  for (const user of allUsers) {
    const combinedText = `${user.publicDescription} ${user.privateDescription}`.trim();
    if (!combinedText) continue;
    
    try {
      const embedding = await generateEmbedding(combinedText);
      await db.update(users)
        .set({ embedding })
        .where(eq(users.id, user.id));
      
      console.log(`Updated embedding for user ${user.id}`);
    } catch (error) {
      console.error(`Failed to update embedding for user ${user.id}:`, error);
    }
  }
}
