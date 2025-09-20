const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const https = require('https');
const http = require('http');

require('dotenv').config();
const API_KEY = process.env.STRAPI_FULL_ACCESS_TOKEN;
const STRAPI_URL = 'http://localhost:1337/api/sermons';
const STRAPI_UPLOAD_URL = 'http://localhost:1337/api/upload';

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

// Download file from URL
async function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    if (!url || !url.trim()) {
      resolve(null);
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(`./downloads/${filename}`);

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve(`./downloads/${filename}`);
      });

      file.on('error', (err) => {
        fs.unlink(`./downloads/${filename}`, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Upload file to Strapi using Strapi v5 approach
async function uploadFileToStrapi(filePath) {
  if (!filePath) return null;

  try {
    // Dynamic import for ES modules
    const { FormData } = await import('formdata-node');
    const { blobFrom } = await import('node-fetch');

    // Create blob from file
    const file = await blobFrom(filePath);
    const filename = path.basename(filePath);

    // Create FormData with proper structure for Strapi v5
    const form = new FormData();
    form.append('files', file, filename);

    const response = await fetch(STRAPI_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      body: form
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result[0]; // Strapi returns array of uploaded files
  } catch (error) {
    console.error('File upload error:', error.message);
    return null;
  }
}

// Extract URL from handout field (format: "filename (url)")
function extractHandoutUrl(handoutStr) {
  if (!handoutStr || !handoutStr.trim()) return null;

  const match = handoutStr.match(/\((https?:\/\/[^)]+)\)/);
  return match ? match[1] : null;
}

function transformRow(row) {
  // Handle BOM character in first column
  const titleKey = Object.keys(row).find(key => key.includes('title')) || 'title';

  // Clean up the data
  const title = row[titleKey] ? row[titleKey].trim() : '';
  const date = parseDate(row.date);
  const speaker = row.speaker && row.speaker.trim() ? row.speaker.trim() : null;
  const series = row.series && row.series.trim() ? row.series.trim() : null;
  const body = row.body && row.body.trim() ? row.body.trim() : null;
  const passage = row.passage && row.passage.trim() ? row.passage.trim() : null;
  const embed = row.embed && row.embed.trim() ? row.embed.trim() : null;
  const link = row.link && row.link.trim() ? row.link.trim() : null;
  const audio = row.audio && row.audio.trim() ? row.audio.trim() : null;

  // Extract handout URL
  const handoutUrl = extractHandoutUrl(row.handout);
  const slidesUrl = extractHandoutUrl(row.slides);

  // Determine if should be published (checked = published, empty = draft)
  const shouldPublish = row.publish === 'checked';

  return {
    title: title,
    date: date,
    speaker: speaker,
    series: series,
    body: body,
    passage: passage,
    embed: embed,
    link: link,
    audio: audio,
    handoutUrl: handoutUrl,
    slidesUrl: slidesUrl,
    shouldPublish: shouldPublish
  };
}

async function createSermon(sermonData) {
  try {
    // Create downloads directory if it doesn't exist
    if (!fs.existsSync('./downloads')) {
      fs.mkdirSync('./downloads');
    }

    let handoutFile = null;
    let slidesFile = null;

    // STEP 1: Download and upload files first
    if (sermonData.handoutUrl) {
      try {
        console.log(`  Downloading handout from: ${sermonData.handoutUrl}`);
        const filename = `handout-${Date.now()}.pdf`;
        const filePath = await downloadFile(sermonData.handoutUrl, filename);
        if (filePath) {
          handoutFile = await uploadFileToStrapi(filePath);
          fs.unlinkSync(filePath); // Clean up local file
          console.log(`  Handout uploaded successfully, ID: ${handoutFile?.id}`);
        }
      } catch (error) {
        console.error(`  Failed to process handout: ${error.message}`);
      }
    }

    if (sermonData.slidesUrl) {
      try {
        console.log(`  Downloading slides from: ${sermonData.slidesUrl}`);
        const filename = `slides-${Date.now()}.pdf`;
        const filePath = await downloadFile(sermonData.slidesUrl, filename);
        if (filePath) {
          slidesFile = await uploadFileToStrapi(filePath);
          fs.unlinkSync(filePath); // Clean up local file
          console.log(`  Slides uploaded successfully, ID: ${slidesFile?.id}`);
        }
      } catch (error) {
        console.error(`  Failed to process slides: ${error.message}`);
      }
    }

    // STEP 2: Create the sermon entry with file IDs
    console.log(`  Creating sermon entry...`);

    const sermonPayload = {
      title: sermonData.title,
      date: sermonData.date,
      speaker: sermonData.speaker,
      passage: sermonData.passage,
      embed: sermonData.embed,
      link: sermonData.link
    };

    // Add file IDs if files were uploaded
    if (handoutFile && handoutFile.id) {
      sermonPayload.handout = handoutFile.id;
    }
    if (slidesFile && slidesFile.id) {
      sermonPayload.slides = slidesFile.id;
    }

    const url = sermonData.shouldPublish
      ? `${STRAPI_URL}?status=published`
      : `${STRAPI_URL}?status=draft`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        data: sermonPayload
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log(`  Sermon entry created successfully`);
    return await response.json();
  } catch (error) {
    console.error('Failed to create sermon:', error.message);
    throw error;
  }
}

async function importCSV() {
  const results = [];

  console.log('Reading CSV file...');

  return new Promise((resolve, reject) => {
    fs.createReadStream('Sermons-Main View.csv')
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        console.log(`Found ${results.length} rows in CSV`);
        console.log('Processing remaining rows 21-99...\n');

        let successCount = 0;
        let draftCount = 0;
        let publishedCount = 0;
        let errorCount = 0;

        // Process remaining rows 21-99 (skip first 20 already imported)
        const rowsToProcess = results.slice(20);

        for (let i = 0; i < rowsToProcess.length; i++) {
          const row = rowsToProcess[i];
          const transformedData = transformRow(row);
          const titleKey = Object.keys(row).find(key => key.includes('title')) || 'title';
          const sermonTitle = row[titleKey] || row.speaker || `Row ${i + 13}`;
          const actualRowNumber = i + 21; // Starting from row 21

          // Skip empty rows (no title and no speaker)
          if (!transformedData.title && !transformedData.speaker) {
            console.log(`Skipping row ${actualRowNumber}: No title or speaker`);
            continue;
          }

          try {
            console.log(`Processing row ${actualRowNumber}: ${sermonTitle} (${transformedData.shouldPublish ? 'PUBLISHED' : 'DRAFT'})`);
            await createSermon(transformedData);

            successCount++;
            if (transformedData.shouldPublish) {
              publishedCount++;
            } else {
              draftCount++;
            }
          } catch (error) {
            console.error(`Error importing row ${actualRowNumber} (${sermonTitle}):`, error.message);
            errorCount++;
          }

          console.log(''); // Empty line for readability
        }

        console.log('\n=== Import Complete ===');
        console.log(`Successfully imported: ${successCount} sermons`);
        console.log(`Published sermons: ${publishedCount}`);
        console.log(`Draft sermons: ${draftCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log(`Total rows processed: ${rowsToProcess.length} (rows 21-99)`);

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