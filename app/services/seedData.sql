-- Clear existing data
DELETE FROM property_favorites;
DELETE FROM properties;
DELETE FROM property_categories;

-- Reset sequences
ALTER SEQUENCE property_categories_id_seq RESTART WITH 1;
ALTER SEQUENCE properties_id_seq RESTART WITH 1;
ALTER SEQUENCE property_favorites_id_seq RESTART WITH 1;

-- Insert property categories
INSERT INTO property_categories (name, display_order) VALUES
('Popular', 1),
('Nearby', 2),
('Recommended', 3),
('New', 4),
('Verified', 5),
('Luxury', 6),
('Affordable', 7);

-- Insert properties
INSERT INTO properties (
  name, 
  description, 
  property_type, 
  category_id, 
  price, 
  image_url, 
  location, 
  beds, 
  baths, 
  sqft, 
  is_featured
) VALUES
-- Studio apartments (Popular, Affordable)
(
  'QuaintQuarters Living',
  'QuaintQuarters Living: Experience the perfect blend of charm and convenience in our cozy studio apartment. Thoughtfully designed for comfort and style, this modern urban haven maximizes space and natural light. Enjoy community amenities and easy access to the city''s vibrant scene, where every detail is crafted for your joy.',
  'studio',
  1, -- Popular
  404.90,
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  '20 Rue de Monttessuy, 75007 Paris',
  2,
  1,
  1500,
  true
),
(
  'Urban Retreat',
  'Modern studio in the heart of downtown. Perfect for young professionals seeking a convenient and stylish living space with all amenities within walking distance.',
  'studio',
  7, -- Affordable
  350.00,
  'https://images.unsplash.com/photo-1598928636135-d146006ff4be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  '37 Quai Branly, 75007 Paris',
  1,
  1,
  500,
  false
),
(
  'Sunset Studio',
  'Beautiful studio with amazing sunset views. This cozy space offers the perfect balance of comfort and style with large windows that flood the apartment with natural light.',
  'studio',
  3, -- Recommended
  380.00,
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  '93 Quai d''Orsay, 75007 Paris',
  1,
  1,
  550,
  true
),

-- Condos (New, Luxury, Verified)
(
  'Radiant Heights',
  'Luxurious condo with premium furnishings and finishes. This spacious unit features high ceilings, hardwood floors, and a gourmet kitchen with top-of-the-line appliances.',
  'condo',
  4, -- New
  1800.00,
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  '126 Rue de l''Université, 75007 Paris',
  2,
  2,
  950,
  false
),
(
  'Sky Loft',
  'Sophisticated condo with stunning skyline views. Located in the prestigious Skyline District, this unit offers luxury living with access to premium amenities including a rooftop pool.',
  'condo',
  6, -- Luxury
  2200.00,
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  '29 Avenue Rapp, 75007 Paris',
  3,
  2,
  1200,
  true
),
(
  'Parkside Residence',
  'Beautiful condo overlooking the central park. This verified property offers a serene living environment with all the conveniences of city life just steps away.',
  'condo',
  5, -- Verified
  1950.00,
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  'Rue du Général Camou, 75007 Paris',
  2,
  2,
  1050,
  false
),

-- Apartments (Nearby, Popular)
(
  'Riverside Apartment',
  'Modern apartment with stunning river views. This spacious unit features an open floor plan, updated kitchen, and a private balcony overlooking the river.',
  'apartment',
  2, -- Nearby
  1650.00,
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  '49 Boulevard de Grenelle, 75015 Paris',
  2,
  2,
  950,
  true
),
(
  'Central Park View',
  'Elegant apartment with direct park views. This popular unit is perfectly located near shopping, dining, and entertainment options.',
  'apartment',
  1, -- Popular
  1750.00,
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  'Rue de Grenelle, 75007 Paris',
  2,
  2,
  1000,
  true
),

