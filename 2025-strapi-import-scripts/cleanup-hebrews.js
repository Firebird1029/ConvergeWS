require('dotenv').config();
const API_KEY = process.env.STRAPI_FULL_ACCESS_TOKEN;
const STRAPI_URL = 'http://localhost:1337/api/he-brews';

async function getAllRecords() {
  try {
    const response = await fetch(`${STRAPI_URL}?populate=*`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch records:', error.message);
    throw error;
  }
}

async function deleteRecord(documentId) {
  try {
    const response = await fetch(`${STRAPI_URL}/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return true;
  } catch (error) {
    console.error(`Failed to delete record ${documentId}:`, error.message);
    return false;
  }
}

async function cleanupTable() {
  console.log('Fetching all records from he-brews table...');

  const records = await getAllRecords();
  console.log(`Found ${records.length} records to delete`);

  if (records.length === 0) {
    console.log('No records to delete');
    return;
  }

  let deletedCount = 0;
  let errorCount = 0;

  for (const record of records) {
    console.log(`Deleting: ${record.drink || 'Unnamed'} (ID: ${record.documentId})`);

    const success = await deleteRecord(record.documentId);
    if (success) {
      deletedCount++;
      console.log(`✓ Deleted successfully`);
    } else {
      errorCount++;
      console.log(`✗ Failed to delete`);
    }

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n=== Cleanup Complete ===');
  console.log(`Successfully deleted: ${deletedCount} records`);
  console.log(`Failed: ${errorCount} records`);
}

// Run the cleanup
cleanupTable().catch(error => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});