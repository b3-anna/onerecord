import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DocumentScanResult, DocumentScanService } from '@iata-one-record/data-access';

@Component({
  selector: 'app-document-scan-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page__header">
        <p class="eyebrow">Scan-Experiment</p>
        <h1>Dokumentenerkennung mit OpenCV.js</h1>
        <p class="lead">
          Verwende die Kamera deines Geräts, um ein Dokument automatisch zu
          erkennen, die Perspektive zu begradigen und eine scan-ähnliche Ansicht
          zu erzeugen.
        </p>
      </header>

      <section class="grid">
        <div class="card">
          <div class="card__header">
            <h2>Kamera</h2>
            <p class="hint">HTML5 getUserMedia + Canvas</p>
          </div>

          <div class="video-wrapper">
            <video #video autoplay muted playsinline></video>
            <canvas #originalPreview class="overlay"></canvas>
          </div>

          <div class="actions">
            <button type="button" (click)="startCamera()" [disabled]="isCameraActive">
              Kamera starten
            </button>
            <button type="button" (click)="stopCamera()" [disabled]="!isCameraActive">
              Kamera stoppen
            </button>
            <button
              type="button"
              class="primary"
              (click)="captureAndScan()"
              [disabled]="!isCameraActive || isScanning"
            >
              {{ isScanning ? 'Scan läuft …' : 'Scan auslösen' }}
            </button>
          </div>

          <p *ngIf="status" class="status">{{ status }}</p>
          <p *ngIf="errorMessage" class="status status--error">{{ errorMessage }}</p>
        </div>

        <div class="card result" aria-live="polite">
          <div class="card__header">
            <h2>Ergebnis</h2>
            <p class="hint">Perspektivkorrigierter Ausschnitt</p>
          </div>

          <div class="placeholder" *ngIf="!resultDataUrl">
            <p>Starte einen Scan, um das Ergebnis hier zu sehen.</p>
          </div>

          <img
            *ngIf="resultDataUrl"
            class="result__image"
            [src]="resultDataUrl"
            alt="Erkanntes Dokument nach Perspektivkorrektur"
          />

          <div *ngIf="contour" class="contour">
            <h3>Gefundene Kontur</h3>
            <pre>{{ contour | json }}</pre>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 2rem 1.5rem 3rem;
        color: #0f172a;
        background: #f8fafc;
        min-height: 100vh;
      }

      .page__header {
        max-width: 960px;
        margin: 0 auto 2rem auto;
      }

      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.75rem;
        color: #0ea5e9;
        margin: 0 0 0.25rem 0;
      }

      h1 {
        margin: 0 0 0.75rem 0;
        font-weight: 700;
        font-size: 2rem;
      }

      .lead {
        margin: 0;
        color: #475569;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 1.25rem;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
      }

      .card__header {
        margin-bottom: 0.75rem;
      }

      h2 {
        margin: 0;
        font-size: 1.25rem;
      }

      .hint {
        margin: 0.15rem 0 0 0;
        color: #64748b;
        font-size: 0.9rem;
      }

      .video-wrapper {
        position: relative;
        background: #0f172a;
        border-radius: 12px;
        overflow: hidden;
        min-height: 260px;
      }

      video,
      canvas.overlay {
        display: block;
        width: 100%;
        height: auto;
      }

      video {
        background: #0f172a;
        transform-origin: center;
      }

      canvas.overlay {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 1rem;
      }

      button {
        border: 1px solid #e2e8f0;
        background: #fff;
        color: #0f172a;
        border-radius: 10px;
        padding: 0.65rem 1rem;
        cursor: pointer;
        font-weight: 600;
        transition: box-shadow 0.2s ease, transform 0.2s ease;
      }

      button:hover:enabled {
        box-shadow: 0 6px 18px rgba(15, 23, 42, 0.1);
        transform: translateY(-1px);
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .primary {
        background: linear-gradient(120deg, #06b6d4, #6366f1);
        color: white;
        border-color: transparent;
      }

      .status {
        margin-top: 0.75rem;
        color: #0f172a;
      }

      .status--error {
        color: #dc2626;
      }

      .result__image {
        width: 100%;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
      }

      .placeholder {
        border: 1px dashed #cbd5e1;
        border-radius: 12px;
        padding: 2.5rem 1rem;
        text-align: center;
        color: #64748b;
      }

      .contour {
        margin-top: 1rem;
        background: #0f172a;
        color: #e2e8f0;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        font-family: 'SFMono-Regular', ui-monospace, SFMono-Regular, Menlo, Monaco,
          Consolas, 'Liberation Mono', 'Courier New', monospace;
        font-size: 0.85rem;
      }

      .contour h3 {
        margin: 0 0 0.5rem 0;
      }

      .result {
        min-height: 320px;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
    `,
  ],
})
export class DocumentScanPage implements OnDestroy {
  private readonly scanService = new DocumentScanService();

  @ViewChild('video') private readonly videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('originalPreview') private readonly originalPreviewRef?: ElementRef<HTMLCanvasElement>;

  isCameraActive = false;
  isScanning = false;
  status = '';
  errorMessage: string | null = null;
  resultDataUrl: string | null = null;
  contour: [number, number][] | null = null;
  private stream?: MediaStream;

  async startCamera(): Promise<void> {
    this.errorMessage = null;
    this.status = 'Kamera wird initialisiert …';

    try {
      await this.scanService.loadOpenCv();

      this.stream = await firstValueFrom(
        this.scanService.requestCameraStream({ facingMode: 'environment' })
      );

      const video = this.videoRef?.nativeElement;
      if (!video) {
        throw new Error('Videoelement nicht gefunden');
      }

      video.srcObject = this.stream;
      await video.play();

      this.isCameraActive = true;
      this.status = 'Kamera aktiv';
    } catch (error) {
      this.errorMessage = this.describeError(error);
      this.status = '';
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.scanService.stopCameraStream(this.stream);
      this.stream = undefined;
    }

    const video = this.videoRef?.nativeElement;
    if (video) {
      video.pause();
      video.srcObject = null;
    }

    this.isCameraActive = false;
    this.status = '';
  }

  async captureAndScan(): Promise<void> {
    if (!this.videoRef?.nativeElement) {
      return;
    }

    this.isScanning = true;
    this.errorMessage = null;
    this.status = 'Scan läuft …';

    try {
      const result = await this.scanService.scanFromVideo(this.videoRef.nativeElement, {
        maxOutputHeight: 1200,
        maxOutputWidth: 900,
        minContourArea: 12000,
      });

      if (!result) {
        this.status = 'Kein Dokument erkannt. Versuche es erneut.';
        this.resultDataUrl = null;
        this.contour = null;
        return;
      }

      this.contour = result.contour;
      this.resultDataUrl = result.warpedCanvas.toDataURL('image/png');
      this.drawOriginalPreview(result);
      this.status = 'Scan abgeschlossen';
    } catch (error) {
      this.errorMessage = this.describeError(error);
      this.status = '';
    } finally {
      this.isScanning = false;
    }
  }

  private drawOriginalPreview(result: DocumentScanResult): void {
    const canvas = this.originalPreviewRef?.nativeElement;
    if (!canvas) {
      return;
    }

    canvas.width = result.originalCanvas.width;
    canvas.height = result.originalCanvas.height;

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.drawImage(result.originalCanvas, 0, 0);

    if (!this.contour) {
      return;
    }

    context.strokeStyle = '#10b981';
    context.lineWidth = 3;
    context.beginPath();

    this.contour.forEach(([x, y], index) => {
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });

    context.closePath();
    context.stroke();
  }

  private describeError(error: unknown): string {
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
          return 'Kamerazugriff verweigert. Bitte Berechtigung erteilen und erneut versuchen.';
        case 'NotFoundError':
          return 'Keine Kamera gefunden. Bitte ein Kameragerät anschließen oder aktivieren.';
        case 'NotReadableError':
          return 'Die Kamera kann nicht verwendet werden. Eventuell wird sie bereits von einer anderen Anwendung genutzt.';
        case 'SecurityError':
          return 'Die Kamera kann nur über eine sichere Verbindung (HTTPS oder localhost) gestartet werden.';
        default:
          return error.message;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unbekannter Fehler beim Zugriff auf die Kamera oder OpenCV.';
  }

  ngOnDestroy(): void {
    if (this.stream) {
      this.scanService.stopCameraStream(this.stream);
    }
  }
}
