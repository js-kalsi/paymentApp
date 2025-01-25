import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-pagination',
  imports: [
    NgIf,
    NgForOf
  ],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent {
  @Input() totalItems: number = 0;
  @Input() itemsPerPage: number = 0;
  @Input() currentPage: number = 1;

  @Output() currentPageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get visiblePages(): number[] {
    const totalVisible = 5; // Number of pages to show around the current page
    const start = Math.max(this.currentPage - totalVisible, 1);
    const end = Math.min(this.currentPage + totalVisible, this.totalPages);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.currentPageChange.emit(this.currentPage);
  }

  shouldShowFirstPage(): boolean {
    return this.visiblePages[0] > 1;
  }

  shouldShowLastPage(): boolean {
    return this.visiblePages[this.visiblePages.length - 1] < this.totalPages;
  }

  shouldShowLeftEllipsis(): boolean {
    return this.visiblePages[0] > 2;
  }

  shouldShowRightEllipsis(): boolean {
    return this.visiblePages[this.visiblePages.length - 1] < this.totalPages - 1;
  }
}
