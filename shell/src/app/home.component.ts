import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="home-container">
      <div class="hero">
        <h1 class="hero-title">Welcome to ONE Record</h1>
        <p class="hero-subtitle">
          Modern Angular application for IATA ONE Record API v2.1.0+
        </p>
        <div class="hero-actions">
          <button mat-raised-button color="primary" routerLink="/logisticsObjects">
            <mat-icon>inventory_2</mat-icon>
            Get Started
          </button>
          <button mat-raised-button routerLink="/admin">
            <mat-icon>settings</mat-icon>
            Configuration
          </button>
        </div>
      </div>

      <div class="features-grid">
        <mat-card class="feature-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="feature-icon">inventory_2</mat-icon>
            <mat-card-title>Logistics Objects</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Manage and version LogisticsObjects with full support for GET, POST, and PATCH operations.</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="feature-icon">notifications_active</mat-icon>
            <mat-card-title>Pub/Sub</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Real-time event-based subscriptions and notifications for LogisticsObjects.</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="feature-icon">link</mat-icon>
            <mat-card-title>JSON-LD</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Full Linked Data support with URI dereferencing and content negotiation.</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="feature-icon">security</mat-icon>
            <mat-card-title>Access Control</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>OAuth 2.0 / OpenID Connect with role-based access control (RBAC).</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .hero {
      text-align: center;
      padding: 4rem 2rem;
      margin-bottom: 4rem;
    }

    .hero-title {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      color: #6b7280;
      margin-bottom: 2rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      padding: 0 2rem 4rem;
    }

    .feature-card {
      transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        transform: translateY(-4px);
      }
    }

    .feature-icon {
      width: 48px !important;
      height: 48px !important;
      font-size: 32px !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    @media (max-width: 640px) {
      .hero-title {
        font-size: 2rem;
      }

      .hero-actions {
        flex-direction: column;
      }

      .features-grid {
        padding: 0 1rem 2rem;
      }
    }
  `]
})
export class HomeComponent { }
