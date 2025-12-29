/**
 * Helper script to get JWT token from Twenty CRM login
 * Run from fenghua-backend directory: npx ts-node scripts/get-token.ts
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
    // Based on auth.service.ts, try the format without origin first, then with origin
    let accessToken: string | null = null;

    // Try format from auth.service.ts (without origin)
    try {
      const authTokenMutation1 = `
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

      const authResult1 = await client.request<{
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
      }>(authTokenMutation1, {
        loginToken: loginToken,
      });

      if (authResult1.getAuthTokensFromLoginToken?.tokens?.accessToken?.token) {
        accessToken = authResult1.getAuthTokensFromLoginToken.tokens.accessToken.token;
        console.log('✅ Got access token (format 1)');
      }
    } catch (error1: any) {
      console.log('Format 1 failed, trying with origin parameter...');
      
      // Try with origin parameter - AuthTokenPair returns AuthTokens type
      try {
        // Based on error, AuthTokenPair contains AuthTokens, try querying AuthTokens fields
        const authTokenMutation2 = `
          mutation GetAuthTokensFromLoginToken($loginToken: String!, $origin: String!) {
            getAuthTokensFromLoginToken(loginToken: $loginToken, origin: $origin) {
              accessToken {
                token
                expiresAt
              }
            }
          }
        `;

        const authResult2 = await client.request<{
          getAuthTokensFromLoginToken?: {
            accessToken?: {
              token: string;
              expiresAt: string;
            };
          };
        }>(authTokenMutation2, {
          loginToken: loginToken,
          origin: 'http://localhost:3000',
        });

        if (authResult2.getAuthTokensFromLoginToken?.accessToken?.token) {
          accessToken = authResult2.getAuthTokensFromLoginToken.accessToken.token;
          console.log('✅ Got access token (format 2 - direct accessToken)');
        }
      } catch (error2: any) {
        console.error('❌ Both formats failed');
        console.error('Error 1:', error1.message);
        console.error('Error 2:', error2.message);
        if (error2.response) {
          console.error('Response:', JSON.stringify(error2.response, null, 2));
        }
        console.log('\n⚠️  Note: Unable to get access token via API.');
        console.log('   You may need to:');
        console.log('   1. Get token from browser after logging in to Twenty CRM');
        console.log('   2. Or check the actual GraphQL schema for the correct format');
        return null;
      }
    }

    if (!accessToken) {
      console.error('❌ Failed to get access token');
      return null;
    }

    if (!accessToken) {
      console.error('❌ Failed to get access token');
      return null;
    }
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

