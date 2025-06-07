    // src/app/app.component.ts
    import { Component, OnInit, OnDestroy } from '@angular/core';
    import { FirebaseService } from './firebase.service';
    import { Observable, Subscription } from 'rxjs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

    @Component({
      selector: 'app-root',
      templateUrl: './app.component.html',
      imports:[RouterOutlet,CommonModule,FormsModule,RouterLink,RouterLinkActive],
      styleUrls: ['./app.component.css'],
    })
    export class AppComponent implements OnInit, OnDestroy {
      title = 'Billing Software';
      userId$: Observable<string | null>;
      error$: Observable<string | null>;

      private userIdSubscription: Subscription | null = null; // Example subscription, actual not strictly needed if only async pipe used

      constructor(private firebaseService: FirebaseService) {
        // Expose observables from the service to the template
        this.userId$ = this.firebaseService.userId$;
        this.error$ = this.firebaseService.error$;
      }

      ngOnInit() {
        // Service initialization handled in its constructor.
        // We can subscribe to userId$ here if we need to perform actions based on auth state.
        this.userIdSubscription = this.userId$.subscribe(userId => {
          if (userId) {
            console.log('Firebase User ID:', userId);
          } else {
            console.log('Firebase user not authenticated yet or signed out.');
          }
        });
      }

      ngOnDestroy() {
        if (this.userIdSubscription) {
          this.userIdSubscription.unsubscribe();
        }
      }
    }
    