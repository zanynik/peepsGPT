
import { vectorizeAllProfiles } from '../server/services/embeddings';

console.log('Starting one-time vectorization of all profiles...');
vectorizeAllProfiles()
  .then(() => {
    console.log('Vectorization complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Vectorization failed:', error);
    process.exit(1);
  });
