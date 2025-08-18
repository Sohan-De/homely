import { Alert } from 'react-native';
import { supabase } from '../config/supabase';

// Property categories data
const propertyCategories = [
  { id: 1, name: 'Popular', display_order: 1 },
  { id: 2, name: 'Nearby', display_order: 2 },
  { id: 3, name: 'Recommended', display_order: 3 },
  { id: 4, name: 'New', display_order: 4 },
  { id: 5, name: 'Verified', display_order: 5 },
  { id: 6, name: 'Luxury', display_order: 6 },
  { id: 7, name: 'Affordable', display_order: 7 },
];

// Paris addresses for properties
const parisAddresses = [
  '20 Rue de Monttessuy, 75007 Paris',
  '37 Quai Branly, 75007 Paris',
  '93 Quai d\'Orsay, 75007 Paris',
  '126 Rue de l\'Université, 75007 Paris',
  '29 Avenue Rapp, 75007 Paris',
  'Rue du Général Camou, 75007 Paris',
  '49 Boulevard de Grenelle, 75015 Paris',
  'Rue de Grenelle, 75007 Paris',
  '3 Square Rapp, 75007 Paris',
  '33 Rue du Champ-de-Mars, 75007 Paris',
  'Place du Trocadéro et du 11 Novembre, 75016 Paris',
  'Avenue d\'Iéna, 75016 Paris',
  'Tour Eiffel (South Pillar), Champ de Mars, 75007 Paris',
  '2 Rue Augereau, 75007 Paris',
  '10 Rue Amélie, 75007 Paris',
  '5 Rue Beaugrenelle, 75015 Paris',
  '19 Avenue de la Bourdonnais, 75007 Paris',
  'Rue Cler, 75007 Paris',
  'Rue Saint-Dominique, 75007 Paris',
  'Avenue de Breteuil, 75007 Paris'
];

