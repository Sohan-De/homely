# Setting Up Storage Bucket Permissions for Homely App

This guide will help you set up the necessary permissions for the property images storage bucket in your Supabase project.

## Issue

The app is encountering Row Level Security (RLS) policy violations when trying to upload images to the `property-images` bucket. This is because the default RLS policies in Supabase are restrictive and need to be configured properly.

## Solution

You can set up the bucket permissions in two ways:

### Option 1: Using SQL Commands

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Go to the "SQL Editor" section
4. Create a new query
5. Copy and paste the SQL commands from one of the following files:
   - For newer Supabase versions: `app/services/setupBucketPermissions.sql`
   - For older Supabase versions: `app/services/setupBucketPermissions_simple.sql`
   - For final version: `app/services/setupBucketPermissions_final.sql`
6. Run the query

If you encounter an error like `relation "storage.policies" does not exist`, use the `setupBucketPermissions_simple.sql` script instead.

If you encounter an error like `permission denied for schema storage`, use Option 2 below.

### Option 2: Manually Creating the Bucket

If the SQL scripts don't work due to permission issues, you can manually create the bucket:

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Go to the "Storage" section
4. Click "Create bucket"
5. Enter "property-images" as the bucket name
6. Check "Public bucket" to make it public
7. Click "Create bucket"
8. Once created, click on the bucket to open it
9. Go to the "Policies" tab
10. Create the following policies:
    - Policy name: "Allow authenticated users full access"
      - For: "All operations"
      - Allowed roles: "authenticated"
      - Using expression: bucket_id = 'property-images'
    - Policy name: "Allow public read access"
      - For: "Select"
      - Allowed roles: "anon"
      - Using expression: bucket_id = 'property-images'

### Option 3: Using the Storage Setup Screen

The app includes a Storage Setup screen that can help you test and configure the bucket:

1. Open the app
2. Go to the Admin section
3. Tap on "Storage Setup"
4. Follow the instructions on the screen

## Verifying the Setup

After setting up the bucket permissions:

1. Go to the Storage Setup screen in the app
2. Tap on "Test Bucket Permissions"
3. If the test passes, tap on "Enable Image Uploads"

## Temporary Solution

Until the permissions are properly set up, the app will use fallback images instead of trying to upload to the storage bucket. This ensures the app continues to function even without proper storage permissions.

## How the Image Upload System Works

The app uses a dual-mode image upload system:

1. **Fallback Mode** (default): Uses predefined placeholder images instead of real uploads
   - This mode is active by default or when bucket permissions are not configured
   - No actual uploads are attempted, so the app works without errors
   - Implemented in `app/services/propertyImageService.js`

2. **Real Upload Mode**: Uses the Supabase storage bucket for actual image uploads
   - This mode is activated after running the bucket permission test and enabling uploads
   - Images are uploaded to the 'property-images' bucket in Supabase
   - The setting is stored in AsyncStorage so it persists between app restarts

The app automatically switches between these modes based on the setting in the Storage Setup screen.

## Troubleshooting

If you're still experiencing issues after running the SQL commands:

1. Check the Supabase logs for any errors related to storage or RLS policies
2. Ensure your Supabase project has the Storage addon enabled
3. Make sure your authenticated users have the correct roles and permissions
4. Check that your Supabase API keys have the necessary permissions

### Common Errors

- **Error: `relation "storage.policies" does not exist`**
  - Solution: Use the `setupBucketPermissions_simple.sql` script instead

- **Error: `permission denied for schema storage`**
  - Solution: Use Option 2 (Manually Creating the Bucket) instead

- **Error: `new row violates row-level security policy`**
  - Solution: Use Option 2 (Manually Creating the Bucket) instead

## Re-enabling Image Uploads

Once you've successfully set up the bucket permissions, you can re-enable image uploads using the Storage Setup screen in the app.

## Need Help?

If you continue to experience issues, please contact the development team for further assistance. 