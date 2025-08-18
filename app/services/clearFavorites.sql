-- SQL script to clear all favorites from the database
DELETE FROM property_favorites;

-- Verify the deletion
SELECT COUNT(*) FROM property_favorites; 