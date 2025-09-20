const fs = require('fs');
const csv = require('csv-parser');

require('dotenv').config();
const API_KEY = process.env.STRAPI_FULL_ACCESS_TOKEN;
const STRAPI_URL = 'http://localhost:1337/api/articles';

function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  // Handle MM/DD/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return new Date(year, month - 1, day).toISOString();
  }
  return new Date(dateStr).toISOString();
}

function transformRow(row) {
  // Handle BOM character in first column
  const titleKey = Object.keys(row).find(key => key.includes('title')) || 'title';

  // Clean up the data
  const title = row[titleKey] ? row[titleKey].trim() : '';
  const body = row.body && row.body.trim() ? row.body.trim() : null;
  const date = parseDate(row.date);
  const author = row.author && row.author.trim() ? row.author.trim() : null;
  const img = row.img && row.img.trim() ? row.img.trim() : null;

  // Determine if should be published (checked = published, empty = draft)
  const shouldPublish = row.publish === 'checked';

  return {
    title: title,
    date: date,
    body: body,
    author: author,
    img: img,
    shouldPublish: shouldPublish
  };
}

async function createArticle(articleData) {
  try {
    // Determine URL based on publish status
    const url = articleData.shouldPublish
      ? `${STRAPI_URL}?status=published`
      : `${STRAPI_URL}?status=draft`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        data: {
          title: articleData.title,
          date: articleData.date,
          body: articleData.body,
          author: articleData.author,
          img: articleData.img
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create article:', error.message);
    throw error;
  }
}

async function importCSV() {
  const results = [];

  console.log('Reading CSV file...');

  return new Promise((resolve, reject) => {
    fs.createReadStream('posts-main view.csv')
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        console.log(`Found ${results.length} rows in CSV`);

        let successCount = 0;
        let draftCount = 0;
        let publishedCount = 0;
        let errorCount = 0;

        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          const transformedData = transformRow(row);
          const titleKey = Object.keys(row).find(key => key.includes('title')) || 'title';
          const articleTitle = row[titleKey] || `Row ${i + 1}`;

          // Skip empty rows
          if (!transformedData.title) {
            console.log(`Skipping row ${i + 1}: No title`);
            continue;
          }

          try {
            console.log(`Processing row ${i + 1}: ${articleTitle} (${transformedData.shouldPublish ? 'PUBLISHED' : 'DRAFT'})`);
            await createArticle(transformedData);

            successCount++;
            if (transformedData.shouldPublish) {
              publishedCount++;
            } else {
              draftCount++;
            }
          } catch (error) {
            console.error(`Error importing row ${i + 1} (${articleTitle}):`, error.message);
            errorCount++;
          }
        }

        console.log('\n=== Import Complete ===');
        console.log(`Successfully imported: ${successCount} articles`);
        console.log(`Published articles: ${publishedCount}`);
        console.log(`Draft articles: ${draftCount}`);
        console.log(`Errors: ${errorCount}`);

        resolve();
      })
      .on('error', reject);
  });
}

// Run the import
importCSV().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});