require('dotenv').config();
const API_KEY = process.env.STRAPI_FULL_ACCESS_TOKEN;
const STRAPI_URL = 'http://localhost:1337/api/sermons';

async function clearAllSermons() {
  try {
    console.log('Fetching all sermons...');

    // First, get all sermons with pagination
    let allSermons = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const response = await fetch(`${STRAPI_URL}?pagination[page]=${page}&pagination[pageSize]=100`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sermons: ${response.status}`);
      }

      const data = await response.json();
      allSermons = allSermons.concat(data.data);

      if (data.meta && data.meta.pagination) {
        const { page: currentPage, pageCount } = data.meta.pagination;
        hasMorePages = currentPage < pageCount;
        page++;
      } else {
        hasMorePages = false;
      }
    }

    const sermons = allSermons;

    console.log(`Found ${sermons.length} sermons to delete`);

    if (sermons.length === 0) {
      console.log('No sermons to delete!');
      return;
    }

    // Delete each sermon
    let deletedCount = 0;
    let errorCount = 0;

    for (const sermon of sermons) {
      try {
        console.log(`Deleting sermon: ${sermon.title || sermon.documentId}`);

        const deleteResponse = await fetch(`${STRAPI_URL}/${sermon.documentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        });

        if (!deleteResponse.ok) {
          throw new Error(`HTTP ${deleteResponse.status}`);
        }

        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete sermon ${sermon.documentId}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== Clear Complete ===');
    console.log(`Successfully deleted: ${deletedCount} sermons`);
    console.log(`Errors: ${errorCount}`);

  } catch (error) {
    console.error('Clear failed:', error.message);
    process.exit(1);
  }
}

// Run the clear
clearAllSermons();