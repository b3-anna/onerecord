import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OneRecordService, LogisticsObject, MockDataService } from '@iata-one-record/data-access';

@Component({
  selector: 'app-logistics-objects-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Logistics Objects</h1>
        <button mat-raised-button color="primary" routerLink="/logisticsObjects/create">
          <mat-icon>add</mat-icon>
          Create New
        </button>
      </div>

      @if (loading()) {
        <div class="loading">
          <mat-spinner></mat-spinner>
          <p>Loading logistics objects...</p>
        </div>
      } @else if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon color="warn">error</mat-icon>
            <p>{{ error() }}</p>
            <button mat-button (click)="loadObjects()">Retry</button>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="grid">
          @for (obj of objects(); track obj['@id']) {
            <mat-card class="object-card" [routerLink]="['/logisticsObjects', extractId(obj['@id'])]">
              <mat-card-header>
                <mat-icon mat-card-avatar>inventory_2</mat-icon>
                <mat-card-title>{{ obj['@type'] || 'LogisticsObject' }}</mat-card-title>
                <mat-card-subtitle>{{ obj['@id'] }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                @if (obj['description']) {
                  <p>{{ obj['description'] }}</p>
                }
                @if (obj['lastModified']) {
                  <p class="meta">Last modified: {{ obj['lastModified'] | date:'short' }}</p>
                }
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="primary">
                  <mat-icon>visibility</mat-icon>
                  View Details
                </button>
                <button mat-button>
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
              </mat-card-actions>
            </mat-card>
          } @empty {
            <div class="empty-state">
              <mat-icon>inventory_2</mat-icon>
              <h2>No Logistics Objects</h2>
              <p>Create your first logistics object to get started.</p>
              <button mat-raised-button color="primary" routerLink="/logisticsObjects/create">
                <mat-icon>add</mat-icon>
                Create First Object
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

    .error-card {
      mat-card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 2rem;
      }
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .object-card {
      cursor: pointer;
      transition: transform 200ms ease, box-shadow 200ms ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.15);
      }

      mat-card-subtitle {
        font-size: 0.875rem;
        opacity: 0.7;
        word-break: break-all;
      }

      .meta {
        font-size: 0.875rem;
        color: rgba(0,0,0,0.6);
        margin-top: 0.5rem;
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

        button {
          width: 100%;
        }
      }

      .grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LogisticsObjectsListComponent implements OnInit {
  objects = signal<LogisticsObject[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private oneRecordService: OneRecordService,
    private mockDataService: MockDataService
  ) { }

  ngOnInit() {
    this.loadObjects();
  }

  loadObjects() {
    this.loading.set(true);
    this.error.set(null);

    this.mockDataService.getAllLogisticsObjects().subscribe({
      next: (objects) => {
        this.objects.set(objects);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load logistics objects');
        this.loading.set(false);
      }
    });
  }

  extractId(uri: string): string {
    return uri.split('/').pop() || uri;
  }
}
