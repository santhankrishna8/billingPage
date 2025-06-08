    // src/app/receipt-form/receipt-form.component.ts
    import { Component, OnInit, OnDestroy } from '@angular/core';
    import { FirebaseService } from '../../firebase.service';
    import { Receipt } from '../../models/receipt';
    import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

    @Component({
      selector: 'app-receipt-form',
      templateUrl: './receipt-form.component.html',
      imports:[CommonModule,FormsModule],
      styleUrls: ['./receipt-form.component.css'],
    })
    export class ReceiptFormComponent implements OnInit, OnDestroy {
      // Form fields, initialized to empty or default values
      name: string = '';
      aadharNumber: string = '';
      mobileNumber: string = '';
      address: string = '';
      state:string='';
      phoneNumber: string = '';
      paymentType: string = 'Cash'; // Default payment type
      roomNo: string = '';
      checkInTime: string = new Date().toISOString().slice(0, 16); // Current date/time for datetime-local
      checkOutDate: string = new Date().toISOString().slice(0, 10); // Current date for date input
      rent:number=0;
        advance:number=0;
        refund:number=0;

      // Payment type options for the dropdown
      paymentTypes: string[] = ['Cash', 'Card', 'UPI', 'Bank Transfer'];

      loading: boolean = false; // To indicate form submission in progress
      error: string | null = null; // Component-specific error message
      successMessage: string | null = null; // Success message after submission

      private errorSubscription: Subscription | null = null;

      constructor(private firebaseService: FirebaseService,private router:Router) {}

      ngOnInit(): void {
        // Subscribe to general errors from the FirebaseService
        this.errorSubscription = this.firebaseService.error$.subscribe(
          (err) => (this.error = err)
        );
      }

      ngOnDestroy(): void {
        if (this.errorSubscription) {
          this.errorSubscription.unsubscribe();
        }
      }

      async submitReceipt(): Promise<void> {
        this.loading = true;
        this.error = null;
        this.successMessage = null;

        // Simple client-side validation
        if (!this.name || !this.mobileNumber || !this.roomNo || !this.checkInTime || !this.checkOutDate ||this.rent <= 0 ) {
          this.error = 'Please fill in all required fields (Name, Mobile, Room No, Check-in/out, Price must be greater than 0).';
          this.loading = false;
          return;
        }

        const newReceipt: Omit<Receipt, 'id' | 'createdAt'> = {
          name: this.name,
          aadharNumber: this.aadharNumber,
          mobileNumber: this.mobileNumber,
          address: this.address,
          phoneNumber: this.phoneNumber,
          paymentType: this.paymentType,
          roomNo: this.roomNo,
          checkInTime: this.checkInTime,
          checkOutDate: this.checkOutDate,
          rent: this.rent,
            advance: this.advance,
            refund: this.refund,
            state:this.state
        };

        try {
          await this.firebaseService.addReceipt(newReceipt);
          this.successMessage = 'Receipt added successfully!';
          this.resetForm(); // Clear form after successful submission
          this.router.navigate(['/list']);
        } catch (err: any) {
          this.error = `Failed to add receipt: ${err.message}`;
          console.error('Error submitting receipt:', err);
        } finally {
          this.loading = false;
          // Clear success message after a few seconds
          setTimeout(() => this.successMessage = null, 3000);
        }
      }

      // Resets the form fields to initial state
      resetForm(): void {
        this.name = '';
        this.aadharNumber = '';
        this.mobileNumber = '';
        this.address = '';
        this.phoneNumber = '';
        this.paymentType = 'Cash';
        this.roomNo = '';
        this.checkInTime = new Date().toISOString().slice(0, 16);
        this.checkOutDate = new Date().toISOString().slice(0, 10);
        this.rent=0;
        this.advance=0;
        this.refund=0;
        this.state='';
      }
    }
    