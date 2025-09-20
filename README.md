# Instructions

1. Switch to Node v20
2. Ensure Postgres is running
3. Sync CMS data
   1. Transfer data from cloud CMS to local instance:  
      `strapi transfer --from https://XYZ.strapiapp.com/admin` (replace XYZ with actual Strapi cloud instance URL)
      1. **Warning**: This will delete all existing local data
      2. Transfer token is stored in SnippetsLab
4. Start CMS server
   1. `cd cms && npm run dev`
   2. Visit `http://localhost:1337/admin`
   3. Login information is stored in SnippetsLab
5. Start web application
   1. `npm run dev`
   2. Visit `localhost:8000` or `localhost:8001` (with Browser Sync)
   3. Type `rs` in Terminal to restart application at any time
6. Make changes to web application
   1. Adjust environment variables in DigitalOcean server if necessary
   2. `git push dokku master`
7. Make changes to Strapi CMS
   1. `cd cms && npm run deploy`
   2. Wait for deployment to fully finish online (~10 minutes)
   3. `npm run strapi transfer -- --to https://XYZ.strapiapp.com/admin` (replace XYZ with actual Strapi cloud instance URL)
      1. Transfer token is stored in SnippetsLab
   4. Re-set webhook in production Admin Settings: <https://XYZ.strapiapp.com/admin/settings/webhooks>
      1. URL & Headers stored in SnippetsLab
      2. Select ALL events
