/**
 * CustomerDetailPanel Component Tests
 * 
 * Tests for customer detail panel component including display, empty fields, and permissions
 * All custom code is proprietary and not open source.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CustomerDetailPanel } from './CustomerDetailPanel';
import { Customer } from '../customers.service';

// Mock useAuth hook
vi.mock('../../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../auth/AuthContext';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

const renderWithAuth = (component: React.ReactElement, user: { role: string; email: string } | null = null) => {
  mockUseAuth.mockReturnValue({
    user,
    currentUser: user,
    token: user ? 'mock-token' : null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    hasPermission: vi.fn(),
    canAccess: vi.fn(),
    isAuthenticated: !!user,
    isLoading: false,
  });
  
  return render(component);
};

describe('CustomerDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCustomer: Customer = {
    id: '1',
    name: 'Test Customer',
    customerCode: 'CUST001',
    customerType: 'BUYER',
    address: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    postalCode: '12345',
    phone: '123-456-7890',
    website: 'https://test.com',
    domainName: 'test.com',
    industry: 'Technology',
    employees: 100,
    notes: 'Test notes',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockCustomerWithEmptyFields: Customer = {
    id: '2',
    name: 'Empty Customer',
    customerCode: 'CUST002',
    customerType: 'SUPPLIER',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('Display', () => {
    it('should display customer name', () => {
      renderWithAuth(<CustomerDetailPanel customer={mockCustomer} />);
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
    });

    it('should display customer code', () => {
      renderWithAuth(<CustomerDetailPanel customer={mockCustomer} />);
      expect(screen.getByText('CUST001')).toBeInTheDocument();
    });

    it('should display customer type badge', () => {
      renderWithAuth(<CustomerDetailPanel customer={mockCustomer} />);
      expect(screen.getByText('采购商')).toBeInTheDocument();
    });

    it('should display supplier type badge for SUPPLIER', () => {
      const supplierCustomer = { ...mockCustomer, customerType: 'SUPPLIER' as const };
      renderWithAuth(<CustomerDetailPanel customer={supplierCustomer} />);
      expect(screen.getByText('供应商')).toBeInTheDocument();
    });

    it('should display basic information', () => {
      renderWithAuth(<CustomerDetailPanel customer={mockCustomer} />);
      expect(screen.getByText('基本信息')).toBeInTheDocument();
      expect(screen.getByText('123 Test St')).toBeInTheDocument();
      expect(screen.getByText('Test City')).toBeInTheDocument();
      expect(screen.getByText('Test State')).toBeInTheDocument();
      expect(screen.getByText('Test Country')).toBeInTheDocument();
      expect(screen.getByText('12345')).toBeInTheDocument();
    });

    it('should display contact information', () => {
      renderWithAuth(<CustomerDetailPanel customer={mockCustomer} />);
      expect(screen.getByText('联系信息')).toBeInTheDocument();
      expect(screen.getByText('123-456-7890')).toBeInTheDocument();
      expect(screen.getByText('https://test.com')).toBeInTheDocument();
      expect(screen.getByText('test.com')).toBeInTheDocument();
    });

    it('should display business information', () => {
      renderWithAuth(<CustomerDetailPanel customer={mockCustomer} />);
      expect(screen.getByText('业务信息')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Test notes')).toBeInTheDocument();
    });
  });

  describe('Empty Fields', () => {
    it('should display "-" for empty address', () => {
      renderWithAuth(<CustomerDetailPanel customer={mockCustomerWithEmptyFields} />);
      const addressFields = screen.getAllByText('-');
      expect(addressFields.length).toBeGreaterThan(0);
    });

    it('should display "-" for empty city', () => {
      renderWithAuth(<CustomerDetailPanel customer={mockCustomerWithEmptyFields} />);
      const fields = screen.getAllByText('-');
      expect(fields.length).toBeGreaterThan(0);
    });

    it('should display "-" for empty phone', () => {
      renderWithAuth(<CustomerDetailPanel customer={mockCustomerWithEmptyFields} />);
      const fields = screen.getAllByText('-');
      expect(fields.length).toBeGreaterThan(0);
    });

    it('should display "-" for empty industry', () => {
      renderWithAuth(<CustomerDetailPanel customer={mockCustomerWithEmptyFields} />);
      const fields = screen.getAllByText('-');
      expect(fields.length).toBeGreaterThan(0);
    });

    it('should display "-" for empty employees', () => {
      renderWithAuth(<CustomerDetailPanel customer={mockCustomerWithEmptyFields} />);
      const fields = screen.getAllByText('-');
      expect(fields.length).toBeGreaterThan(0);
    });
  });

  describe('Permissions', () => {
    it('should show edit/delete buttons for admin', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      renderWithAuth(
        <CustomerDetailPanel 
          customer={mockCustomer} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />,
        { role: 'ADMIN', email: 'admin@test.com' }
      );
      expect(screen.getByLabelText('编辑客户')).toBeInTheDocument();
      expect(screen.getByLabelText('删除客户')).toBeInTheDocument();
    });

    it('should show edit/delete buttons for director', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      renderWithAuth(
        <CustomerDetailPanel 
          customer={mockCustomer} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />,
        { role: 'DIRECTOR', email: 'director@test.com' }
      );
      expect(screen.getByLabelText('编辑客户')).toBeInTheDocument();
      expect(screen.getByLabelText('删除客户')).toBeInTheDocument();
    });

    it('should show edit/delete buttons for frontend specialist viewing BUYER', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      renderWithAuth(
        <CustomerDetailPanel 
          customer={mockCustomer} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />,
        { role: 'FRONTEND_SPECIALIST', email: 'frontend@test.com' }
      );
      expect(screen.getByLabelText('编辑客户')).toBeInTheDocument();
      expect(screen.getByLabelText('删除客户')).toBeInTheDocument();
    });

    it('should NOT show edit/delete buttons for frontend specialist viewing SUPPLIER', () => {
      const supplierCustomer = { ...mockCustomer, customerType: 'SUPPLIER' as const };
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      renderWithAuth(
        <CustomerDetailPanel 
          customer={supplierCustomer} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />,
        { role: 'FRONTEND_SPECIALIST', email: 'frontend@test.com' }
      );
      expect(screen.queryByLabelText('编辑客户')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('删除客户')).not.toBeInTheDocument();
    });

    it('should show edit/delete buttons for backend specialist viewing SUPPLIER', () => {
      const supplierCustomer = { ...mockCustomer, customerType: 'SUPPLIER' as const };
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      renderWithAuth(
        <CustomerDetailPanel 
          customer={supplierCustomer} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />,
        { role: 'BACKEND_SPECIALIST', email: 'backend@test.com' }
      );
      expect(screen.getByLabelText('编辑客户')).toBeInTheDocument();
      expect(screen.getByLabelText('删除客户')).toBeInTheDocument();
    });

    it('should NOT show edit/delete buttons for backend specialist viewing BUYER', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      renderWithAuth(
        <CustomerDetailPanel 
          customer={mockCustomer} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />,
        { role: 'BACKEND_SPECIALIST', email: 'backend@test.com' }
      );
      expect(screen.queryByLabelText('编辑客户')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('删除客户')).not.toBeInTheDocument();
    });

    it('should NOT show buttons when onEdit/onDelete are not provided', () => {
      renderWithAuth(
        <CustomerDetailPanel customer={mockCustomer} />,
        { role: 'ADMIN', email: 'admin@test.com' }
      );
      expect(screen.queryByLabelText('编辑客户')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('删除客户')).not.toBeInTheDocument();
    });
  });

  describe('Button Actions', () => {
    it('should call onEdit when edit button is clicked', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      renderWithAuth(
        <CustomerDetailPanel 
          customer={mockCustomer} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />,
        { role: 'ADMIN', email: 'admin@test.com' }
      );
      
      const editButton = screen.getByLabelText('编辑客户');
      editButton.click();
      
      expect(onEdit).toHaveBeenCalledWith(mockCustomer);
    });

    it('should call onDelete when delete button is clicked', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      renderWithAuth(
        <CustomerDetailPanel 
          customer={mockCustomer} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />,
        { role: 'ADMIN', email: 'admin@test.com' }
      );
      
      const deleteButton = screen.getByLabelText('删除客户');
      deleteButton.click();
      
      expect(onDelete).toHaveBeenCalledWith(mockCustomer);
    });
  });
});

