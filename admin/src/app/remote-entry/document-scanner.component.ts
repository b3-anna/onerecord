import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CameraService } from '../lib/camera.service';
import { OpenCVService } from '../lib/opencv.service';

interface Point {
  x: number;
  y: number;
}

interface DocumentCorner {
  point: Point;
  active: boolean;
  dragging: boolean;
}

@Component({
  selector: 'app-document-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-scanner.component.html',
  styleUrls: ['./document-scanner.component.css']
})
export class DocumentScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('captureCanvas') captureCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('editCanvas') editCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('resultCanvas') resultCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;

  // Step management
  currentStep: 'capture' | 'edit' | 'sign' = 'capture';

  // Camera state
  isCameraActive = false;
  isProcessing = false;

  // Data
  capturedImageData: string | null = null;
  processedImageData: string | null = null;
  originalImage: HTMLImageElement | null = null;

  // Editing
  documentCorners: DocumentCorner[] = [
    { point: { x: 100, y: 100 }, active: false, dragging: false },
    { point: { x: 400, y: 100 }, active: false, dragging: false },
    { point: { x: 400, y: 300 }, active: false, dragging: false },
    { point: { x: 100, y: 300 }, active: false, dragging: false }
  ];

  // Processing options
  processingMode: 'bw' | 'color' | 'enhanced' = 'enhanced';
  showGrid = true;

  // Signature
  isSigning = false;
  signatureData: string | null = null;

  // Private variables
  private isDragging = false;
  private dragCornerIndex = -1;
  private mouseStart: Point = { x: 0, y: 0 };
  private animationFrameId: number | null = null;

  constructor(
    // eslint-disable-next-line @angular-eslint/prefer-inject
    private cameraService: CameraService,
    // eslint-disable-next-line @angular-eslint/prefer-inject
    private openCVService: OpenCVService,
    // eslint-disable-next-line @angular-eslint/prefer-inject
    private cdRef: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    try {
      await this.openCVService.loadOpenCV();
      console.log('OpenCV loaded successfully');
    } catch (error) {
      console.error('Failed to load OpenCV:', error);
    }
  }

  // ==================== STEP 1: CAPTURE ====================
  async startCamera() {
    try {
      if (!this.openCVService.isReady) {
        await this.openCVService.loadOpenCV();
      }

      await this.cameraService.startCamera(this.videoElement.nativeElement);
      this.isCameraActive = true;

      // Wait for video to be ready
      await this.waitForVideoDimensions();

      // Start preview loop
      this.startPreviewLoop();

      this.cdRef.detectChanges();

    } catch (error: any) {
      console.error('Failed to start camera:', error);
      alert(`Camera error: ${error.message || 'Unknown error'}`);
    }
  }

  stopCamera() {
    this.stopPreviewLoop();
    this.cameraService.stopCamera();
    this.isCameraActive = false;

    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
  }

  captureImage() {
    if (!this.isCameraActive || !this.videoElement?.nativeElement) {
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.captureCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Save as data URL
    this.capturedImageData = canvas.toDataURL('image/png');

    // Stop camera and go to edit step
    this.stopCamera();
    this.currentStep = 'edit';

    // Load the image for editing
    this.loadImageForEditing();

    this.cdRef.detectChanges();
  }

  private startPreviewLoop() {
    const processFrame = () => {
      if (!this.isCameraActive || this.currentStep !== 'capture') {
        this.animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      const video = this.videoElement.nativeElement;
      const canvas = this.captureCanvas.nativeElement;
      const ctx = canvas.getContext('2d');

      if (!video.videoWidth || !video.videoHeight || !ctx) {
        this.animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      // Update canvas dimensions if needed
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      this.animationFrameId = requestAnimationFrame(processFrame);
    };

    this.animationFrameId = requestAnimationFrame(processFrame);
  }

  private stopPreviewLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private waitForVideoDimensions(): Promise<void> {
    return new Promise((resolve) => {
      const video = this.videoElement.nativeElement;

      if (video.videoWidth && video.videoHeight) {
        resolve();
        return;
      }

      const check = () => {
        if (video.videoWidth && video.videoHeight) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };

      check();
    });
  }

  // ==================== STEP 2: EDIT ====================
  private loadImageForEditing() {
    if (!this.capturedImageData) return;

    const img = new Image();
    img.onload = () => {
      this.originalImage = img;

      // Initialize edit canvas
      const canvas = this.editCanvas.nativeElement;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the captured image
      ctx.drawImage(img, 0, 0);

      // Initialize corners to default positions (10% margin)
      const marginX = img.width * 0.1;
      const marginY = img.height * 0.1;

      this.documentCorners = [
        { point: { x: marginX, y: marginY }, active: false, dragging: false },
        { point: { x: img.width - marginX, y: marginY }, active: false, dragging: false },
        { point: { x: img.width - marginX, y: img.height - marginY }, active: false, dragging: false },
        { point: { x: marginX, y: img.height - marginY }, active: false, dragging: false }
      ];

      // Run auto-detection
      this.autoDetectDocument();

      this.cdRef.detectChanges();
    };

    img.src = this.capturedImageData;
  }

  async autoDetectDocument() {
    if (!this.openCVService.isReady || !this.originalImage) return;

    const cv = this.openCVService.getCV();
    const canvas = this.editCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Clear and redraw original image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.originalImage, 0, 0);

    try {
      // Process with OpenCV
      const src = cv.imread(canvas);
      const result = this.detectDocumentCorners(src);

      if (result.detected && result.corners.length === 4) {
        // Update corners with detected ones
        this.documentCorners = result.corners.map((corner, index) => ({
          point: corner,
          active: false,
          dragging: false
        }));

        // Draw detected borders
        this.drawEditOverlay();
      } else {
        // Draw manual grid
        this.drawEditOverlay();
      }

      src.delete();

    } catch (error) {
      console.error('Error in auto-detection:', error);
      this.drawEditOverlay();
    }
  }

  private detectDocumentCorners(src: any): { detected: boolean; corners: Point[] } {
    const cv = this.openCVService.getCV();

    try {
      // Convert to grayscale
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // Apply Gaussian blur
      cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);

      // Edge detection
      const edges = new cv.Mat();
      cv.Canny(gray, edges, 50, 150);

      // Dilate edges
      const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
      cv.dilate(edges, edges, kernel);

      // Find contours
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let bestCorners: Point[] = [];
      let bestScore = 0;

      // Find best contour
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);

        // Filter by area
        const minArea = src.cols * src.rows * 0.05;
        const maxArea = src.cols * src.rows * 0.95;

        if (area < minArea || area > maxArea) continue;

        // Approximate polygon
        const epsilon = 0.02 * cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, epsilon, true);

        // Check if quadrilateral
        if (approx.rows === 4) {
          const score = this.evaluateContour(contour, approx);

          if (score > bestScore) {
            bestScore = score;
            bestCorners = this.extractCorners(approx);
          }
        }

        approx.delete();
      }

      // Clean up
      gray.delete();
      edges.delete();
      kernel.delete();
      contours.delete();
      hierarchy.delete();

      return {
        detected: bestScore > 0.3,
        corners: this.orderPoints(bestCorners)
      };

    } catch (error) {
      console.error('Error in corner detection:', error);
      return { detected: false, corners: [] };
    }
  }

  private evaluateContour(contour: any, approx: any): number {
    const cv = this.openCVService.getCV();

    const area = cv.contourArea(contour);

    // Convexity score
    const hull = new cv.Mat();
    cv.convexHull(contour, hull);
    const hullArea = cv.contourArea(hull);
    const convexityScore = hullArea > 0 ? area / hullArea : 0;
    hull.delete();

    // Aspect ratio score
    const corners = this.extractCorners(approx);
    const width = Math.max(
      this.distance(corners[0], corners[1]),
      this.distance(corners[2], corners[3])
    );
    const height = Math.max(
      this.distance(corners[1], corners[2]),
      this.distance(corners[3], corners[0])
    );
    const aspectRatio = width / height;
    const aspectScore = aspectRatio >= 0.7 && aspectRatio <= 1.4 ? 1 : 0.5;

    return (convexityScore * 0.7) + (aspectScore * 0.3);
  }

  private extractCorners(approx: any): Point[] {
    const points: Point[] = [];

    for (let i = 0; i < 4; i++) {
      points.push({
        x: approx.data32F[i * 2],
        y: approx.data32F[i * 2 + 1]
      });
    }

    return points;
  }

  private orderPoints(points: Point[]): Point[] {
    if (points.length !== 4) return points;

    // Sort by y-coordinate
    points.sort((a, b) => a.y - b.y);

    // Top two points
    const topPoints = points.slice(0, 2);
    const bottomPoints = points.slice(2);

    // Sort top points by x (left to right)
    topPoints.sort((a, b) => a.x - b.x);
    // Sort bottom points by x (right to left)
    bottomPoints.sort((a, b) => b.x - a.x);

    return [
      topPoints[0],    // top-left
      topPoints[1],    // top-right
      bottomPoints[0], // bottom-right
      bottomPoints[1]  // bottom-left
    ];
  }

  private distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  drawEditOverlay() {
    if (!this.editCanvas?.nativeElement || !this.originalImage) return;

    const canvas = this.editCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Clear and redraw original image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.originalImage, 0, 0);

    // Draw semi-transparent overlay
    if (this.showGrid) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clear inside document area
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.documentCorners[0].point.x, this.documentCorners[0].point.y);
      for (let i = 1; i < 4; i++) {
        ctx.lineTo(this.documentCorners[i].point.x, this.documentCorners[i].point.y);
      }
      ctx.closePath();
      ctx.clip();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // Draw document border
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.documentCorners[0].point.x, this.documentCorners[0].point.y);
    for (let i = 1; i < 4; i++) {
      ctx.lineTo(this.documentCorners[i].point.x, this.documentCorners[i].point.y);
    }
    ctx.closePath();

    // Border style
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();

    // Draw corner points
    this.drawCornerPoints(ctx);
  }

  private drawCornerPoints(ctx: CanvasRenderingContext2D) {
    this.documentCorners.forEach((corner, index) => {
      ctx.save();

      // Draw circle
      ctx.beginPath();
      ctx.arc(corner.point.x, corner.point.y, 10, 0, Math.PI * 2);

      // Color based on state
      let color = '#ff0000';
      if (corner.active) color = '#ffff00';
      if (corner.dragging) color = '#00ffff';

      ctx.fillStyle = color;
      ctx.fill();

      // Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Number
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((index + 1).toString(), corner.point.x, corner.point.y);

      ctx.restore();
    });
  }

  // Corner adjustment methods
  onCanvasMouseDown(event: MouseEvent) {
    if (this.currentStep !== 'edit') return;

    const canvas = this.editCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Find closest corner
    let closestIndex = -1;
    let minDistance = 15; // Pixel threshold

    this.documentCorners.forEach((corner, index) => {
      const distance = Math.sqrt(
        Math.pow(corner.point.x - x, 2) +
        Math.pow(corner.point.y - y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex >= 0) {
      this.isDragging = true;
      this.dragCornerIndex = closestIndex;
      this.mouseStart = { x, y };
      this.documentCorners[closestIndex].dragging = true;

      // Activate only this corner
      this.setActiveCorner(closestIndex);

      event.preventDefault();
    }
  }

  onCanvasMouseMove(event: MouseEvent) {
    if (!this.isDragging || this.dragCornerIndex < 0) return;

    const canvas = this.editCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Calculate movement
    const dx = x - this.mouseStart.x;
    const dy = y - this.mouseStart.y;

    // Update corner position
    const corner = this.documentCorners[this.dragCornerIndex];
    corner.point.x = Math.max(10, Math.min(canvas.width - 10, corner.point.x + dx));
    corner.point.y = Math.max(10, Math.min(canvas.height - 10, corner.point.y + dy));

    // Update mouse start position
    this.mouseStart = { x, y };

    // Redraw overlay
    this.drawEditOverlay();

    event.preventDefault();
  }

  onCanvasMouseUp() {
    if (this.isDragging && this.dragCornerIndex >= 0) {
      this.documentCorners[this.dragCornerIndex].dragging = false;
    }

    this.isDragging = false;
    this.dragCornerIndex = -1;
  }

  setActiveCorner(index: number) {
    // Deactivate all corners first
    this.documentCorners.forEach(corner => {
      corner.active = false;
    });

    // Activate the selected corner
    if (index >= 0 && index < this.documentCorners.length) {
      this.documentCorners[index].active = true;
    }
  }

  adjustCorner(index: number, dx: number, dy: number) {
    if (index < 0 || index >= this.documentCorners.length) return;

    const canvas = this.editCanvas.nativeElement;
    const corner = this.documentCorners[index];

    corner.point.x = Math.max(10, Math.min(canvas.width - 10, corner.point.x + dx));
    corner.point.y = Math.max(10, Math.min(canvas.height - 10, corner.point.y + dy));

    this.drawEditOverlay();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.currentStep !== 'edit') return;

    const activeCorner = this.documentCorners.find(corner => corner.active);
    if (!activeCorner) return;

    const step = 5;
    const index = this.documentCorners.indexOf(activeCorner);

    switch(event.key) {
      case 'ArrowUp':
        this.adjustCorner(index, 0, -step);
        event.preventDefault();
        break;
      case 'ArrowDown':
        this.adjustCorner(index, 0, step);
        event.preventDefault();
        break;
      case 'ArrowLeft':
        this.adjustCorner(index, -step, 0);
        event.preventDefault();
        break;
      case 'ArrowRight':
        this.adjustCorner(index, step, 0);
        event.preventDefault();
        break;
    }
  }

  // ==================== STEP 2 to 3: PROCESS ====================
  async processDocument() {
    if (!this.openCVService.isReady || !this.originalImage) return;

    this.isProcessing = true;

    try {
      const cv = this.openCVService.getCV();
      const corners = this.documentCorners.map(c => c.point);

      // Apply perspective transform
      const src = cv.imread(this.editCanvas.nativeElement);
      const cropped = this.applyPerspectiveTransform(src, corners);

      if (cropped) {
        // Apply selected processing mode
        const processed = this.applyProcessingMode(cropped);

        // Create a temporary canvas if resultCanvas doesn't exist yet
        let resultCanvas: HTMLCanvasElement;

        if (!this.resultCanvas || !this.resultCanvas.nativeElement) {
          // Create temporary canvas
          resultCanvas = document.createElement('canvas');
          resultCanvas.className = 'result-canvas';
        } else {
          resultCanvas = this.resultCanvas.nativeElement;
        }

        // Set canvas dimensions
        resultCanvas.width = processed.cols;
        resultCanvas.height = processed.rows;

        // Display result
        cv.imshow(resultCanvas, processed);

        // Save processed image data
        this.processedImageData = resultCanvas.toDataURL('image/png');

        // Store the canvas reference if we created a new one
        if (!this.resultCanvas) {
          this.resultCanvas = { nativeElement: resultCanvas } as ElementRef<HTMLCanvasElement>;
        }

        // Initialize signature canvas
        this.initializeSignatureCanvas();

        // Move to sign step
        this.currentStep = 'sign';

        // Clean up
        cropped.delete();
        processed.delete();
      }

      src.delete();

    } catch (error) {
      console.error('Error processing document:', error);
    } finally {
      this.isProcessing = false;
      this.cdRef.detectChanges();
    }
  }
  private applyPerspectiveTransform(src: any, corners: Point[]): any {
    const cv = this.openCVService.getCV();

    try {
      if (corners.length !== 4) return null;

      // Calculate width and height
      const widthTop = this.distance(corners[0], corners[1]);
      const widthBottom = this.distance(corners[3], corners[2]);
      const maxWidth = Math.max(widthTop, widthBottom);

      const heightRight = this.distance(corners[1], corners[2]);
      const heightLeft = this.distance(corners[0], corners[3]);
      const maxHeight = Math.max(heightRight, heightLeft);

      // Destination points
      const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        maxWidth - 1, 0,
        maxWidth - 1, maxHeight - 1,
        0, maxHeight - 1
      ]);

      // Source points
      const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
        corners[0].x, corners[0].y,
        corners[1].x, corners[1].y,
        corners[2].x, corners[2].y,
        corners[3].x, corners[3].y
      ]);

      // Calculate perspective transform
      const M = cv.getPerspectiveTransform(srcPoints, dstPoints);

      // Apply transform
      const warped = new cv.Mat();
      const dsize = new cv.Size(maxWidth, maxHeight);
      cv.warpPerspective(
        src,
        warped,
        M,
        dsize,
        cv.INTER_LINEAR,
        cv.BORDER_CONSTANT,
        new cv.Scalar(255, 255, 255)
      );

      // Clean up
      srcPoints.delete();
      dstPoints.delete();
      M.delete();

      return warped;

    } catch (error) {
      console.error('Error in perspective transform:', error);
      return null;
    }
  }

  private applyProcessingMode(image: any): any {
    const cv = this.openCVService.getCV();

    try {
      switch(this.processingMode) {
        case 'bw':
          return this.applyBlackWhite(image);
        case 'color':
          return this.applyColorEnhancement(image);
        case 'enhanced':
        default:
          return this.applyEnhancedProcessing(image);
      }
    } catch (error) {
      console.error('Error applying processing mode:', error);
      return image.clone();
    }
  }

  private applyBlackWhite(image: any): any {
    const cv = this.openCVService.getCV();

    const gray = new cv.Mat();
    cv.cvtColor(image, gray, cv.COLOR_RGBA2GRAY);

    // Apply adaptive threshold
    const bw = new cv.Mat();
    cv.adaptiveThreshold(
      gray,
      bw,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      15,
      2
    );

    // Convert back to RGBA
    const result = new cv.Mat();
    cv.cvtColor(bw, result, cv.COLOR_GRAY2RGBA);

    // Clean up
    gray.delete();
    bw.delete();

    return result;
  }

  private applyColorEnhancement(image: any): any {
    const cv = this.openCVService.getCV();

    const result = image.clone();

    // Increase contrast
    cv.convertScaleAbs(result, result, 1.2, 0);

    // Denoise
    cv.fastNlMeansDenoisingColored(result, result, 10, 10, 7, 21);

    return result;
  }

  private applyEnhancedProcessing(image: any): any {
    const cv = this.openCVService.getCV();

    try {
      // Convert to grayscale for processing
      const gray = new cv.Mat();
      cv.cvtColor(image, gray, cv.COLOR_RGBA2GRAY);

      // Apply adaptive threshold
      const thresholded = new cv.Mat();
      cv.adaptiveThreshold(
        gray,
        thresholded,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY,
        11,
        2
      );

      // Denoise - OpenCV.js doesn't have fastNlMeansDenoising
      // Use alternative: Gaussian blur or median blur
      const denoised = new cv.Mat();
      cv.medianBlur(thresholded, denoised, 3); // Alternative 1: Median blur

      // OR use Gaussian blur as alternative
      // cv.GaussianBlur(thresholded, denoised, new cv.Size(3, 3), 0);

      // Sharpen the image
      const sharpened = new cv.Mat();
      const kernel = cv.matFromArray(3, 3, cv.CV_32F, [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ]);
      cv.filter2D(denoised, sharpened, -1, kernel);

      // Convert back to RGBA
      const result = new cv.Mat();
      cv.cvtColor(sharpened, result, cv.COLOR_GRAY2RGBA);

      // Clean up
      gray.delete();
      thresholded.delete();
      denoised.delete();
      sharpened.delete();
      kernel.delete();

      return result;

    } catch (error) {
      console.error('Error enhancing document:', error);
      return image.clone(); // Return original if enhancement fails
    }
  }

  // ==================== STEP 3: SIGNATURE ====================
  private initializeSignatureCanvas() {
    // Wait a bit for the result canvas to be ready
    setTimeout(() => {
      const resultCanvas = this.resultCanvas?.nativeElement;
      const signatureCanvas = this.signatureCanvas?.nativeElement;

      if (!resultCanvas || !signatureCanvas) {
        console.warn('Canvases not ready yet');
        return;
      }

      // Set signature canvas to same dimensions as result
      signatureCanvas.width = resultCanvas.width;
      signatureCanvas.height = resultCanvas.height;

      // Clear and setup signature canvas
      const ctx = signatureCanvas.getContext('2d');
      if (ctx) {
        // Clear to transparent
        ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);

        // Setup drawing style
        ctx.strokeStyle = '#0000ff'; // Blue color for better visibility
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'source-over'; // Draw on top
      }

      this.cdRef.detectChanges();
    }, 100);
  }


  startSigning(event: MouseEvent) {
    if (this.currentStep !== 'sign') return;

    this.isSigning = true;

    const canvas = this.signatureCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Calculate coordinates relative to canvas
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);

    event.preventDefault();
  }

  drawSignature(event: MouseEvent) {
    if (!this.isSigning || !this.signatureCanvas?.nativeElement) return;

    const canvas = this.signatureCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Calculate coordinates relative to canvas
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();

    event.preventDefault();
  }

  stopSigning() {
    if (this.isSigning) {
      this.isSigning = false;

      // Save signature data
      const canvas = this.signatureCanvas.nativeElement;
      this.signatureData = canvas.toDataURL('image/png');
    }
  }

  clearSignature() {
    const canvas = this.signatureCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.signatureData = null;
    }
  }

  previewCombinedDocument() {
    if (!this.processedImageData) return;

    const documentImg = new Image();
    documentImg.src = this.processedImageData;

    documentImg.onload = () => {
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = documentImg.width;
      previewCanvas.height = documentImg.height;
      const ctx = previewCanvas.getContext('2d');

      if (!ctx) return;

      // Draw document
      ctx.drawImage(documentImg, 0, 0);

      // Draw signature if exists
      if (this.signatureCanvas?.nativeElement) {
        const signatureCanvas = this.signatureCanvas.nativeElement;
        ctx.drawImage(signatureCanvas, 0, 0);
      }

      // Show preview in new window
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(`
        <html>
          <head>
            <title>Document Preview</title>
            <style>
              body { margin: 0; padding: 20px; background: #f0f0f0; }
              img { max-width: 100%; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
            </style>
          </head>
          <body>
            <h2>Document Preview</h2>
            <img src="${previewCanvas.toDataURL('image/png')}" />
          </body>
        </html>
      `);
      }
    };
  }

  // ==================== FINAL RESULT ====================
  async saveFinalDocument() {
    if (!this.processedImageData) {
      alert('No document to save');
      return;
    }

    try {
      // Create a new canvas to combine everything
      const combinedCanvas = document.createElement('canvas');
      const ctx = combinedCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Load the processed document image
      const documentImg = new Image();
      documentImg.src = this.processedImageData;

      await new Promise((resolve, reject) => {
        documentImg.onload = resolve;
        documentImg.onerror = reject;
      });

      // Set combined canvas dimensions to match document
      combinedCanvas.width = documentImg.width;
      combinedCanvas.height = documentImg.height;

      // 1. Draw the processed document first
      ctx.drawImage(documentImg, 0, 0);

      // 2. Draw the signature on top (if exists)
      if (this.signatureCanvas?.nativeElement) {
        const signatureCanvas = this.signatureCanvas.nativeElement;

        // Create a temporary canvas to handle signature
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = signatureCanvas.width;
        tempCanvas.height = signatureCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
          // Clear to transparent background
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

          // Draw signature (blue lines)
          tempCtx.drawImage(signatureCanvas, 0, 0);

          // Convert blue signature to black for better contrast
          const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            // If pixel has color (not transparent), make it black
            if (data[i + 3] > 0) {
              data[i] = 0;     // R
              data[i + 1] = 0; // G
              data[i + 2] = 0; // B
              data[i + 3] = 255; // Full opacity
            }
          }

          tempCtx.putImageData(imageData, 0, 0);

          // Draw signature onto the combined canvas
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }

      // Create final data URL
      const finalDataUrl = combinedCanvas.toDataURL('image/png');

      // Trigger download
      this.downloadImage(finalDataUrl, `document-with-signature-${Date.now()}.png`);

      // Show success message
      alert('Document saved successfully!');

    } catch (error) {
      console.error('Error saving final document:', error);
      // @ts-ignore
      alert('Error saving document: ' + error?.message);
    }
  }


  downloadImage(dataUrl: string, filename: string) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==================== NAVIGATION ====================
  backToCapture() {
    this.currentStep = 'capture';
    this.capturedImageData = null;
    this.processedImageData = null;
    this.signatureData = null;
    this.isSigning = false;
    this.cdRef.detectChanges();
  }

  backToEdit() {
    this.currentStep = 'edit';
    this.signatureData = null;
    this.isSigning = false;
    this.cdRef.detectChanges();
  }

  resetScanner() {
    this.currentStep = 'capture';
    this.capturedImageData = null;
    this.processedImageData = null;
    this.signatureData = null;
    this.isSigning = false;
    this.stopCamera();
    this.cdRef.detectChanges();
  }

  ngOnDestroy() {
    this.stopCamera();
  }
}
