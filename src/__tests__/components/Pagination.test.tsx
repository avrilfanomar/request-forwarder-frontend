import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../../components/Pagination';

describe('Pagination', () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  it('should not render pagination if there is only one page', () => {
    const { container } = render(
      <Pagination 
        totalItems={10} 
        itemsPerPage={10} 
        currentPage={1} 
        onPageChange={mockOnPageChange} 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render pagination with correct number of pages', () => {
    render(
      <Pagination 
        totalItems={30} 
        itemsPerPage={10} 
        currentPage={1} 
        onPageChange={mockOnPageChange} 
      />
    );
    
    // Should have 3 page buttons (1, 2, 3)
    const pageButtons = screen.getAllByRole('button').filter(
      button => /^[0-9]+$/.test(button.textContent || '')
    );
    expect(pageButtons).toHaveLength(3);
    
    // Should have Previous and Next buttons
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('should disable Previous button on first page', () => {
    render(
      <Pagination 
        totalItems={30} 
        itemsPerPage={10} 
        currentPage={1} 
        onPageChange={mockOnPageChange} 
      />
    );
    
    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('should disable Next button on last page', () => {
    render(
      <Pagination 
        totalItems={30} 
        itemsPerPage={10} 
        currentPage={3} 
        onPageChange={mockOnPageChange} 
      />
    );
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('should call onPageChange when a page button is clicked', () => {
    render(
      <Pagination 
        totalItems={30} 
        itemsPerPage={10} 
        currentPage={1} 
        onPageChange={mockOnPageChange} 
      />
    );
    
    // Click on page 2
    const page2Button = screen.getByText('2');
    fireEvent.click(page2Button);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('should call onPageChange when Next button is clicked', () => {
    render(
      <Pagination 
        totalItems={30} 
        itemsPerPage={10} 
        currentPage={1} 
        onPageChange={mockOnPageChange} 
      />
    );
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('should call onPageChange when Previous button is clicked', () => {
    render(
      <Pagination 
        totalItems={30} 
        itemsPerPage={10} 
        currentPage={2} 
        onPageChange={mockOnPageChange} 
      />
    );
    
    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('should show ellipsis and first/last page buttons for many pages', () => {
    render(
      <Pagination 
        totalItems={100} 
        itemsPerPage={10} 
        currentPage={5} 
        onPageChange={mockOnPageChange} 
      />
    );
    
    // Should show first page button
    expect(screen.getByText('1')).toBeInTheDocument();
    
    // Should show last page button
    expect(screen.getByText('10')).toBeInTheDocument();
    
    // Should show ellipsis
    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThan(0);
  });

  it('should highlight current page', () => {
    render(
      <Pagination 
        totalItems={30} 
        itemsPerPage={10} 
        currentPage={2} 
        onPageChange={mockOnPageChange} 
      />
    );
    
    // Current page button should have aria-current="page"
    const currentPageButton = screen.getByText('2');
    expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    
    // Other page buttons should not have aria-current
    const otherPageButton = screen.getByText('1');
    expect(otherPageButton).not.toHaveAttribute('aria-current', 'page');
  });
});