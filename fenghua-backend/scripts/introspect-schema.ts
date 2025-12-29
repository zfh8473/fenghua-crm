/**
 * GraphQL Schema Introspection Script
 * Run from fenghua-backend directory: npx ts-node scripts/introspect-schema.ts
 */

import { GraphQLClient } from 'graphql-request';

const TWENTY_API_URL = process.env.TWENTY_API_URL || 'http://localhost:3000/graphql';
const TEST_TOKEN = process.env.TWENTY_TEST_TOKEN || '';

if (!TEST_TOKEN) {
  console.error('Please set TWENTY_TEST_TOKEN');
  process.exit(1);
}

const client = new GraphQLClient(TWENTY_API_URL, {
  headers: {
    authorization: `Bearer ${TEST_TOKEN}`,
  },
});

async function introspectAuthTokenPair() {
  console.log('Introspecting AuthTokenPair type...\n');

  const query = `
    query IntrospectAuthTokenPair {
      __type(name: "AuthTokenPair") {
        name
        fields {
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
      }
    }
  `;

  try {
    const result = await client.request(query);
    console.log('AuthTokenPair fields:', JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
  }
}

async function introspectGetAuthTokensFromLoginToken() {
  console.log('\nIntrospecting getAuthTokensFromLoginToken mutation...\n');

  const query = `
    query IntrospectMutation {
      __schema {
        mutationType {
          fields {
            name
            args {
              name
              type {
                name
                kind
              }
            }
            type {
              name
              kind
              ofType {
                name
                kind
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = await client.request(query);
    const mutation = (result as any).__schema.mutationType.fields.find(
      (f: any) => f.name === 'getAuthTokensFromLoginToken',
    );
    if (mutation) {
      console.log('getAuthTokensFromLoginToken:', JSON.stringify(mutation, null, 2));
    } else {
      console.log('Mutation not found');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

async function run() {
  await introspectAuthTokenPair();
  await introspectGetAuthTokensFromLoginToken();
}

run().catch(console.error);

