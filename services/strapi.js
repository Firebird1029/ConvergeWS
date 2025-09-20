"use strict"; /* eslint-env node */ /* global */

// Entire file written by Claude

var debug = !process.env.NODE_ENV;
const qs = require("qs");

// Strapi API Service Module
// Handles all interactions with the Strapi headless CMS

// Base configuration
const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_URL || !STRAPI_API_TOKEN) {
	throw new Error("STRAPI_URL and STRAPI_API_TOKEN environment variables are required");
}

// Query builder using qs library for complex Strapi populate queries
function buildStrapiQuery(queryObj) {
	if (!queryObj || !queryObj.populate) {
		return "populate=*";
	}

	// Use qs to properly encode complex populate queries
	return qs.stringify(queryObj, { encodeValuesOnly: true });
}

// Helper function to make authenticated requests to Strapi
async function strapiRequest(endpoint, options = {}) {
	const url = `${STRAPI_URL}/api/${endpoint}`;
	const config = {
		headers: {
			Authorization: `Bearer ${STRAPI_API_TOKEN}`,
			"Content-Type": "application/json",
			...options.headers,
		},
		...options,
	};

	try {
		const response = await fetch(url, config);

		if (!response.ok) {
			debug && console.error(`Strapi API error: ${response.status} ${response.statusText} for ${endpoint}`);
			throw new Error(`Strapi API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		debug && console.error(`Error fetching from Strapi endpoint ${endpoint}:`, error.message);
		throw error;
	}
}

// Strapi content type endpoints - clean modern structure
const STRAPI_ENDPOINTS = {
	// Main pages with component-based structure
	"About Sections_Front Page": {
		endpoint: "front-page",
		query: {
			populate: {
				rows: {
					on: {
						"shared.row": {
							fields: ["*"],
							populate: {
								img: {
									fields: ["*"],
								},
							},
						},
					},
				},
			},
		},
	},
	"About Sections_History": {
		endpoint: "history",
		query: {
			populate: {
				rows: {
					on: {
						"shared.row": {
							fields: ["*"],
							populate: {
								img: {
									fields: ["*"],
								},
							},
						},
					},
				},
			},
		},
	},
	"About Sections_Values": {
		endpoint: "values-page",
		query: {
			populate: {
				rows: {
					on: {
						"shared.row": {
							fields: ["*"],
							populate: {
								img: {
									fields: ["*"],
								},
							},
						},
					},
				},
			},
		},
	},
	"About Sections_Team Leaders": {
		endpoint: "team-leaders",
		query: {
			populate: "*",
		},
	},
	Community_Announcements: {
		endpoint: "announcements",
		query: {
			populate: "*",
		},
	},
	Community_Forms: {
		endpoint: "forms",
		query: {
			populate: "*",
		},
	},
	Experience_Calendar: {
		endpoint: "calendar-events",
		query: {
			populate: "*",
		},
	},
	Experience_Photos: {
		endpoint: "photos",
		query: {
			populate: "*",
		},
	},
	"Converge TV_Youtube Live": {
		endpoint: "youtube-live",
		query: {
			populate: "*",
		},
	},
	"Converge Listen_Listen": {
		endpoint: "converge-listens",
		query: {
			populate: "*",
		},
	},
	"Converge TV_Converge TV": {
		endpoint: "converge-tvs",
		query: {
			populate: "*",
		},
	},
	"HE Brews_HE Brews": {
		endpoint: "he-brew",
		query: {
			populate: "*",
		},
	},
	"HE Brews_Menu": {
		endpoint: "he-brew",
		query: {
			populate: "*",
		},
	},
	"Articles and Blogs_Articles": {
		endpoint: "articles",
		query: {
			populate: "*",
		},
	},
	"Past Sermons_Sermons": {
		endpoint: "sermons",
		query: {
			populate: "*",
		},
	},
};

// Transform Strapi data for template compatibility
function transformStrapiData(strapiData, tableName) {
	if (!strapiData || !strapiData.data) {
		return {};
	}

	const transformedData = {};
	const items = Array.isArray(strapiData.data) ? strapiData.data : [strapiData.data];

	items.forEach((item) => {
		if (item && item.id) {
			// Pages with component-based rows structure
			if (
				(tableName === "About Sections_Front Page" ||
					tableName === "About Sections_History" ||
					tableName === "About Sections_Values") &&
				item.rows
			) {
				// Transform each row into a template-compatible record
				item.rows.forEach((row, index) => {
					const rowRecord = {
						id: `${item.documentId || item.id}_row_${index}`,
						documentId: `${item.documentId || item.id}_row_${index}`,
						title: row.title || null,
						body: row.body,
						style: row.style,
						component: row.__component,
						img: row.img ? transformImageData(row.img) : null,
						createdTime: item.createdAt,
						updatedTime: item.updatedAt,
					};

					const recordKey = `${item.documentId || item.id}_row_${index}`;
					transformedData[recordKey] = rowRecord;
				});
			} else if (tableName === "HE Brews_HE Brews" && item.rows) {
				// For HE Brews page content table - only the main page content
				const mainRecord = {
					id: item.documentId || item.id,
					documentId: item.documentId || item.id,
					title: item.title,
					body: item.body,
					style: item.style,
					img: item.img ? transformImageData(item.img) : null,
					createdTime: item.createdAt,
					updatedTime: item.updatedAt,
				};
				transformedData[item.documentId || item.id] = mainRecord;
			} else if (tableName === "HE Brews_Menu" && item.rows) {
				// For HE Brews menu table - only the menu items
				item.rows.forEach((row, index) => {
					const rowRecord = {
						id: `${item.documentId || item.id}_row_${index}`,
						documentId: `${item.documentId || item.id}_row_${index}`,
						drink: row.drink,
						heading: row.heading,
						smallCost: row.smallCost,
						largeCost: row.largeCost,
						notes: row.notes,
						createdTime: item.createdAt,
						updatedTime: item.updatedAt,
					};

					const recordKey = `${item.documentId || item.id}_row_${index}`;
					transformedData[recordKey] = rowRecord;
				});
			} else {
				// Standard transformation for other content types
				const record = {
					id: item.documentId || item.id,
					...item,
					title: item.title || item.name,
					createdTime: item.createdAt,
					updatedTime: item.updatedAt,
					img: item.img
						? Array.isArray(item.img)
							? item.img.map(transformImageData)
							: transformImageData(item.img)
						: null,
					handout: item.handout ? transformImageData(item.handout) : null,
					slides: item.slides ? transformImageData(item.slides) : null,
				};

				const recordKey = item.documentId || item.id;
				transformedData[recordKey] = record;
			}
		}
	});

	return transformedData;
}

// Transform Strapi image data
function transformImageData(imgData) {
	if (!imgData) return null;

	const isAbsoluteUrl = imgData.url && (imgData.url.startsWith("http://") || imgData.url.startsWith("https://"));
	return {
		url: imgData.url ? (isAbsoluteUrl ? imgData.url : `${STRAPI_URL}${imgData.url}`) : null,
		alternativeText: imgData.alternativeText || "",
		caption: imgData.caption || "",
		width: imgData.width || null,
		height: imgData.height || null,
		name: imgData.name || "",
		hash: imgData.hash || "",
		ext: imgData.ext || "",
		mime: imgData.mime || "",
		size: imgData.size || null,
		formats: imgData.formats || null,
		filename: imgData.name || "",
		id: imgData.id,
		documentId: imgData.documentId,
	};
}

// Fetch data from a specific Strapi content type
async function fetchStrapiContentType(tableName) {
	const endpointConfig = STRAPI_ENDPOINTS[tableName];

	if (!endpointConfig) {
		debug && console.warn(`No Strapi endpoint mapping found for table: ${tableName}`);
		return {};
	}

	try {
		let allData = [];
		let page = 1;
		let hasMorePages = true;

		// Fetch all pages
		while (hasMorePages) {
			// Add pagination to the query
			const paginatedQuery = {
				...endpointConfig.query,
				pagination: {
					page: page,
					pageSize: 100, // Max page size
				},
			};

			const queryString = buildStrapiQuery(paginatedQuery);
			const fullEndpoint = `${endpointConfig.endpoint}?${queryString}`;

			debug && console.log(`Fetching page ${page}: ${STRAPI_URL}/api/${fullEndpoint}`);

			const strapiData = await strapiRequest(fullEndpoint);

			if (strapiData && strapiData.data) {
				// Handle both single items and arrays
				const pageData = Array.isArray(strapiData.data) ? strapiData.data : [strapiData.data];
				allData = allData.concat(pageData);

				// Check if there are more pages
				if (strapiData.meta && strapiData.meta.pagination) {
					const { page: currentPage, pageCount } = strapiData.meta.pagination;
					hasMorePages = currentPage < pageCount;
					page++;
				} else {
					// No pagination info, assume this is the only page
					hasMorePages = false;
				}
			} else {
				hasMorePages = false;
			}
		}

		debug && console.log(`Fetched ${allData.length} total records for ${tableName}`);

		// Transform all the collected data
		const transformedData = transformStrapiData({ data: allData }, tableName);

		return transformedData;
	} catch (error) {
		debug && console.error(`Error fetching Strapi data for ${tableName}:`, error.message);
		return {};
	}
}

// Main function to fetch all content types
async function fetchAllStrapiContent(tableMapping) {
	const fullData = {};

	// Process only the mapped endpoints we have configured
	for (const tableName of Object.keys(tableMapping)) {
		if (STRAPI_ENDPOINTS[tableName]) {
			try {
				const data = await fetchStrapiContentType(tableName);
				fullData[tableName] = data;
			} catch (error) {
				debug && console.error(`Failed to fetch ${tableName}:`, error.message);
				fullData[tableName] = {};
			}
		} else {
			// Skip unmapped endpoints (no longer error for missing mappings)
			fullData[tableName] = {};
		}
	}

	return fullData;
}

// Create a new record in Strapi
async function createStrapiRecord(contentType, data) {
	try {
		const response = await strapiRequest(contentType, {
			method: "POST",
			body: JSON.stringify({ data }),
		});

		return response.data;
	} catch (error) {
		if (debug) {
			console.error(`Error creating record in ${contentType}:`, error);
		}
		throw error;
	}
}

module.exports = {
	strapiRequest,
	fetchStrapiContentType,
	fetchAllStrapiContent,
	createStrapiRecord,
	transformStrapiData,
	transformImageData,
	STRAPI_ENDPOINTS,
};
