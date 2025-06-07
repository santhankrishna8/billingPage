// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { ReceiptFormComponent } from './components/receipt-form/receipt-form.component'; // Corrected path
import { FinalReceiptComponent } from './components/final-receipt/final-receipt.component';// Corrected path (assuming FinalBillComponent)
import { ReceiptListComponent } from './components/receipt-list/receipt-list.component'; // Corrected path

export const routes: Routes = [
  { path: 'advance', component: ReceiptFormComponent },
  { path: 'final', component: FinalReceiptComponent }, // Use FinalBillComponent
  { path: 'list', component: ReceiptListComponent },
  { path: '', redirectTo: '/list', pathMatch: 'full' }, // <-- IMPORTANT: Default route
  { path: '**', redirectTo: '/list' } // Wildcard route for unmatched paths
];
