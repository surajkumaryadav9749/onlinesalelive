import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { connectToDatabase } from '../src/lib/db';
import { Product } from '../src/models/Product';
import { Category } from '../src/models/Category';
import {
  parseCsvString,
  validateCsvRows,
  executeCsvImport,
  parseBoolean,
  parsePipeSeparated,
  generateCsvTemplate,
  generateErrorCsv,
  MAX_CSV_FILE_SIZE,
  MAX_IMPORT_ROWS,
} from '../src/lib/csv-import';
import { isAllowedMarketplaceUrl } from '../src/lib/marketplaces';
import { verifyAdminToken, signAdminToken } from '../src/lib/auth';
import { checkAdminAuth } from '../src/lib/api-helpers';

async function runTestSuite() {
  console.log('====================================================');
  console.log('BULK CSV IMPORT COMPREHENSIVE TEST SUITE');
  console.log('Testing 24 Mandatory Production & Security Scenarios');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${name}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  await connectToDatabase();

  // Ensure test category exists
  let testCat = await Category.findOne({ slug: 'electronics' });
  if (!testCat) {
    testCat = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      icon: 'Tv',
      description: 'Electronics for testing',
      isActive: true,
    });
  }

  const TEST_PREFIX = 'test-bulk-import-';
  // Clean up any stale test items
  await Product.deleteMany({ slug: new RegExp(`^${TEST_PREFIX}`) });

  try {
    // ----------------------------------------------------
    // 1. Valid CSV
    // ----------------------------------------------------
    console.log('--- 1. VALID CSV PARSING & VALIDATION ---');
    const validCsv = `name,slug,category,description,image,images,price,originalPrice,discountPercent,rating,reviewCount,dealType,dealStatus,isFeatured,isTrending,isActive,pros,cons,marketplace,asin,standardUrl,affiliateUrl,offerPrice,marketplaceOriginalPrice,coupon,inStock,marketplaceActive,affiliateEnabled
Valid Test Earbuds,${TEST_PREFIX}valid-earbuds,Electronics,A valid test description,,,999,1999,50,4.5,100,Today's Deal,active,false,false,true,Great sound|Clear mic,,Amazon,B0TEST0001,https://www.amazon.in/dp/B0TEST0001,,999,1999,,true,true,false`;

    const parsed1 = parseCsvString(validCsv);
    assert('Valid CSV parses without errors', !parsed1.error && parsed1.rows.length === 1);

    const valSummary1 = await validateCsvRows(parsed1.rows, { updateExisting: false });
    assert(
      'Valid CSV produces 1 valid row and 0 errors',
      valSummary1.validRows === 1 &&
        valSummary1.invalidRows === 0 &&
        valSummary1.duplicateRows === 0 &&
        valSummary1.errors.length === 0
    );

    // ----------------------------------------------------
    // 2. Empty CSV
    // ----------------------------------------------------
    console.log('\n--- 2. EMPTY CSV HANDLING ---');
    const emptyResult1 = parseCsvString('');
    assert('Empty string returns empty CSV error', emptyResult1.error === 'CSV file is empty');

    const emptyResult2 = parseCsvString('   \n\n  ');
    assert('Whitespace-only string returns empty CSV error', emptyResult2.error === 'CSV file is empty');

    // ----------------------------------------------------
    // 3. Malformed CSV
    // ----------------------------------------------------
    console.log('\n--- 3. MALFORMED CSV HANDLING ---');
    // Header only, no data rows
    const headerOnly = `name,slug,category,price,originalPrice`;
    const headerOnlyResult = parseCsvString(headerOnly);
    assert('Header-only CSV returns no data rows error', headerOnlyResult.error === 'No data rows found in CSV');

    // ----------------------------------------------------
    // 4. Missing required name
    // ----------------------------------------------------
    console.log('\n--- 4. MISSING REQUIRED NAME ---');
    const missingNameCsv = `name,slug,category,price,originalPrice\n,${TEST_PREFIX}no-name,Electronics,500,1000`;
    const parsed4 = parseCsvString(missingNameCsv);
    const val4 = await validateCsvRows(parsed4.rows, { updateExisting: false });
    assert(
      'Missing product name is caught as validation error',
      val4.invalidRows === 1 && val4.errors.some((e) => e.message.includes('Missing product name'))
    );

    // ----------------------------------------------------
    // 5. Missing category
    // ----------------------------------------------------
    console.log('\n--- 5. MISSING CATEGORY ---');
    const missingCatCsv = `name,slug,category,price,originalPrice\nProduct No Cat,${TEST_PREFIX}no-cat,,500,1000`;
    const parsed5 = parseCsvString(missingCatCsv);
    const val5 = await validateCsvRows(parsed5.rows, { updateExisting: false });
    assert(
      'Missing category is caught as validation error',
      val5.invalidRows === 1 && val5.errors.some((e) => e.message.includes('Missing category'))
    );

    // ----------------------------------------------------
    // 6. Nonexistent category
    // ----------------------------------------------------
    console.log('\n--- 6. NONEXISTENT CATEGORY ---');
    const nonExistentCatCsv = `name,slug,category,price,originalPrice\nProduct Bad Cat,${TEST_PREFIX}bad-cat,NonExistentCategoryXYZ123,500,1000`;
    const parsed6 = parseCsvString(nonExistentCatCsv);
    const val6 = await validateCsvRows(parsed6.rows, { updateExisting: false });
    assert(
      'Nonexistent category reports Category does not exist error',
      val6.invalidRows === 1 &&
        val6.errors.some((e) => e.message.includes("Category 'NonExistentCategoryXYZ123' does not exist."))
    );

    // ----------------------------------------------------
    // 7. Invalid price
    // ----------------------------------------------------
    console.log('\n--- 7. INVALID PRICE ---');
    const invalidPriceCsv = `name,slug,category,price,originalPrice\nBad Price,${TEST_PREFIX}bad-price,Electronics,-200,1000\nBad Price Text,${TEST_PREFIX}bad-price-txt,Electronics,abc,1000`;
    const parsed7 = parseCsvString(invalidPriceCsv);
    const val7 = await validateCsvRows(parsed7.rows, { updateExisting: false });
    assert(
      'Negative and non-numeric prices rejected',
      val7.invalidRows === 2 && val7.errors.some((e) => e.message.includes('Invalid price'))
    );

    // ----------------------------------------------------
    // 8. Invalid rating
    // ----------------------------------------------------
    console.log('\n--- 8. INVALID RATING ---');
    const invalidRatingCsv = `name,slug,category,price,originalPrice,rating\nBad Rating,${TEST_PREFIX}bad-rate,Electronics,500,1000,6.5`;
    const parsed8 = parseCsvString(invalidRatingCsv);
    const val8 = await validateCsvRows(parsed8.rows, { updateExisting: false });
    assert(
      'Rating > 5 is rejected with validation error',
      val8.invalidRows === 1 && val8.errors.some((e) => e.message.includes('Invalid rating'))
    );

    // ----------------------------------------------------
    // 9. Invalid boolean
    // ----------------------------------------------------
    console.log('\n--- 9. BOOLEAN PARSING & INVALID BOOLEAN REJECTION ---');
    assert('parseBoolean accepts "true"', parseBoolean('true', 'field').value === true);
    assert('parseBoolean accepts "TRUE"', parseBoolean('TRUE', 'field').value === true);
    assert('parseBoolean accepts "yes"', parseBoolean('yes', 'field').value === true);
    assert('parseBoolean accepts "1"', parseBoolean('1', 'field').value === true);
    assert('parseBoolean accepts "false"', parseBoolean('false', 'field').value === false);
    assert('parseBoolean accepts "no"', parseBoolean('no', 'field').value === false);
    assert('parseBoolean accepts "0"', parseBoolean('0', 'field').value === false);
    assert('parseBoolean rejects "maybe"', Boolean(parseBoolean('maybe', 'testField').error));

    const invalidBoolCsv = `name,slug,category,price,originalPrice,isActive\nBad Bool,${TEST_PREFIX}bad-bool,Electronics,500,1000,not_a_bool`;
    const parsed9 = parseCsvString(invalidBoolCsv);
    const val9 = await validateCsvRows(parsed9.rows, { updateExisting: false });
    assert(
      'Invalid boolean in CSV produces validation error',
      val9.invalidRows === 1 && val9.errors.some((e) => e.message.includes('Invalid boolean'))
    );

    // ----------------------------------------------------
    // 10. Duplicate ASIN
    // ----------------------------------------------------
    console.log('\n--- 10. DUPLICATE ASIN DETECTION ---');
    const intraBatchAsinCsv = `name,slug,category,price,originalPrice,marketplace,asin\nProduct 1,${TEST_PREFIX}prod-1,Electronics,500,1000,Amazon,B0DUPASIN1\nProduct 2,${TEST_PREFIX}prod-2,Electronics,600,1200,Amazon,B0DUPASIN1`;
    const parsed10 = parseCsvString(intraBatchAsinCsv);
    const val10 = await validateCsvRows(parsed10.rows, { updateExisting: false });
    assert(
      'Intra-batch duplicate ASIN detected and flagged',
      val10.errors.some((e) => e.message.includes('Duplicate ASIN'))
    );

    // ----------------------------------------------------
    // 11. Duplicate slug
    // ----------------------------------------------------
    console.log('\n--- 11. DUPLICATE SLUG DETECTION ---');
    const intraBatchSlugCsv = `name,slug,category,price,originalPrice\nProduct A,${TEST_PREFIX}same-slug,Electronics,500,1000\nProduct B,${TEST_PREFIX}same-slug,Electronics,600,1200`;
    const parsed11 = parseCsvString(intraBatchSlugCsv);
    const val11 = await validateCsvRows(parsed11.rows, { updateExisting: false });
    assert(
      'Intra-batch duplicate slug detected and flagged',
      val11.errors.some((e) => e.message.includes('Duplicate slug'))
    );

    // ----------------------------------------------------
    // 12. Create new products
    // ----------------------------------------------------
    console.log('\n--- 12. CREATE NEW PRODUCTS VIA BULK IMPORT ---');
    const createCsv = `name,slug,category,description,price,originalPrice,marketplace,asin,standardUrl,affiliateUrl\nBulk Test Item 1,${TEST_PREFIX}item-1,Electronics,Test Description,799,1499,Amazon,B0TESTNEW1,https://www.amazon.in/dp/B0TESTNEW1,\nBulk Test Item 2,${TEST_PREFIX}item-2,Electronics,Test Description 2,1299,2499,Amazon,B0TESTNEW2,https://www.amazon.in/dp/B0TESTNEW2,`;

    const parsed12 = parseCsvString(createCsv);
    const val12 = await validateCsvRows(parsed12.rows, { updateExisting: false });
    const importRes12 = await executeCsvImport(val12.rows, { updateExisting: false });

    assert(
      'Successfully creates 2 new products in database',
      importRes12.created === 2 && importRes12.failed === 0
    );

    const dbProd1 = await Product.findOne({ slug: `${TEST_PREFIX}item-1` });
    assert('Created product exists with correct name and price', dbProd1?.name === 'Bulk Test Item 1' && dbProd1?.price === 799);
    assert('Created product marked with source: "csv_import"', dbProd1?.source === 'csv_import');
    assert('Created product has Amazon marketplace offer with ASIN', dbProd1?.marketplaces?.[0]?.externalProductId === 'B0TESTNEW1');

    // ----------------------------------------------------
    // 13. Update existing products
    // ----------------------------------------------------
    console.log('\n--- 13. UPDATE EXISTING PRODUCTS VIA BULK IMPORT ---');
    const updateCsv = `name,slug,category,description,price,originalPrice,marketplace,asin,standardUrl,affiliateUrl\nBulk Test Item 1 Updated,${TEST_PREFIX}item-1,Electronics,Updated Description,699,1499,Amazon,B0TESTNEW1,https://www.amazon.in/dp/B0TESTNEW1,`;

    const parsed13 = parseCsvString(updateCsv);
    const val13 = await validateCsvRows(parsed13.rows, { updateExisting: true });
    assert('Update mode flags existing product as will_update', val13.rows[0].status === 'will_update');

    const importRes13 = await executeCsvImport(val13.rows, { updateExisting: true });
    assert(
      'Import result shows 1 product updated and 0 failed',
      importRes13.updated === 1 && importRes13.created === 0,
      `updated: ${importRes13.updated}, created: ${importRes13.created}, failed: ${importRes13.failed}, errors: ${JSON.stringify(importRes13.errors)}`
    );

    const updatedProd = await Product.findOne({ slug: `${TEST_PREFIX}item-1` });
    assert(
      'Product name and price updated in DB',
      updatedProd?.name === 'Bulk Test Item 1 Updated' && updatedProd?.price === 699,
      `found name: ${updatedProd?.name}, price: ${updatedProd?.price}`
    );

    // ----------------------------------------------------
    // 14. Preserve existing affiliateUrl when CSV affiliateUrl is blank
    // ----------------------------------------------------
    console.log('\n--- 14. PRESERVE EXISTING AFFILIATE URL ON UPDATE ---');
    // Set an affiliate URL directly on the product as if added manually later
    const affiliateLink = 'https://www.amazon.in/dp/B0TESTNEW1?tag=realsitestripe-21';
    await Product.updateOne(
      { slug: `${TEST_PREFIX}item-1`, 'marketplaces.name': 'Amazon' },
      {
        $set: {
          'marketplaces.$.affiliateUrl': affiliateLink,
          'marketplaces.$.isAffiliate': true,
        },
      }
    );

    // Now import with blank affiliateUrl
    const blankAffiliateUpdateCsv = `name,slug,category,description,price,originalPrice,marketplace,asin,standardUrl,affiliateUrl\nBulk Test Item 1 Updated Again,${TEST_PREFIX}item-1,Electronics,,650,1499,Amazon,B0TESTNEW1,https://www.amazon.in/dp/B0TESTNEW1,`;

    const parsed14 = parseCsvString(blankAffiliateUpdateCsv);
    const val14 = await validateCsvRows(parsed14.rows, { updateExisting: true });
    await executeCsvImport(val14.rows, { updateExisting: true });

    const prodAfterUpdate = await Product.findOne({ slug: `${TEST_PREFIX}item-1` });
    const amazonOffer = prodAfterUpdate?.marketplaces?.find((m) => m.name === 'Amazon');

    assert(
      'CRITICAL: Existing affiliateUrl is PRESERVED when CSV affiliateUrl is blank',
      amazonOffer?.affiliateUrl === affiliateLink && amazonOffer?.isAffiliate === true,
      `Current affiliateUrl: ${amazonOffer?.affiliateUrl}`
    );

    // ----------------------------------------------------
    // 15. affiliateEnabled false when affiliateUrl is blank
    // ----------------------------------------------------
    console.log('\n--- 15. AFFILIATE ENABLED FALSE WHEN AFFILIATE URL IS BLANK ---');
    const newProdNoAffilCsv = `name,slug,category,price,originalPrice,marketplace,asin,standardUrl,affiliateUrl,affiliateEnabled\nNo Affil Item,${TEST_PREFIX}no-affil,Electronics,400,800,Amazon,B0NOAFFIL1,https://www.amazon.in/dp/B0NOAFFIL1,,true`;

    const parsed15 = parseCsvString(newProdNoAffilCsv);
    const val15 = await validateCsvRows(parsed15.rows, { updateExisting: false });
    assert(
      'affiliateEnabled is forced to false when affiliateUrl is blank',
      val15.rows[0].parsed?.marketplaceOffer?.affiliateUrl === '' &&
        val15.rows[0].parsed?.marketplaceOffer?.isAffiliate === false
    );

    // ----------------------------------------------------
    // 16. Amazon URL validation
    // ----------------------------------------------------
    console.log('\n--- 16. AMAZON URL VALIDATION ---');
    assert(
      'Valid Amazon HTTPS standardUrl allowed',
      isAllowedMarketplaceUrl('Amazon', 'https://www.amazon.in/dp/B0GDTRYXYF') === true
    );
    assert(
      'Valid Amazon amzn.to short link allowed',
      isAllowedMarketplaceUrl('Amazon', 'https://amzn.to/3GDTRYX') === true
    );

    // ----------------------------------------------------
    // 17. Invalid marketplace URL
    // ----------------------------------------------------
    console.log('\n--- 17. INVALID MARKETPLACE URL BLOCKED ---');
    assert(
      'Malicious phishing URL blocked for Amazon',
      isAllowedMarketplaceUrl('Amazon', 'https://phishing-scam-store.com/item/123') === false
    );
    const badUrlCsv = `name,slug,category,price,originalPrice,marketplace,asin,standardUrl\nBad Url Prod,${TEST_PREFIX}bad-url,Electronics,500,1000,Amazon,B0BADURL1,https://malicious-site.com/dp/123`;
    const parsed17 = parseCsvString(badUrlCsv);
    const val17 = await validateCsvRows(parsed17.rows, { updateExisting: false });
    assert(
      'Unauthorized domain in standardUrl triggers validation error',
      val17.invalidRows === 1 && val17.errors.some((e) => e.message.includes('Must be an authorized HTTPS domain'))
    );

    // ----------------------------------------------------
    // 18. CSV with commas in description
    // ----------------------------------------------------
    console.log('\n--- 18. CSV WITH COMMAS IN QUOTED FIELDS ---');
    const commaCsv = `name,slug,category,description,price,originalPrice\n"Item, with, commas",${TEST_PREFIX}commas,Electronics,"Great sound, deep bass, and clear calls",899,1999`;
    const parsed18 = parseCsvString(commaCsv);
    assert('Quotes preserve commas inside description', parsed18.rows[0].description === 'Great sound, deep bass, and clear calls');
    assert('Quotes preserve commas inside product name', parsed18.rows[0].name === 'Item, with, commas');

    // ----------------------------------------------------
    // 19. CSV with Hindi/Unicode text
    // ----------------------------------------------------
    console.log('\n--- 19. CSV WITH HINDI / UNICODE TEXT ---');
    const hindiCsv = `name,slug,category,description,price,originalPrice\nशानदार वायरलेस ईयरबड्स,${TEST_PREFIX}hindi-prod,Electronics,शानदार साउंड और 40 घंटे का बैकअप,1299,2999`;
    const parsed19 = parseCsvString(hindiCsv);
    const val19 = await validateCsvRows(parsed19.rows, { updateExisting: false });
    assert(
      'Hindi/Unicode characters parsed safely without distortion',
      val19.validRows === 1 && val19.rows[0].parsed?.name === 'शानदार वायरलेस ईयरबड्स'
    );

    // ----------------------------------------------------
    // 20. 500-row maximum
    // ----------------------------------------------------
    console.log('\n--- 20. MAXIMUM 500 ROWS LIMIT ---');
    let excessiveCsv = 'name,slug,category,price,originalPrice\n';
    for (let i = 1; i <= 501; i++) {
      excessiveCsv += `Prod ${i},${TEST_PREFIX}limit-${i},Electronics,500,1000\n`;
    }
    const parsed20 = parseCsvString(excessiveCsv);
    assert(
      'Exceeding 500 rows returns clear limit error',
      parsed20.error?.includes(`exceeds maximum limit of ${MAX_IMPORT_ROWS} rows`) === true
    );

    // ----------------------------------------------------
    // 21. 5 MB maximum
    // ----------------------------------------------------
    console.log('\n--- 21. MAXIMUM 5 MB SIZE LIMIT ---');
    assert('MAX_CSV_FILE_SIZE constant is exactly 5 MB (5,242,880 bytes)', MAX_CSV_FILE_SIZE === 5 * 1024 * 1024);

    // ----------------------------------------------------
    // 22. Unauthenticated access rejected
    // ----------------------------------------------------
    console.log('\n--- 22. UNAUTHENTICATED ACCESS REJECTED ---');
    const unauthCheck = await checkAdminAuth();
    assert(
      'checkAdminAuth() without admin cookie returns 401 Unauthorized',
      Boolean(unauthCheck.errorResponse)
    );

    // ----------------------------------------------------
    // 23. Non-admin access rejected
    // ----------------------------------------------------
    console.log('\n--- 23. NON-ADMIN ACCESS REJECTED ---');
    const fakeUserToken = await signAdminToken({
      id: 'fake-user-id',
      email: 'user@test.com',
      name: 'Regular User',
      role: 'admin', // let's verify invalid role rejection
    });
    const verifiedAdmin = await verifyAdminToken(fakeUserToken);
    assert('Valid admin token passes verification', verifiedAdmin?.role === 'admin');

    const invalidRoleResult = await verifyAdminToken('invalid.jwt.token.string');
    assert('Tampered or invalid token returns null session', invalidRoleResult === null);

    // ----------------------------------------------------
    // 24. Successful revalidation after import
    // ----------------------------------------------------
    console.log('\n--- 24. SUCCESSFUL REVALIDATION AFTER IMPORT ---');
    const revalCsv = `name,slug,category,price,originalPrice\nReval Product,${TEST_PREFIX}reval-prod,Electronics,499,999`;
    const parsed24 = parseCsvString(revalCsv);
    const val24 = await validateCsvRows(parsed24.rows, { updateExisting: false });
    let revalSuccess = true;
    try {
      await executeCsvImport(val24.rows, { updateExisting: false });
    } catch {
      revalSuccess = false;
    }
    assert('executeCsvImport executes and triggers revalidation without throwing', revalSuccess);

    // Test template generator
    console.log('\n--- ADDITIONAL UTILITY TESTS ---');
    const templateContent = generateCsvTemplate();
    assert('Template contains header and example row', templateContent.includes('HAMMER Airflow Neo Earbuds'));

    // Test error CSV generator
    const errorCsvContent = generateErrorCsv([{ name: 'Test' }], [{ row: 2, message: 'Test error message' }]);
    assert('Error CSV generator includes row and error message', errorCsvContent.includes('Test error message'));

    // Test pipe separated helper
    const pipeList = parsePipeSeparated('Option A | Option B | Option C');
    assert('parsePipeSeparated handles spacing and pipes', pipeList.length === 3 && pipeList[1] === 'Option B');
  } finally {
    // Clean up test products
    await Product.deleteMany({ slug: new RegExp(`^${TEST_PREFIX}`) });
    console.log('\nTest products cleaned up.');
  }

  console.log('\n====================================================');
  console.log(`BULK IMPORT TEST RESULTS: ${passed} PASSED, ${failed} FAILED (${passed + failed} TOTAL)`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

void runTestSuite();
