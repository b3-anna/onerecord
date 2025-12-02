import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { OneRecordService, LogisticsObject, MockDataService } from '@iata-one-record/data-access';

@Component({
  selector: 'app-logistics-object-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule
  ],
  template: `
    <div class="container">
      @if (loading()) {
        <div class="loading">
          <mat-spinner></mat-spinner>
          <p>Loading object details...</p>
        </div>
      } @else if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon color="warn">error</mat-icon>
            <p>{{ error() }}</p>
            <button mat-button (click)="loadObject()">Retry</button>
            <button mat-button routerLink="/logisticsObjects">Back to List</button>
          </mat-card-content>
        </mat-card>
      } @else if (object()) {
        <div class="header">
          <button mat-icon-button routerLink="/logisticsObjects">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="title-section">
            <h1>{{ object()!['@type'] || 'Logistics Object' }}</h1>
            <mat-chip-set>
              <mat-chip>
                <mat-icon>label</mat-icon>
                {{ object()!['@type'] }}
              </mat-chip>
            </mat-chip-set>
          </div>
          <div class="actions">
            <button mat-raised-button color="primary" [routerLink]="['/logisticsObjects', id(), 'edit']">
              <mat-icon>edit</mat-icon>
              Edit
            </button>
            <button mat-button [matMenuTriggerFor]="menu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="viewVersions()">
                <mat-icon>history</mat-icon>
                View History
              </button>
              <button mat-menu-item>
                <mat-icon>delete</mat-icon>
                Delete
              </button>
            </mat-menu>
          </div>
        </div>

        <mat-tab-group>
          <mat-tab label="Details">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Object Information</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="label">ID:</span>
                      <span class="value">{{ object()!['@id'] }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">Type:</span>
                      <span class="value">{{ object()!['@type'] }}</span>
                    </div>
                    @if (object()!['description']) {
                      <div class="info-item full-width">
                        <span class="label">Description:</span>
                        <span class="value">{{ object()!['description'] }}</span>
                      </div>
                    }
                    @if (object()!['lastModified']) {
                      <div class="info-item">
                        <span class="label">Last Modified:</span>
                        <span class="value">{{ object()!['lastModified'] | date:'full' }}</span>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <mat-tab label="JSON-LD">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>JSON-LD Representation</mat-card-title>
                  <button mat-icon-button (click)="copyJson()">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                </mat-card-header>
                <mat-card-content>
                  <pre class="json-viewer">{{ object() | json }}</pre>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <mat-tab label="Versions">
            <div class="tab-content">
              <mat-card>
                <mat-card-content>
                  <p class="placeholder">Version history will be displayed here.</p>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
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

    .header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;

      .title-section {
        flex: 1;

        h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 700;
        }
      }

      .actions {
        display: flex;
        gap: 0.5rem;
      }
    }

    .tab-content {
      padding: 1.5rem 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      &.full-width {
        grid-column: 1 / -1;
      }

      .label {
        font-size: 0.875rem;
        font-weight: 600;
        color: rgba(0,0,0,0.6);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .value {
        font-size: 1rem;
        word-break: break-all;
      }
    }

    .json-viewer {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .placeholder {
      text-align: center;
      color: rgba(0,0,0,0.6);
      padding: 2rem;
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .header {
        flex-wrap: wrap;

        .actions {
          width: 100%;
          justify-content: stretch;

          button {
            flex: 1;
          }
        }
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LogisticsObjectDetailComponent implements OnInit {
  object = signal<LogisticsObject | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  id = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private oneRecordService: OneRecordService,
    private mockDataService: MockDataService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.id.set(params['id']);
      this.loadObject();
    });
  }

  loadObject() {
    this.loading.set(true);
    this.error.set(null);

    this.mockDataService.getLogisticsObjectById(this.id()).subscribe({
      next: (obj) => {
        if (obj) {
          this.object.set(obj);
        } else {
          this.error.set('Logistics object not found');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load logistics object');
        this.loading.set(false);
      }
    });
  }

  viewVersions() {
    // Implement version history view
    console.log('View versions for', this.id());
  }

  copyJson() {
    if (this.object()) {
      navigator.clipboard.writeText(JSON.stringify(this.object(), null, 2));
    }
  }
}
