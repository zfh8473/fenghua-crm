/**
 * Browser Automation Script to Login and Get Token
 * Uses Puppeteer to automate browser login and extract token
 * 
 * Run: cd fenghua-backend && npm install puppeteer && npx ts-node scripts/auto-login-browser.ts
 */

import puppeteer from 'puppeteer';

const TWENTY_URL = process.env.TWENTY_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TWENTY_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TWENTY_TEST_PASSWORD || '';

if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error('Please set TWENTY_TEST_EMAIL and TWENTY_TEST_PASSWORD');
  process.exit(1);
}

async function autoLoginAndGetToken() {
  console.log('🚀 Starting browser automation...');
  console.log(`URL: ${TWENTY_URL}`);
  console.log(`Email: ${TEST_EMAIL}`);

  const browser = await puppeteer.launch({
    headless: true, // Use headless mode for faster execution
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // Set up request interception first
    await page.setRequestInterception(true);
    let networkToken: string | null = null;
    page.on('request', (request) => {
      const headers = request.headers();
      const authHeader = headers['authorization'] || headers['Authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        networkToken = authHeader.replace('Bearer ', '');
        console.log(`🔑 Found token in request to: ${request.url()}`);
      }
      request.continue();
    });

    // Navigate to login page or main page
    console.log(' Navigate to page...');
    await page.goto(TWENTY_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Check if already logged in
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Try to find and fill login form
    console.log('⏳ Looking for login form...');
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try multiple selectors for email input
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]',
      'input[id*="email" i]',
      'input[class*="email" i]',
      'input',
    ];

    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        emailInput = await page.$(selector);
        if (emailInput) {
          console.log(`✅ Found email input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (emailInput) {
      // Fill in email
      console.log('✍️  Filling in email...');
      await emailInput.type(TEST_EMAIL, { delay: 100 });

      // Find password input
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[placeholder*="password" i]',
        'input[placeholder*="Password" i]',
      ];

      let passwordInput = null;
      for (const selector of passwordSelectors) {
        try {
          passwordInput = await page.$(selector);
          if (passwordInput) {
            console.log(`✅ Found password input with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (passwordInput) {
        // Fill in password
        console.log('✍️  Filling in password...');
        await passwordInput.type(TEST_PASSWORD, { delay: 100 });

        // Find and click login button
        console.log('🔘 Looking for login button...');
        const buttonSelectors = [
          'button[type="submit"]',
          'button:contains("Login")',
          'button:contains("Sign in")',
          'button:contains("登录")',
          'input[type="submit"]',
        ];

        let loginButton = null;
        for (const selector of buttonSelectors) {
          try {
            loginButton = await page.$(selector);
            if (loginButton) {
              console.log(`✅ Found login button with selector: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue
          }
        }

        if (loginButton) {
          await loginButton.click();
        } else {
          // Try pressing Enter
          console.log('🔘 Pressing Enter...');
          await page.keyboard.press('Enter');
        }

        // Wait for navigation or dashboard
        console.log('⏳ Waiting for login to complete...');
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
        } catch (e) {
          // Navigation might not happen, just wait
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } else {
        console.log('⚠️  Password input not found, might already be logged in');
      }
    } else {
      console.log('⚠️  Email input not found, might already be logged in or on different page');
    }

    // Wait a bit for token to be set
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try to get token from various sources
    console.log('🔍 Extracting token...');

    // Method 1: Get from Local Storage
    const localStorageToken = await page.evaluate(() => {
      const keys = ['token', 'accessToken', 'authToken', 'auth.accessToken', 'twenty-token'];
      for (const key of keys) {
        const value = localStorage.getItem(key);
        if (value) return { source: 'localStorage', key, value };
      }
      return null;
    });

    // Method 2: Get from Cookies
    const cookies = await page.cookies();
    const cookieToken = cookies.find(c => 
      c.name.includes('token') || 
      c.name.includes('session') || 
      c.name.includes('auth')
    );

    // Method 3: Get from Session Storage
    const sessionStorageToken = await page.evaluate(() => {
      const keys = ['token', 'accessToken', 'authToken'];
      for (const key of keys) {
        const value = sessionStorage.getItem(key);
        if (value) return { source: 'sessionStorage', key, value };
      }
      return null;
    });

    // networkToken is already captured from request interception above

    // Navigate to a page that will trigger GraphQL requests
    console.log('🔄 Navigating to trigger API requests...');
    try {
      await page.goto(`${TWENTY_URL}`, { waitUntil: 'networkidle2', timeout: 10000 });
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (e) {
      // Continue
    }

    // Also try to trigger a GraphQL request manually
    try {
      console.log('🔄 Triggering GraphQL request...');
      await page.evaluate((url) => {
        return fetch(`${url}/graphql`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: '{ currentUser { id email } }' }),
        }).catch(() => {});
      }, TWENTY_URL);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e) {
      console.log('⚠️  Could not trigger GraphQL request:', e);
    }

    // Print results
    console.log('\n=== Token Search Results ===');
    
    if (localStorageToken) {
      console.log(`✅ Found in Local Storage:`);
      console.log(`   Key: ${localStorageToken.key}`);
      console.log(`   Value: ${localStorageToken.value.substring(0, 50)}...`);
      console.log(`\nexport TWENTY_TEST_TOKEN="${localStorageToken.value}"`);
      return localStorageToken.value;
    }

    if (cookieToken) {
      console.log(`✅ Found in Cookies:`);
      console.log(`   Name: ${cookieToken.name}`);
      console.log(`   Value: ${cookieToken.value.substring(0, 50)}...`);
      console.log(`\nexport TWENTY_TEST_TOKEN="${cookieToken.value}"`);
      return cookieToken.value;
    }

    if (sessionStorageToken) {
      console.log(`✅ Found in Session Storage:`);
      console.log(`   Key: ${sessionStorageToken.key}`);
      console.log(`   Value: ${sessionStorageToken.value.substring(0, 50)}...`);
      console.log(`\nexport TWENTY_TEST_TOKEN="${sessionStorageToken.value}"`);
      return sessionStorageToken.value;
    }

    if (networkToken) {
      console.log(`✅ Found in Network Request:`);
      console.log(`   Value: ${networkToken.substring(0, 50)}...`);
      console.log(`\nexport TWENTY_TEST_TOKEN="${networkToken}"`);
      return networkToken;
    }

    console.log('❌ Token not found in any location');
    console.log('\nAvailable Local Storage keys:');
    const allLocalStorage = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) items[key] = localStorage.getItem(key) || '';
      }
      return items;
    });
    console.log(JSON.stringify(allLocalStorage, null, 2));

    console.log('\nAvailable Cookies:');
    console.log(JSON.stringify(cookies.map(c => ({ name: c.name, value: c.value.substring(0, 30) + '...' })), null, 2));

    return null;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return null;
  } finally {
    await browser.close();
  }
}

autoLoginAndGetToken()
  .then((token) => {
    if (token) {
      console.log('\n✅ Token extraction successful!');
      process.exit(0);
    } else {
      console.log('\n❌ Token extraction failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

