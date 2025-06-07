// src/app/models/receipt.model.ts

export interface Receipt {
    id: string; // Firebase Document ID
    name: string;
    aadharNumber: string;
    mobileNumber: string;
    address: string;
    state:string;
    phoneNumber: string; // Keeping this separate as requested
    paymentType: string; // e.g., 'Cash', 'Card', 'UPI'
    roomNo: string;
    checkInTime: string; // Store as ISO string for easier date parsing and display
    checkOutDate: string; // Store as ISO string
    rent: number;
    advance:number;
    refund:number;
    createdAt: Date; // Timestamp when the receipt was created in Firestore
  }
  