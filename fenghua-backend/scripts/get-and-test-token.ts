/**
 * Get loginToken and try to use introspection to find correct format
 */

import { GraphQLClient } from 'graphql-request';

const TWENTY_API_URL = process.env.TWENTY_API_URL || 'http://localhost:3000/graphql';
const TEST_EMAIL = process.env.TWENTY_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TWENTY_TEST_PASSWORD || '';

if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error('Please set TWENTY_TEST_EMAIL and TWENTY_TEST_PASSWORD');
  process.exit(1);
}

async function main() {
  const client = new GraphQLClient(TWENTY_API_URL);

  // Step 1: Get login token
  console.log('Step 1: Getting login token...');
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
    console.error('Failed to get login token');
    return;
  }

  const loginToken = loginResult.getLoginTokenFromCredentials.loginToken.token;
  console.log('✅ Got login token');

  // Step 2: Use introspection to find correct format
  console.log('\nStep 2: Introspecting getAuthTokensFromLoginToken...');
  
  const introspectionQuery = `
    query IntrospectMutation {
      __schema {
        mutationType {
          fields(includeDeprecated: true) {
            name
            args {
              name
              type {
                name
                kind
                ofType {
                  name
                  kind
                }
              }
            }
            type {
              name
              kind
              ofType {
                name
                kind
                fields {
                  name
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                      fields {
                        name
                        type {
                          name
                          kind
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const introspectionResult = await client.request(introspectionQuery);
    const mutation = (introspectionResult as any).__schema.mutationType.fields.find(
      (f: any) => f.name === 'getAuthTokensFromLoginToken',
    );
    
    if (mutation) {
      console.log('\n✅ Found mutation structure:');
      console.log(JSON.stringify(mutation, null, 2));
    } else {
      console.log('❌ Mutation not found in schema');
    }
  } catch (error: any) {
    console.error('Introspection failed:', error.message);
  }

  // Step 3: Try different mutation formats based on common patterns
  console.log('\nStep 3: Trying different mutation formats...');
  
  const formats = [
    {
      name: 'Format 1: Direct tokens',
      mutation: `
        mutation GetAuthTokensFromLoginToken($loginToken: String!, $origin: String!) {
          getAuthTokensFromLoginToken(loginToken: $loginToken, origin: $origin) {
            tokens {
              accessToken {
                token
                expiresAt
              }
            }
          }
        }
      `,
    },
    {
      name: 'Format 2: Direct accessToken',
      mutation: `
        mutation GetAuthTokensFromLoginToken($loginToken: String!, $origin: String!) {
          getAuthTokensFromLoginToken(loginToken: $loginToken, origin: $origin) {
            accessToken {
              token
              expiresAt
            }
          }
        }
      `,
    },
    {
      name: 'Format 3: Simple tokens',
      mutation: `
        mutation GetAuthTokensFromLoginToken($loginToken: String!, $origin: String!) {
          getAuthTokensFromLoginToken(loginToken: $loginToken, origin: $origin) {
            tokens {
              accessToken
            }
          }
        }
      `,
    },
  ];

  for (const format of formats) {
    try {
      console.log(`\n  Trying ${format.name}...`);
      const result = await client.request(format.mutation, {
        loginToken: loginToken,
        origin: 'http://localhost:3000',
      });
      console.log(`  ✅ SUCCESS with ${format.name}!`);
      console.log('  Result:', JSON.stringify(result, null, 2));
      
      // Extract token
      const accessToken = (result as any).getAuthTokensFromLoginToken?.tokens?.accessToken?.token ||
                         (result as any).getAuthTokensFromLoginToken?.accessToken?.token ||
                         (result as any).getAuthTokensFromLoginToken?.tokens?.accessToken;
      
      if (accessToken) {
        console.log('\n🎉 Found access token!');
        console.log(`\nexport TWENTY_TEST_TOKEN="${accessToken}"`);
        return accessToken;
      }
    } catch (error: any) {
      console.log(`  ❌ Failed: ${error.message.split(':')[0]}`);
    }
  }

  console.log('\n❌ All formats failed');
  console.log('\n💡 Suggestion: Check Twenty CRM source code or use browser to get token');
}

main().catch(console.error);

