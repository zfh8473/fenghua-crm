/**
 * Helper script to get JWT token from Twenty CRM login
 * 
 * This script helps get a token by logging in through the API
 * 
 * Run from fenghua-backend directory:
 *   cd fenghua-backend
 *   TWENTY_TEST_EMAIL=your@email.com TWENTY_TEST_PASSWORD=yourpassword npx ts-node ../scripts/get-token-from-login.ts
 */

import { GraphQLClient } from 'graphql-request';

const TWENTY_API_URL = process.env.TWENTY_API_URL || 'http://localhost:3000/graphql';
const TEST_EMAIL = process.env.TWENTY_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TWENTY_TEST_PASSWORD || '';

if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error('Please set TWENTY_TEST_EMAIL and TWENTY_TEST_PASSWORD environment variables');
  process.exit(1);
}

async function getToken() {
  console.log('Attempting to get token from Twenty CRM...');
  console.log(`API URL: ${TWENTY_API_URL}`);
  console.log(`Email: ${TEST_EMAIL}`);

  const client = new GraphQLClient(TWENTY_API_URL);

  try {
    // Step 1: Get login token
    const loginMutation = `
      mutation GetLoginTokenFromCredentials($email: String!, $password: String!, $origin: String!) {
        getLoginTokenFromCredentials(
          email: $email
          password: $password
          origin: $origin
        ) {
          loginToken {
            token
            expiresAt
          }
        }
      }
    `;

    const loginResult = await client.request<{
      getLoginTokenFromCredentials?: {
        loginToken?: {
          token: string;
          expiresAt: string;
        };
      };
    }>(loginMutation, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      origin: 'http://localhost:3000',
    });

    if (!loginResult.getLoginTokenFromCredentials?.loginToken?.token) {
      console.error('❌ Failed to get login token');
      return null;
    }

    const loginToken = loginResult.getLoginTokenFromCredentials.loginToken.token;
    console.log('✅ Got login token');

    // Step 2: Exchange login token for access token
    const authTokenMutation = `
      mutation GetAuthTokensFromLoginToken($loginToken: String!) {
        getAuthTokensFromLoginToken(loginToken: $loginToken) {
          tokens {
            accessToken {
              token
              expiresAt
            }
            refreshToken {
              token
              expiresAt
            }
          }
        }
      }
    `;

    const authResult = await client.request<{
      getAuthTokensFromLoginToken?: {
        tokens?: {
          accessToken?: {
            token: string;
            expiresAt: string;
          };
          refreshToken?: {
            token: string;
            expiresAt: string;
          };
        };
      };
    }>(authTokenMutation, {
      loginToken: loginToken,
    });

    if (!authResult.getAuthTokensFromLoginToken?.tokens?.accessToken?.token) {
      console.error('❌ Failed to get access token');
      return null;
    }

    const accessToken = authResult.getAuthTokensFromLoginToken.tokens.accessToken.token;
    console.log('✅ Got access token');
    console.log('\n=== Access Token ===');
    console.log(accessToken);
    console.log('\n=== Use this token for testing ===');
    console.log(`export TWENTY_TEST_TOKEN="${accessToken}"`);

    return accessToken;
  } catch (error: any) {
    console.error('❌ Error getting token:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
    return null;
  }
}

getToken().catch(console.error);

