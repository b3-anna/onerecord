import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface Subscription {
    id: string;
    topic: string;
    callbackUrl: string;
    active: boolean;
    createdAt: Date;
    lastNotification?: Date;
}

@Component({
    selector: 'app-subscriptions-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatBadgeModule,
        MatProgressSpinnerModule
    ],
    template: `
    <div class="container">
      <div class="header">
        <h1>Subscriptions</h1>
        <button mat-raised-button color="primary" (click)="createSubscription()">
          <mat-icon>add</mat-icon>
          New Subscription
        </button>
      </div>

      @if (loading()) {
        <div class="loading">
          <mat-spinner></mat-spinner>
          <p>Loading subscriptions...</p>
        </div>
      } @else {
        <div class="grid">
          @for (sub of subscriptions(); track sub.id) {
            <mat-card class="subscription-card">
              <mat-card-header>
                <mat-icon mat-card-avatar [class.active]="sub.active">notifications_active</mat-icon>
                <mat-card-title>{{ sub.topic }}</mat-card-title>
                <mat-card-subtitle>{{ sub.callbackUrl }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="status-row">
                  <mat-chip [class.active]="sub.active" [class.inactive]="!sub.active">
                    {{ sub.active ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </div>
                <div class="meta">
                  <span>Created: {{ sub.createdAt | date:'short' }}</span>
                  @if (sub.lastNotification) {
                    <span>Last notification: {{ sub.lastNotification | date:'short' }}</span>
                  }
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="primary">
                  <mat-icon>visibility</mat-icon>
                  View
                </button>
                <button mat-button [color]="sub.active ? 'warn' : 'accent'" (click)="toggleSubscription(sub)">
                  <mat-icon>{{ sub.active ? 'pause' : 'play_arrow' }}</mat-icon>
                  {{ sub.active ? 'Pause' : 'Resume' }}
                </button>
                <button mat-button color="warn" (click)="deleteSubscription(sub.id)">
                  <mat-icon>delete</mat-icon>
                  Delete
                </button>
              </mat-card-actions>
            </mat-card>
          } @empty {
            <div class="empty-state">
              <mat-icon>notifications_none</mat-icon>
              <h2>No Subscriptions</h2>
              <p>Create your first subscription to receive notifications.</p>
              <button mat-raised-button color="primary" (click)="createSubscription()">
                <mat-icon>add</mat-icon>
                Create Subscription
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
    styles: [`
    .container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h1 {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
      }
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 4rem;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .subscription-card {
      mat-icon[mat-card-avatar] {
        &.active {
          color: #4caf50;
        }
      }

      mat-card-subtitle {
        font-size: 0.875rem;
        word-break: break-all;
      }

      .status-row {
        margin-bottom: 1rem;
      }

      mat-chip {
        &.active {
          background-color: #e8f5e9;
          color: #2e7d32;
        }

        &.inactive {
          background-color: #fce4ec;
          color: #c2185b;
        }
      }

      .meta {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: rgba(0,0,0,0.6);
      }
    }

    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 4rem 2rem;
      text-align: center;

      mat-icon {
        font-size: 72px;
        width: 72px;
        height: 72px;
        opacity: 0.3;
      }

      h2 {
        margin: 0;
        font-size: 1.5rem;
      }

      p {
        color: rgba(0,0,0,0.6);
      }
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SubscriptionsListComponent implements OnInit {
    subscriptions = signal<Subscription[]>([]);
    loading = signal(false);

    ngOnInit() {
        this.loadSubscriptions();
    }

    loadSubscriptions() {
        this.loading.set(true);

        // Demo data
        setTimeout(() => {
            this.subscriptions.set([
                {
                    id: '1',
                    topic: 'LogisticsObject.Shipment.Created',
                    callbackUrl: 'https://example.com/webhooks/shipment-created',
                    active: true,
                    createdAt: new Date(Date.now() - 86400000 * 5),
                    lastNotification: new Date(Date.now() - 3600000)
                },
                {
                    id: '2',
                    topic: 'LogisticsObject.*.Updated',
                    callbackUrl: 'https://example.com/webhooks/object-updated',
                    active: false,
                    createdAt: new Date(Date.now() - 86400000 * 2)
                }
            ]);
            this.loading.set(false);
        }, 500);
    }

    createSubscription() {
        console.log('Create new subscription');
        // Implement subscription creation
    }

    toggleSubscription(sub: Subscription) {
        sub.active = !sub.active;
        console.log('Toggle subscription', sub.id, 'to', sub.active);
    }

    deleteSubscription(id: string) {
        console.log('Delete subscription', id);
        this.subscriptions.update(subs => subs.filter(s => s.id !== id));
    }
}
