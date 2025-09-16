const { chromium } = require('playwright');

async function debugLockerGrouping() {
  console.log('Starting Playwright debug session...');

  // Launch browser
  const browser = await chromium.launch({
    headless: false, // Show browser for debugging
    slowMo: 1000 // Slow down actions to observe
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log(`CONSOLE: ${text}`);
    consoleLogs.push(text);
  });

  // Collect errors
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });

  try {
    console.log('Navigating to http://localhost:5174...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });

    // Wait for page to load
    console.log('Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Switch to floor view (평면배치)
    console.log('Switching to floor view...');
    const floorButton = await page.locator('button:has-text("평면배치")');
    if (await floorButton.count() > 0) {
      await floorButton.click();
      console.log('Floor view button clicked');
      await page.waitForTimeout(1000);
    } else {
      console.log('Floor view button not found, checking for other indicators...');
      // Try to find any view toggle buttons
      const viewButtons = await page.locator('button').all();
      for (const button of viewButtons) {
        const text = await button.textContent();
        console.log(`Found button: ${text}`);
      }
    }

    // Look for lockers or placement areas
    console.log('Looking for lockers on the page...');
    const lockerElements = await page.locator('[class*="locker"], [id*="locker"], [data-locker]').all();
    console.log(`Found ${lockerElements.length} locker-related elements`);

    // Try to trigger grouping calculation by clicking around
    console.log('Trying to trigger locker grouping calculations...');

    // Click on canvas area to trigger events
    const canvas = await page.locator('canvas');
    if (await canvas.count() > 0) {
      console.log('Found canvas, clicking to trigger events...');
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.waitForTimeout(1000);

      // Try right-click to see if context menu triggers grouping
      await canvas.click({ button: 'right', position: { x: 200, y: 200 } });
      await page.waitForTimeout(1000);
    }

    // Look for SVG elements that might represent lockers
    const svgElements = await page.locator('svg rect, svg g').all();
    console.log(`Found ${svgElements.length} SVG elements`);

    // Check for any debug logs specifically about L18-L19
    const l18l19Logs = consoleLogs.filter(log =>
      log.includes('L18') || log.includes('L19') || log.includes('Distance between')
    );

    if (l18l19Logs.length > 0) {
      console.log('\n=== L18-L19 Related Logs ===');
      l18l19Logs.forEach(log => console.log(log));
    } else {
      console.log('\n=== No L18-L19 debug logs found yet ===');
      console.log('All console logs so far:');
      consoleLogs.forEach(log => console.log(`  ${log}`));
    }

    // Try to execute JavaScript to trigger grouping manually
    console.log('\nTrying to trigger grouping calculations manually...');
    await page.evaluate(() => {
      // Try to access any global functions that might trigger grouping
      if (window.updateLockerPositions) {
        console.log('[DEBUG] Calling updateLockerPositions...');
        window.updateLockerPositions();
      }
      if (window.calculateGrouping) {
        console.log('[DEBUG] Calling calculateGrouping...');
        window.calculateGrouping();
      }
      if (window.Vue && window.Vue.apps) {
        console.log('[DEBUG] Vue apps found, trying to trigger methods...');
        // Try to find Vue component and call methods
      }
    });

    await page.waitForTimeout(2000);

    // Final log collection
    const finalL18L19Logs = consoleLogs.filter(log =>
      log.includes('L18') || log.includes('L19') || log.includes('Distance between') || log.includes('corner')
    );

    console.log('\n=== Final Debug Analysis ===');
    if (finalL18L19Logs.length > 0) {
      console.log('L18-L19 related logs found:');
      finalL18L19Logs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('No L18-L19 debug logs found. The grouping calculation might not be triggered.');
      console.log('Consider:');
      console.log('1. Check if lockers L18 and L19 exist on the page');
      console.log('2. Verify if the grouping function is being called');
      console.log('3. Check if the debug logs are properly added to the code');
    }

    // Keep browser open for manual inspection
    console.log('\nBrowser will remain open for manual inspection...');
    console.log('Press Ctrl+C to close when done.');

    // Wait indefinitely for manual inspection
    await new Promise(() => {});

  } catch (error) {
    console.error('Error during debug session:', error);
  } finally {
    await browser.close();
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\nClosing browser...');
  process.exit(0);
});

debugLockerGrouping().catch(console.error);