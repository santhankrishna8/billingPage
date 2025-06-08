    // src/app/receipt-list/receipt-list.component.ts
    import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
    import { FirebaseService } from '../../firebase.service';
    import { Receipt } from '../../models/receipt';
    import { Observable, Subscription } from 'rxjs';
    import jsPDF from 'jspdf'; // Import jsPDF library
    import html2canvas from 'html2canvas'; // Import html2canvas library
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

    @Component({
      selector: 'app-receipt-list',
      templateUrl: './receipt-list.component.html',
      imports:[CommonModule,FormsModule],
      styleUrls: ['./receipt-list.component.css'],
    })
    export class ReceiptListComponent implements OnInit, OnDestroy {
      receipts$: Observable<Receipt[]>;
      loading$: Observable<boolean>;
      error$: Observable<string | null>;

      notificationMessage: string | null = null;
  showNotification: boolean = false;
  notificationType: 'success' | 'error' | null = null;

      selectedReceipt: Receipt | null = null; // To hold the receipt being viewed/PDF generated
      isModalOpen: boolean = false; // State for controlling the Bootstrap modal

      @ViewChild('receiptPdfContent') receiptPdfContent!: ElementRef; // Reference to the div for PDF content

      

      private subscriptions: Subscription[] = []; // To manage all subscriptions

      constructor(private firebaseService: FirebaseService) {
        this.receipts$ = this.firebaseService.getReceipts();
        this.loading$ = this.firebaseService.loading$;
        this.error$ = this.firebaseService.error$;
      }

      ngOnInit(): void {
        // Subscribe to receipts and errors to ensure data and error states are current
        this.subscriptions.push(this.receipts$.subscribe());
        this.subscriptions.push(this.error$.subscribe());
      }

      ngOnDestroy(): void {
        // Unsubscribe from all subscriptions to prevent memory leaks
        this.subscriptions.forEach((sub) => sub.unsubscribe());
      }

      async deleteReceipt(id: string): Promise<void> {
        if (confirm('Are you sure you want to delete this receipt?')) { // Using confirm for simplicity
          try {
            await this.firebaseService.deleteReceipt(id);
          } catch (err: any) {
            console.error('Error deleting receipt:', err);
          }
        }
      }

      // Method to open the modal and display selected receipt details
      viewReceiptDetails(receipt: Receipt): void {
        this.selectedReceipt = receipt;
        this.isModalOpen = true; // Open the modal
      }

      // Method to close the modal
      closeModal(): void {
        this.isModalOpen = false;
        this.selectedReceipt = null; // Clear selected receipt
      }

      // Generate PDF for the currently selected receipt
      async generatePdf(): Promise<void> {
        if (!this.selectedReceipt || !this.receiptPdfContent) {
          console.error('No receipt selected or PDF content element not found.');
          this.showTemporaryNotification('Error generating PDF: Content missing.', 'error', 5000);
          return;
        }

        const data = this.receiptPdfContent.nativeElement; // Get the HTML element content

        try {
          const canvas = await html2canvas(data, { scale: 2 }); // Convert HTML to canvas, scale for better quality
          const imgData = canvas.toDataURL('image/png'); // Get image data URL
          const pdf = new jsPDF('p', 'mm', 'a4'); // Create new PDF document (portrait, mm, A4 size)

          const imgWidth = 210; // A4 width in mm
          const pageHeight = 297; // A4 height in mm
          const imgHeight = canvas.height * imgWidth / canvas.width; // Calculate image height to maintain aspect ratio
          let heightLeft = imgHeight;

          let position = 0;

          // Add image to PDF
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          // If content spans multiple pages, add new pages
          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          // Generate filename
          const filename = `Receipt_${this.selectedReceipt.name.replace(/\s/g, '_')}_${this.selectedReceipt.roomNo}.pdf`;
          pdf.save(filename); // Save the PDF
          this.showTemporaryNotification(`Receipt for ${this.selectedReceipt.name} generated successfully!`, 'success');


          this.closeModal(); // Close modal after PDF generation
        } catch (error) {
          console.error('Error generating PDF:', error);
          this.showTemporaryNotification('Failed to generate PDF. Please try again.', 'error', 5000);
          // You might want to display an error message to the user here
        }
      }

      // Helper to format date/time for display
      formatDateTime(isoString: string): string {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString(); // Uses user's locale for friendly format
      }

      

      // Helper to format date for display
      formatDate(isoString: string): string {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleDateString(); // Uses user's locale for friendly format
      }


      showTemporaryNotification(message: string, type: 'success' | 'error', duration: number = 3000): void {
        this.notificationMessage = message;
        this.notificationType = type;
        this.showNotification = true;
    
        setTimeout(() => {
          this.hideNotification();
        }, duration);
      }
    
      hideNotification(): void {
        this.showNotification = false;
        this.notificationMessage = null;
        this.notificationType = null;
      }
      // ----
    }
    