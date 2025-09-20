const fs = require('fs');
const csv = require('csv-parser');

require('dotenv').config();
const API_KEY = process.env.STRAPI_FULL_ACCESS_TOKEN;
const STRAPI_URL = 'http://localhost:1337/api/he-brew';

function parsePrice(priceStr) {
  if (!priceStr || priceStr.trim() === '') return null;
  return parseFloat(priceStr.replace('$', ''));
}

function transformRow(row) {
  // Handle BOM character in first column
  const drinkKey = Object.keys(row).find(key => key.includes('drink')) || 'drink';

  // Clean up the data
  const drink = row[drinkKey] ? row[drinkKey].trim() : '';
  const isHeading = row.heading === 'checked';
  const smallCost = parsePrice(row.smallCost);
  const largeCost = parsePrice(row.largeCost);
  const notes = row.notes && row.notes.trim() ? row.notes.trim() : null;

  return {
    drink: drink,
    heading: isHeading,
    smallCost: smallCost,
    largeCost: largeCost,
    notes: notes
  };
}

async function updateMenuData(allRows) {
  try {
    const response = await fetch(STRAPI_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        data: {
          rows: allRows
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to update menu data:', error.message);
    throw error;
  }
}

async function importCSV() {
  const results = [];

  console.log('Reading CSV file...');

  return new Promise((resolve, reject) => {
    fs.createReadStream('Menu-Main View.csv')
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        console.log(`Found ${results.length} rows in CSV`);

        const transformedRows = [];

        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          const transformedData = transformRow(row);
          const drinkKey = Object.keys(row).find(key => key.includes('drink')) || 'drink';
          const drinkName = row[drinkKey] || `Row ${i + 1}`;

          console.log(`Processing row ${i + 1}: ${drinkName}`);
          transformedRows.push(transformedData);
        }

        try {
          console.log('Updating menu data...');
          await updateMenuData(transformedRows);
          console.log('\n=== Import Complete ===');
          console.log(`Successfully imported: ${transformedRows.length} records`);
        } catch (error) {
          console.log('\n=== Import Failed ===');
          console.log(`Error: ${error.message}`);
        }

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