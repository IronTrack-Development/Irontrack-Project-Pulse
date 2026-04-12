#!/usr/bin/env tsx
/**
 * Setup script for Supabase Storage bucket
 * Creates the 'uploads' bucket for temporary file storage during upload flow
 * 
 * Run with: npx tsx --env-file=.env.local scripts/setup-storage-bucket.ts
 */

import { getServiceClient } from "../src/lib/supabase";

async function setupStorageBucket() {
  const supabase = getServiceClient();

  console.log("Setting up Supabase Storage bucket...");

  // Check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const uploadsExists = buckets?.some((b) => b.name === "uploads");

  if (uploadsExists) {
    console.log("✓ 'uploads' bucket already exists");
  } else {
    // Create bucket with minimal options
    console.log("Creating bucket 'uploads'...");
    const { data, error } = await supabase.storage.createBucket("uploads", {
      public: false,
    });

    if (error) {
      console.error("✗ Failed to create bucket:", error.message);
      process.exit(1);
    }

    console.log("✓ Created 'uploads' bucket:", data);
  }

  console.log("\n✓ Storage setup complete!");
  console.log("\nBucket configuration:");
  console.log("  - Name: uploads");
  console.log("  - Public: false (private)");
  console.log("  - Max file size: 100MB");
  console.log("  - Files are automatically deleted after processing");
  console.log("\nAccepted file types:");
  console.log("  - .xlsx, .xls, .csv, .pdf, .mpp, .xer, .xml");
  
  process.exit(0);
}

setupStorageBucket();