-- Houses (Luxury, Verified)
(
  'Grand Villa',
  'Spacious villa with private garden and pool. This luxury property offers the ultimate in comfort and privacy with high-end finishes throughout.',
  'house',
  6, -- Luxury
  3500.00,
  'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  '3 Square Rapp, 75007 Paris',
  4,
  3,
  2800,
  true
),
(
  'Family Home',
  'Spacious verified family home in a quiet neighborhood. This property has been thoroughly inspected and certified for quality and safety.',
  'house',
  5, -- Verified
  2800.00,
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  '33 Rue du Champ-de-Mars, 75007 Paris',
  4,
  3,
  2200,
  false
),

-- Cabins (Recommended)
(
  'Mountain View Cabin',
  'Rustic cabin with breathtaking mountain views. Perfect for those seeking a peaceful retreat with nature right at your doorstep.',
  'cabin',
  3, -- Recommended
  1200.00,
  'https://images.unsplash.com/photo-1542718610-a1d656d1884c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  'Place du Trocadéro et du 11 Novembre, 75016 Paris',
  2,
  1,
  800,
  false
),
(
  'Lakeside Cabin',
  'Cozy cabin with direct lake access. This recommended property is perfect for weekend getaways or year-round living for nature enthusiasts.',
  'cabin',
  3, -- Recommended
  1350.00,
  'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  'Avenue d''Iéna, 75016 Paris',
  2,
  1,
  850,
  true
),

-- Budget Options (Affordable)
(
  'Budget Studio',
  'Compact and affordable studio in convenient location. Perfect for students or young professionals on a budget.',
  'studio',
  7, -- Affordable
  750.00,
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  'Tour Eiffel (South Pillar), Champ de Mars, 75007 Paris',
  1,
  1,
  400,
  false
),
(
  'Economy Apartment',
  'Affordable one-bedroom apartment with all the essentials. Great value for money in a convenient location.',
  'apartment',
  7, -- Affordable
  850.00,
  'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  '2 Rue Augereau, 75007 Paris',
  1,
  1,
  500,
  true
),

-- New Properties
(
  'Fresh Start Loft',
  'Brand new loft with modern design and amenities. Be the first to live in this stylish space with high ceilings and abundant natural light.',
  'loft',
  4, -- New
  1650.00,
  'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  '10 Rue Amélie, 75007 Paris',
  1,
  1,
  800,
  false
),
(
  'Modern Townhouse',
  'Just completed townhouse with cutting-edge design. This new property features smart home technology and energy-efficient systems throughout.',
  'townhouse',
  4, -- New
  2100.00,
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  '5 Rue Beaugrenelle, 75015 Paris',
  3,
  2.5,
  1600,
  true
),

-- Nearby Options
(
  'Walking Distance Flat',
  'Convenient apartment within walking distance to major amenities. This nearby property offers the perfect balance of comfort and convenience.',
  'apartment',
  2, -- Nearby
  1450.00,
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  '19 Avenue de la Bourdonnais, 75007 Paris',
  2,
  1,
  850,
  false
),
(
  'Corner Store Condo',
  'Modern condo just steps from shopping and dining. This nearby property puts you right in the heart of the action.',
  'condo',
  2, -- Nearby
  1550.00,
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  'Rue Cler, 75007 Paris',
  1,
  1,
  750,
  true
),

-- Luxury Options
(
  'Celebrity Penthouse',
  'Luxurious penthouse with panoramic city views. This premium property features high-end finishes, a private elevator, and exclusive rooftop access.',
  'penthouse',
  6, -- Luxury
  5000.00,
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  'Rue Saint-Dominique, 75007 Paris',
  4,
  4,
  3200,
  true
),
(
  'Executive Mansion',
  'Stunning mansion with premium amenities and finishes. This luxury property offers the ultimate in elegant living with no detail overlooked.',
  'mansion',
  6, -- Luxury
  7500.00,
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
  'Avenue de Breteuil, 75007 Paris',
  6,
  5,
  5000,
  true
);

-- Add more properties as needed to reach your desired count 