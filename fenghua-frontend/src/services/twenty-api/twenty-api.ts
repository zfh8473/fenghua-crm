/**
 * Twenty CRM API Client
 * 
 * This module provides a client for interacting with Twenty CRM via GraphQL API.
 * All custom code is proprietary and not open source.
 */

import { GraphQLClient } from 'graphql-request';

const API_URL = (import.meta.env?.VITE_TWENTY_API_URL as string) || 'http://localhost:3000/graphql';
const API_TOKEN = (import.meta.env?.VITE_TWENTY_API_TOKEN as string) || undefined;

export const twentyClient = new GraphQLClient(API_URL, {
  headers: API_TOKEN
    ? {
        authorization: `Bearer ${API_TOKEN}`,
      }
    : {},
});

// Twenty CRM API Types
export interface TwentyCompany {
  id: string;
  name: string;
  domainName?: string;
  address?: string;
  employees?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TwentyContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Get companies (customers) from Twenty CRM
 */
export async function fetchCompanies() {
  const query = `
    query {
      companies {
        id
        name
        domainName
        address
        employees
        createdAt
        updatedAt
      }
    }
  `;

  try {
    const data = await twentyClient.request<{ companies: TwentyCompany[] }>(query);
    return data.companies;
  } catch (error) {
    console.error('Error fetching companies from Twenty CRM', error);
    throw error;
  }
}

/**
 * Get a company by ID
 */
export async function fetchCompanyById(id: string) {
  const query = `
    query GetCompany($id: ID!) {
      company(id: $id) {
        id
        name
        domainName
        address
        employees
        createdAt
        updatedAt
      }
    }
  `;

  try {
    const data = await twentyClient.request<{ company: TwentyCompany }>(query, { id });
    return data.company;
  } catch (error) {
    console.error(`Error fetching company ${id} from Twenty CRM`, error);
    throw error;
  }
}

/**
 * Create a company in Twenty CRM
 */
export async function createCompany(data: {
  name: string;
  domainName?: string;
  address?: string;
  employees?: number;
}) {
  const mutation = `
    mutation CreateCompany($data: CompanyCreateInput!) {
      createCompany(data: $data) {
        id
        name
        domainName
        address
        employees
        createdAt
      }
    }
  `;

  try {
    const result = await twentyClient.request<{ createCompany: TwentyCompany }>(mutation, { data });
    return result.createCompany;
  } catch (error) {
    console.error('Error creating company in Twenty CRM', error);
    throw error;
  }
}

/**
 * Get contacts from Twenty CRM
 */
export async function fetchContacts(companyId?: string) {
  const query = companyId
    ? `
      query GetContacts($companyId: ID!) {
        contacts(filter: { companyId: { eq: $companyId } }) {
          id
          firstName
          lastName
          email
          phone
          company {
            id
            name
          }
          createdAt
          updatedAt
        }
      }
    `
    : `
      query {
        contacts {
          id
          firstName
          lastName
          email
          phone
          company {
            id
            name
          }
          createdAt
          updatedAt
        }
      }
    `;

  try {
    const variables = companyId ? { companyId } : {};
    const data = await twentyClient.request<{ contacts: TwentyContact[] }>(
      query,
      variables,
    );
    return data.contacts;
  } catch (error) {
    console.error('Error fetching contacts from Twenty CRM', error);
    throw error;
  }
}

/**
 * Execute a custom GraphQL query
 */
export async function executeQuery<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  try {
    return await twentyClient.request<T>(query, variables);
  } catch (error) {
    console.error('Error executing GraphQL query', error);
    throw error;
  }
}

