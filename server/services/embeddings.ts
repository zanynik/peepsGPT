
import { pipeline } from '@xenova/transformers';
import { db } from '@db';
import { users } from '@db/schema';
import { sql } from 'drizzle-orm';

let embeddingModel: any = null;

async function getEmbeddingModel() {
  if (!embeddingModel) {
    embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: false
    });
  }
  return embeddingModel;
}

export async function generateEmbedding(text: string) {
  const model = await getEmbeddingModel();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

export async function updateUserEmbedding(userId: number, publicDesc: string, privateDesc: string) {
  const combinedText = `${publicDesc} ${privateDesc}`.trim();
  if (!combinedText) return;
  
  const embedding = await generateEmbedding(combinedText);
  
  await db.execute(sql`
    UPDATE users 
    SET embedding = ${embedding}::vector(1536),
        updated_at = NOW()
    WHERE id = ${userId}
  `);
}

export async function vectorizeAllProfiles() {
  const allUsers = await db.select().from(users);
  
  for (const user of allUsers) {
    const combinedText = `${user.publicDescription} ${user.privateDescription}`.trim();
    if (!combinedText) continue;
    
    try {
      const embedding = await generateEmbedding(combinedText);
      await db.execute(sql`
        UPDATE users 
        SET embedding = ${sql.raw(`'[${embedding.join(',')}]'::vector`)}
        WHERE id = ${user.id}
      `);
      
      console.log(`Updated embedding for user ${user.id}`);
    } catch (error) {
      console.error(`Failed to update embedding for user ${user.id}:`, error);
    }
  }
}