// Property data
const properties = [
  // Studio apartments
  {
    id: 1,
    name: 'Blissful Haven',
    description: 'Cozy studio apartment with modern amenities',
    property_type: 'studio',
    category_id: 1, // Popular
    price: 1250,
    image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[0],
    beds: 1,
    baths: 1,
    sqft: 550,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Urban Retreat',
    description: 'Modern studio in the heart of downtown',
    property_type: 'studio',
    category_id: 2, // Nearby
    price: 1100,
    image_url: 'https://images.unsplash.com/photo-1598928636135-d146006ff4be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[1],
    beds: 1,
    baths: 1,
    sqft: 500,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Sunset Studio',
    description: 'Beautiful studio with amazing sunset views',
    property_type: 'studio',
    category_id: 3, // Recommended
    price: 1350,
    image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[2],
    beds: 1,
    baths: 1,
    sqft: 600,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
  
  // Condos
  {
    id: 4,
    name: 'Radiant Heights',
    description: 'Luxurious condo with premium furnishings',
    property_type: 'condo',
    category_id: 4, // New
    price: 1800,
    image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[3],
    beds: 2,
    baths: 2,
    sqft: 950,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Sky Loft',
    description: 'Sophisticated condo with stunning skyline views',
    property_type: 'condo',
    category_id: 6, // Luxury
    price: 2200,
    image_url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[4],
    beds: 3,
    baths: 2,
    sqft: 1200,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'Parkside Residence',
    description: 'Beautiful condo overlooking the central park',
    property_type: 'condo',
    category_id: 5, // Verified
    price: 1950,
    image_url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[5],
    beds: 2,
    baths: 2,
    sqft: 1050,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
  
  // Additional properties for variety
  {
    id: 7,
    name: 'Cozy Corner',
    description: 'Affordable and comfortable studio for students',
    property_type: 'studio',
    category_id: 7, // Affordable
    price: 850,
    image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[6],
    beds: 1,
    baths: 1,
    sqft: 450,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 8,
    name: 'Grand Villa',
    description: 'Spacious villa with private garden',
    property_type: 'villa',
    category_id: 6, // Luxury
    price: 3500,
    image_url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[7],
    beds: 4,
    baths: 3,
    sqft: 2800,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  
  // Adding 7 more properties to reach a total of 15
  {
    id: 9,
    name: 'Riverside Apartment',
    description: 'Modern apartment with stunning river views',
    property_type: 'apartment',
    category_id: 2, // Nearby
    price: 1650,
    image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[8],
    beds: 2,
    baths: 2,
    sqft: 950,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 10,
    name: 'Mountain View Cabin',
    description: 'Rustic cabin with breathtaking mountain views',
    property_type: 'cabin',
    category_id: 3, // Recommended
    price: 1200,
    image_url: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[9],
    beds: 2,
    baths: 1,
    sqft: 800,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 11,
    name: 'Budget Studio',
    description: 'Compact and affordable studio in convenient location',
    property_type: 'studio',
    category_id: 7, // Affordable
    price: 750,
    image_url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[10],
    beds: 1,
    baths: 1,
    sqft: 400,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 12,
    name: 'Verified Townhouse',
    description: 'Spacious verified townhouse with modern amenities',
    property_type: 'townhouse',
    category_id: 5, // Verified
    price: 2100,
    image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[11],
    beds: 3,
    baths: 2,
    sqft: 1700,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 13,
    name: 'New Horizon Flat',
    description: 'Brand new apartment with all the latest features',
    property_type: 'apartment',
    category_id: 4, // New
    price: 1850,
    image_url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[12],
    beds: 2,
    baths: 2,
    sqft: 1000,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 14,
    name: 'Celebrity Penthouse',
    description: 'Luxurious penthouse with panoramic city views',
    property_type: 'penthouse',
    category_id: 6, // Luxury
    price: 5000,
    image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[13],
    beds: 4,
    baths: 4,
    sqft: 3200,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 15,
    name: 'Popular Loft',
    description: 'Trendy loft apartment in a converted warehouse',
    property_type: 'loft',
    category_id: 1, // Popular
    price: 1900,
    image_url: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[14],
    beds: 1,
    baths: 1,
    sqft: 900,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 16,
    name: 'Lakeside Cabin',
    description: 'Cozy cabin with stunning lake views',
    property_type: 'cabin',
    category_id: 3, // Recommended
    price: 1350,
    image_url: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[15],
    beds: 2,
    baths: 1,
    sqft: 850,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 17,
    name: 'Modern Mansion',
    description: 'Elegant mansion with premium amenities',
    property_type: 'mansion',
    category_id: 6, // Luxury
    price: 7500,
    image_url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[16],
    beds: 6,
    baths: 5,
    sqft: 5000,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 18,
    name: 'Economy Apartment',
    description: 'Affordable apartment with all the essentials',
    property_type: 'apartment',
    category_id: 7, // Affordable
    price: 850,
    image_url: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[17],
    beds: 1,
    baths: 1,
    sqft: 500,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 19,
    name: 'Contemporary Condo',
    description: 'Modern condo with state-of-the-art amenities',
    property_type: 'condo',
    category_id: 4, // New
    price: 2050,
    image_url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[18],
    beds: 2,
    baths: 2,
    sqft: 1100,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 20,
    name: 'Executive Townhouse',
    description: 'Exclusive townhouse in a prime location',
    property_type: 'townhouse',
    category_id: 1, // Popular
    price: 2400,
    image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    location: parisAddresses[19],
    beds: 3,
    baths: 2.5,
    sqft: 1800,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
];

// Check if tables exist and seed data
export async function setupSupabase() {
  console.log('Setting up Supabase database...');
  
  try {
    // Check if tables exist by trying to query the property_categories table
    const { data, error } = await supabase
      .from('property_categories')
      .select('count')
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist
        console.log('Tables don\'t exist. Please create them using SQL Editor in Supabase dashboard.');
        Alert.alert(
          'Database Setup Required',
          'The database tables don\'t exist yet. Please create them using the SQL provided in the setupSql.js file.',
          [
            { text: 'OK' }
          ]
        );
        return { 
          success: false, 
          message: 'Tables don\'t exist. Follow instructions in setupSql.js file.' 
        };
      } else {
        console.error('Error checking for tables:', error);
        return { success: false, message: error.message };
      }
    }
    
    // Tables exist, check if we need to seed data
    const { data: categoriesCount, error: countError } = await supabase
      .from('property_categories')
      .select('count')
      .single();
    
    if (countError) {
      console.error('Error checking categories count:', countError);
      return { success: false, message: countError.message };
    }
    
    // If we have categories, assume data is already seeded
    if (categoriesCount && categoriesCount.count > 0) {
      console.log('Data already exists. Skipping seeding.');
      return { success: true, message: 'Database already set up.' };
    }
    
    // Seed the data
    return await seedData();
    
  } catch (error) {
    console.error('Error setting up database:', error);
    return { success: false, message: error.message };
  }
}

// Seed database with initial data
async function seedData() {
  console.log('Seeding data...');
  
  try {
    // Insert categories
    const { error: categoriesError } = await supabase
      .from('property_categories')
      .upsert(propertyCategories);
    
    if (categoriesError) {
      console.error('Error seeding categories:', categoriesError);
      return { success: false, message: categoriesError.message };
    }
    
    console.log('Categories seeded successfully');
    
    // Insert properties
    const { error: propertiesError } = await supabase
      .from('properties')
      .upsert(properties);
    
    if (propertiesError) {
      console.error('Error seeding properties:', propertiesError);
      return { success: false, message: propertiesError.message };
    }
    
    console.log('Properties seeded successfully');
    
    return { success: true, message: 'Data seeded successfully' };
  } catch (error) {
    console.error('Error in seedData:', error);
    return { success: false, message: error.message };
  }
}

export const setupSupabaseSchema = async () => {
  try {
    // Create the create_property_images_table stored procedure
    const { error } = await supabase.rpc('setup_database_schema');
    if (error) {
      console.error('Error setting up database schema:', error);
      
      // Try to create the stored procedure first
      const createProcedureResult = await supabase.rpc('create_stored_procedures');
      
      if (!createProcedureResult.error) {
        // Then try to set up the schema again
        await supabase.rpc('setup_database_schema');
      }
    }
  } catch (error) {
    console.error('Error in setupSupabaseSchema:', error);
  }
};

export const createPropertyImagesTable = async () => {
  try {
    // Try to directly create the table first using the main function
    try {
      const { error } = await supabase.rpc('create_property_images_table');
      if (!error) {
        console.log('Property images table created successfully');
        
        // Add proper RLS policies for authenticated users
        await setupPropertyImagesRLS();
        return;
      }
    } catch (directError) {
      console.log('Could not directly create table, trying procedure...');
    }

    // Try the procedure if direct creation failed
    try {
      const { error: procedureError } = await supabase.rpc('create_property_images_table_procedure');
      
      if (!procedureError) {
        console.log('Property images table created via procedure');
        
        // Add proper RLS policies for authenticated users
        await setupPropertyImagesRLS();
        return;
      }
      
      console.error('Error creating procedure:', procedureError);
    } catch (procedureError) {
      console.log('Procedure not found, creating table via SQL...');
    }
    
    // If both methods failed, create the table using SQL
    const { error: sqlError } = await supabase.rpc('exec_sql', { 
      sql_query: `
        CREATE TABLE IF NOT EXISTS property_images (
          id SERIAL PRIMARY KEY,
          property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
          image_url TEXT NOT NULL,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Anyone can view property images" ON property_images;
        
        CREATE POLICY "Anyone can view property images" 
          ON property_images 
          FOR SELECT 
          USING (true);
          
        DROP POLICY IF EXISTS "Authenticated users can insert property images" ON property_images;
        
        CREATE POLICY "Authenticated users can insert property images" 
          ON property_images 
          FOR INSERT 
          TO authenticated 
          WITH CHECK (true);
          
        DROP POLICY IF EXISTS "Authenticated users can update property images" ON property_images;
        
        CREATE POLICY "Authenticated users can update property images" 
          ON property_images 
          FOR UPDATE 
          TO authenticated 
          USING (true);
          
        DROP POLICY IF EXISTS "Authenticated users can delete property images" ON property_images;
        
        CREATE POLICY "Authenticated users can delete property images" 
          ON property_images 
          FOR DELETE 
          TO authenticated 
          USING (true);
      `
    });
    
    if (sqlError) {
      console.error('Error creating table via SQL:', sqlError);
    } else {
      console.log('Property images table created via SQL with proper RLS policies');
    }
    
  } catch (error) {
    console.error('Error in createPropertyImagesTable:', error);
  }
};

// Setup RLS policies for property_images table
const setupPropertyImagesRLS = async () => {
  try {
    // Add RLS policies for authenticated users
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Ensure RLS is enabled
        ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Anyone can view property images" ON property_images;
        DROP POLICY IF EXISTS "Authenticated users can insert property images" ON property_images;
        DROP POLICY IF EXISTS "Authenticated users can update property images" ON property_images;
        DROP POLICY IF EXISTS "Authenticated users can delete property images" ON property_images;
        
        -- Create policies
        CREATE POLICY "Anyone can view property images" 
          ON property_images 
          FOR SELECT 
          USING (true);
          
        CREATE POLICY "Authenticated users can insert property images" 
          ON property_images 
          FOR INSERT 
          TO authenticated 
          WITH CHECK (true);
          
        CREATE POLICY "Authenticated users can update property images" 
          ON property_images 
          FOR UPDATE 
          TO authenticated 
          USING (true);
          
        CREATE POLICY "Authenticated users can delete property images" 
          ON property_images 
          FOR DELETE 
          TO authenticated 
          USING (true);
      `
    });
    
    if (error) {
      console.error('Error setting up RLS policies:', error);
    } else {
      console.log('RLS policies set up successfully for property_images table');
    }
  } catch (error) {
    console.error('Error in setupPropertyImagesRLS:', error);
  }
};

// Setup storage bucket and policies
export const setupStorageBucket = async () => {
  try {
    console.log('Using existing property-images bucket');
    
    // Skip bucket creation since it already exists manually
    // Just set up storage policies via SQL
    try {
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql_query: `
          -- Make sure bucket is public
          UPDATE storage.buckets 
          SET public = true 
          WHERE name = 'property-images';
          
          -- Drop existing policies if they exist
          DROP POLICY IF EXISTS "Allow authenticated users full access" ON storage.objects;
          DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
          
          -- Create direct policies on storage.objects table
          CREATE POLICY "Allow authenticated users full access"
          ON storage.objects
          FOR ALL
          TO authenticated
          USING (bucket_id = 'property-images')
          WITH CHECK (bucket_id = 'property-images');
          
          -- Allow public read access to property-images bucket
          CREATE POLICY "Allow public read access"
          ON storage.objects
          FOR SELECT
          TO anon
          USING (bucket_id = 'property-images');
        `
      });
      
      if (policyError) {
        console.error('Error setting up storage policies:', policyError);
      } else {
        console.log('Storage policies set up successfully');
      }
    } catch (sqlError) {
      console.error('Error executing SQL for storage policies:', sqlError);
    }
    
    return true;
  } catch (error) {
    console.error('Error in setupStorageBucket:', error);
    return false;
  }
};

// Default export with all Supabase setup functionality
const setupSupabaseService = {
  setupSupabase,
  setupSupabaseSchema,
  createPropertyImagesTable,
  setupStorageBucket
};

export default setupSupabaseService; 