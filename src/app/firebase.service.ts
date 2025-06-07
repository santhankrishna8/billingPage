// src/app/firebase.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { Auth, authState, User } from '@angular/fire/auth'; // Auth is the type for the injected service
import { Firestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, CollectionReference } from '@angular/fire/firestore';
import { Observable, BehaviorSubject, Subscription, switchMap } from 'rxjs'; // switchMap is needed for RxJS operations

// CORRECTED IMPORT PATHS
import { Receipt } from './models/receipt'; // <-- Assumes models/receipt.model.ts
import { environment } from './environment'; // <-- Assumes environments/environment.ts is outside 'app' folder

// NEW IMPORT: Import signInAnonymously function directly from the core Firebase SDK
import { signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService implements OnDestroy {
  // Observables for various states
  private userIdSubject = new BehaviorSubject<string | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables for components to subscribe to
  public userId$ = this.userIdSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  private authStateSub: Subscription; // Manages the Firebase Auth state subscription

  // Inject AngularFire's Auth and Firestore services
  constructor(private auth: Auth, private firestore: Firestore) {
    // Subscribe to Firebase Authentication state changes using AngularFire's authState observable.
    // This allows the service to react when a user signs in or out.
    this.authStateSub = authState(this.auth).subscribe({
      next: (user: User | null) => {
        if (user) {
          // If a user is logged in, set their UID and update loading/error states.
          this.userIdSubject.next(user.uid);
          this.loadingSubject.next(false);
          this.errorSubject.next(null); // Clear any previous authentication errors
        } else {
          // If no user is logged in, clear the UID and attempt anonymous sign-in.
          this.userIdSubject.next(null);
          this.signInAnonymously(); // Initiates an anonymous sign-in
        }
      },
      error: (authError: any) => {
        // Handle authentication errors
        console.error('Firebase Auth Error:', authError);
        this.errorSubject.next(`Authentication failed: ${authError.message}`);
        this.loadingSubject.next(false);
      }
    });
  }

  // Lifecycle hook: Called before the service is destroyed
  ngOnDestroy(): void {
    // Ensure the authentication state subscription is cleaned up to prevent memory leaks.
    if (this.authStateSub) {
      this.authStateSub.unsubscribe();
    }
  }

  // Attempts to sign in the user anonymously
  private async signInAnonymously(): Promise<void> {
    this.loadingSubject.next(true); // Set loading state during sign-in attempt
    try {
      // Call the imported firebaseSignInAnonymously function, passing the injected auth instance
      await firebaseSignInAnonymously(this.auth);
      // The authState observable will automatically update when sign-in is successful.
    } catch (authError: any) {
      console.error('Anonymous sign-in failed:', authError);
      this.errorSubject.next(`Anonymous sign-in failed: ${authError.message}`);
      this.loadingSubject.next(false);
    }
  }

  // Helper getter to create a reference to the 'receipts' Firestore collection.
  // This collection will store all your receipt documents.
  private get receiptsCollectionRef(): CollectionReference<Receipt> | null {
    // AngularFire injects the Firestore instance, so it should always be available.
    // The main type for the collection is still Receipt, as that's what we expect when reading.
    return collection(this.firestore, `receipts`) as CollectionReference<Receipt>;
  }

  /**
   * Retrieves receipts in real-time as an Observable.
   * Components subscribe to this to get immediate updates when data changes in Firestore.
   */
  getReceipts(): Observable<Receipt[]> {
    return this.userId$.pipe(
      // switchMap waits for the userId$ observable to emit a value (meaning the user is authenticated),
      // then it switches to a new observable that listens for Firestore snapshots.
      switchMap(userId => {
        if (!userId) {
          // If no user is authenticated, emit an empty array and stop loading.
          return new Observable<Receipt[]>(observer => {
            observer.next([]);
            this.loadingSubject.next(false);
            observer.complete();
          });
        }

        const collectionRef = this.receiptsCollectionRef;
        if (!collectionRef) {
          // This case should ideally not happen if Firebase is configured correctly.
          return new Observable<Receipt[]>(observer => {
            observer.error('Firestore collection not initialized. Cannot fetch receipts.');
            this.loadingSubject.next(false);
            observer.complete();
          });
        }

        const q = query(collectionRef); // Creates a query to get all documents in the collection

        return new Observable<Receipt[]>(observer => {
          this.loadingSubject.next(true); // Indicate loading before fetching data.
          const unsubscribe = onSnapshot( // Set up a real-time listener using onSnapshot.
            q,
            (snapshot) => {
              // Map Firestore document snapshots to your Receipt interface.
              // Cast doc.data() as Omit<Receipt, 'id'> to prevent 'id' overwrite warning.
              const receiptsData: Receipt[] = snapshot.docs.map((doc) => {
                const dataWithoutId = doc.data() as Omit<Receipt, 'id'>; // Exclude 'id' from the data body type
                return {
                  id: doc.id, // Use doc.id for the document's unique ID
                  ...dataWithoutId,   // Spread the rest of the document's data
                };
              });
              observer.next(receiptsData); // Emit the fetched data.
              this.loadingSubject.next(false); // Stop loading after data is received.
              this.errorSubject.next(null); // Clear any previous errors.
            },
            (error) => {
              // Handle errors during snapshot listening.
              console.error('Firestore Snapshot Error:', error);
              this.errorSubject.next(`Failed to fetch receipts: ${error.message}`);
              this.loadingSubject.next(false);
              observer.error(error); // Propagate the error.
            }
          );
          return () => unsubscribe(); // Return a cleanup function to unsubscribe from the listener when the observable is no longer needed.
        });
      })
    );
  }

  /**
   * Adds a new receipt record to Firestore.
   * @param receipt The receipt object to add (excluding 'id' and 'createdAt').
   * @returns A Promise that resolves when the receipt is successfully added.
   * @throws An error if the user is not authenticated or the operation fails.
   */
  async addReceipt(receipt: Omit<Receipt, 'id' | 'createdAt'>): Promise<void> {
    if (!this.userIdSubject.getValue()) {
      throw new Error('User not authenticated. Cannot add receipt.');
    }

    const collectionRef = this.receiptsCollectionRef;
    if (!collectionRef) {
      throw new Error('Firestore collection not initialized. Cannot add receipt.');
    }

    try {
      // Removed the explicit cast on collectionRef in addDoc.
      // collectionRef is already CollectionReference<Receipt>, and addDoc handles WithFieldValue<Receipt> correctly.
      await addDoc(collectionRef, {
        ...receipt,
        id:'1',
        createdAt: new Date(), // Automatically add a creation timestamp.
      });
      this.errorSubject.next(null); // Clear any previous errors on success.
    } catch (addError: any) {
      console.error('Error adding receipt:', addError);
      this.errorSubject.next(`Failed to add receipt: ${addError.message}`);
      throw addError; // Re-throw the error for component-level handling.
    }
  }

  /**
   * Deletes a receipt record from Firestore.
   * @param id The document ID of the receipt to delete.
   * @returns A Promise that resolves when the receipt is successfully deleted.
   * @throws An error if the user is not authenticated or the operation fails.
   */
  async deleteReceipt(id: string): Promise<void> {
    if (!this.userIdSubject.getValue()) {
      throw new Error('User not authenticated. Cannot delete receipt.');
    }

    const collectionRef = this.receiptsCollectionRef;
    if (!collectionRef) {
      throw new Error('Firestore collection not initialized. Cannot delete receipt.');
    }

    try {
      await deleteDoc(doc(collectionRef, id)); // Delete the specific document.
      this.errorSubject.next(null); // Clear any previous errors on success.
    } catch (deleteError: any) {
      console.error('Error deleting receipt:', deleteError);
      this.errorSubject.next(`Failed to delete receipt: ${deleteError.message}`);
      throw deleteError; // Re-throw the error for component-level handling.
    }
  }
}
