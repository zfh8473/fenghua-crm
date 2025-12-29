/**
 * Twenty CRM API Client Service
 * 
 * This service provides a client for interacting with Twenty CRM via GraphQL API.
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';

@Injectable()
export class TwentyClientService {
  private readonly logger = new Logger(TwentyClientService.name);
  private client: GraphQLClient;

  constructor() {
    const apiUrl = process.env.TWENTY_API_URL || 'http://localhost:3000/graphql';
    const apiToken = process.env.TWENTY_API_TOKEN;

    this.client = new GraphQLClient(apiUrl, {
      headers: apiToken
        ? {
            authorization: `Bearer ${apiToken}`,
          }
        : {},
    });

    this.logger.log(`Initialized Twenty API client: ${apiUrl}`);
  }

  /**
   * Get companies (customers) from Twenty CRM
   */
  async getCompanies() {
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
      const data = await this.client.request<{ companies: any[] }>(query);
      return data.companies;
    } catch (error) {
      this.logger.error('Error fetching companies from Twenty CRM', error);
      throw error;
    }
  }

  /**
   * Get a company by ID
   */
  async getCompanyById(id: string) {
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
      const data = await this.client.request<{ company: any }>(query, { id });
      return data.company;
    } catch (error) {
      this.logger.error(`Error fetching company ${id} from Twenty CRM`, error);
      throw error;
    }
  }

  /**
   * Create a company (customer) in Twenty CRM
   */
  async createCompany(data: {
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
      const result = await this.client.request<{ createCompany: any }>(mutation, { data });
      return result.createCompany;
    } catch (error) {
      this.logger.error('Error creating company in Twenty CRM', error);
      throw error;
    }
  }

  /**
   * Update a company in Twenty CRM
   */
  async updateCompany(id: string, data: Partial<{
    name: string;
    domainName: string;
    address: string;
    employees: number;
  }>) {
    const mutation = `
      mutation UpdateCompany($id: ID!, $data: CompanyUpdateInput!) {
        updateCompany(id: $id, data: $data) {
          id
          name
          domainName
          address
          employees
          updatedAt
        }
      }
    `;

    try {
      const result = await this.client.request<{ updateCompany: any }>(mutation, { id, data });
      return result.updateCompany;
    } catch (error) {
      this.logger.error(`Error updating company ${id} in Twenty CRM`, error);
      throw error;
    }
  }

  /**
   * Get contacts from Twenty CRM
   */
  async getContacts(companyId?: string) {
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
      const data = await this.client.request<{ contacts: any[] }>(
        query,
        companyId ? { companyId } : {},
      );
      return data.contacts;
    } catch (error) {
      this.logger.error('Error fetching contacts from Twenty CRM', error);
      throw error;
    }
  }

  /**
   * Execute a custom GraphQL query
   */
  async executeQuery<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    try {
      return await this.client.request<T>(query, variables);
    } catch (error) {
      this.logger.error('Error executing GraphQL query', error);
      throw error;
    }
  }

  /**
   * Execute a GraphQL query with authentication token
   */
  async executeQueryWithToken<T = any>(
    query: string,
    token: string,
    variables?: Record<string, any>,
  ): Promise<T> {
    try {
      const authenticatedClient = new GraphQLClient(
        process.env.TWENTY_API_URL || 'http://localhost:3000/graphql',
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      );
      return await authenticatedClient.request<T>(query, variables);
    } catch (error) {
      this.logger.error('Error executing authenticated GraphQL query', error);
      throw error;
    }
  }
}

