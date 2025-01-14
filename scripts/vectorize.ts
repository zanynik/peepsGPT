import { db } from '../db';
import { users } from '../db/schema';
import { generateEmbedding } from '../server/services/embeddings';
import { sql } from 'drizzle-orm';

async function vectorizeAllProfiles() {
  const allUsers = await db.select().from(users);
  let success = 0;
  let failed = 0;

  for (const user of allUsers) {
    const combinedText = `${user.publicDescription || ''} ${user.privateDescription || ''}`.trim();
    if (!combinedText) continue;

    try {
      const embedding = await generateEmbedding(combinedText);
      console.log('Generated embedding:', embedding); // Debugging

      // Format the embedding array as a PostgreSQL-compatible string
      const embeddingArray = `{${embedding.join(',')}}`;

      // Update the user's embedding
      await db.execute(sql`
        UPDATE users 
        SET embedding = ${embeddingArray}::float8[],
            updated_at = NOW()
        WHERE id = ${user.id}
      `);

      console.log(`✓ Updated embedding for user ${user.id}`);
      success++;
    } catch (error) {
      console.error(`✗ Failed to update embedding for user ${user.id}:`, error);
      failed++;
    }
  }

  console.log(`\nVectorization complete!\nSuccess: ${success}\nFailed: ${failed}`);
}

console.log('Starting one-time vectorization of all profiles...');
vectorizeAllProfiles()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Vectorization failed:', error);
    process.exit(1);
  });