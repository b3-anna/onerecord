import { Observable, from } from 'rxjs';

export interface DocumentScanOptions {
  openCvScriptUrl?: string;
  maxOutputWidth?: number;
  maxOutputHeight?: number;
  minContourArea?: number;
  videoConstraints?: MediaTrackConstraints;
}

export interface DocumentScanResult {
  contour: [number, number][];
  warpedCanvas: HTMLCanvasElement;
  originalCanvas: HTMLCanvasElement;
}

type OpenCvGlobal = typeof globalThis & {
  cv?: any;
};

/**
 * Utility service for document scanning based on HTML5 media APIs and OpenCV.js.
 *
 * The service exposes helpers to request the camera, capture a frame, detect a document
 * outline and perform a perspective correction so the result resembles a flat scan.
 */
export class DocumentScanService {
  private cvReady?: Promise<any>;

  /**
   * Loads OpenCV.js only once and returns the global cv instance.
   */
  loadOpenCv(scriptUrl = 'https://docs.opencv.org/4.x/opencv.js'): Promise<any> {
    console.info("load OpenCS")
    // if (this.cvReady) {
    //   return this.cvReady;
    // }

    const existing = (globalThis as OpenCvGlobal).cv;
    if (existing) {
      this.cvReady = Promise.resolve(existing);
      return this.cvReady;
    }

    this.cvReady = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = scriptUrl;
      script.onerror = (error) => reject(error);
      document.head.appendChild(script);
    });

    return this.cvReady;
  }

  /**
   * Requests access to the user's camera via the HTML5 getUserMedia API.
   */
  requestCameraStream(
    constraints: MediaTrackConstraints = { facingMode: 'environment' }
  ): Observable<MediaStream> {
    console.info("start camera");
    if (!globalThis.isSecureContext) {
      throw new Error('Camera access requires HTTPS or localhost.');
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera access is not supported in this browser.');
    }

    return from(
      navigator.mediaDevices.getUserMedia({
        video: constraints,
        audio: false,
      })
    );
  }

  stopCameraStream(stream: MediaStream): void {
    stream.getTracks().forEach((track) => track.stop());
  }

  /**
   * Captures a single frame from a video element to a canvas element using HTML5 canvas APIs.
   */
  captureFrame(video: HTMLVideoElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas 2D context unavailable');
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  /**
   * Scans a document from a video frame by detecting edges and warping the perspective.
   */
  async scanFromVideo(
    video: HTMLVideoElement,
    options: DocumentScanOptions = {}
  ): Promise<DocumentScanResult | null> {
    const cv = await this.loadOpenCv(options.openCvScriptUrl);
    const srcCanvas = this.captureFrame(video);

    const src = cv.imread(srcCanvas);
    const { contour, warped } = this.processDocument(src, cv, options);

    src.delete();

    if (!contour || !warped) {
      return null;
    }

    const warpedCanvas = document.createElement('canvas');
    warpedCanvas.width = warped.size().width;
    warpedCanvas.height = warped.size().height;
    cv.imshow(warpedCanvas, warped);
    warped.delete();

    return {
      contour,
      warpedCanvas,
      originalCanvas: srcCanvas,
    };
  }

  private processDocument(src: any, cv: any, options: DocumentScanOptions) {
    const gray = new cv.Mat();
    const blurred = new cv.Mat();
    const edged = new cv.Mat();
    const hierarchy = new cv.Mat();
    const contours = new cv.MatVector();
    let warped: any | null = null;
    let contourPoints: [number, number][] | null = null;

    try {
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
      cv.Canny(blurred, edged, 75, 200, 3, false);

      cv.findContours(edged, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

      const candidates = this.extractContours(contours, cv, options.minContourArea ?? 15000);

      if (candidates.length > 0) {
        contourPoints = candidates[0];
        warped = this.warpPerspective(src, contourPoints, cv, options);
      }
    } finally {
      gray.delete();
      blurred.delete();
      edged.delete();
      hierarchy.delete();
      contours.delete();
    }

    return { contour: contourPoints, warped };
  }

  private extractContours(
    contours: any,
    cv: any,
    minArea: number
  ): [number, number][][] {
    const approximations: [number, number][][] = [];

    for (let i = 0; i < contours.size(); i += 1) {
      const contour = contours.get(i);
      const peri = cv.arcLength(contour, true);
      const approx = new cv.Mat();

      cv.approxPolyDP(contour, approx, 0.02 * peri, true);

      if (approx.size().height === 4) {
        const area = cv.contourArea(approx);
        if (area >= minArea) {
          const points: [number, number][] = [];
          for (let r = 0; r < approx.rows; r += 1) {
            points.push([approx.intPtr(r, 0)[0], approx.intPtr(r, 0)[1]]);
          }
          approximations.push(points);
        }
      }

      approx.delete();
      contour.delete();
    }

    approximations.sort((a, b) => this.polygonArea(b) - this.polygonArea(a));

    return approximations;
  }

  private warpPerspective(
    src: any,
    contour: [number, number][],
    cv: any,
    options: DocumentScanOptions
  ) {
    const ordered = this.orderContour(contour);
    const widthTop = this.distance(ordered[0], ordered[1]);
    const widthBottom = this.distance(ordered[2], ordered[3]);
    const maxWidth = Math.max(widthTop, widthBottom);

    const heightLeft = this.distance(ordered[0], ordered[3]);
    const heightRight = this.distance(ordered[1], ordered[2]);
    const maxHeight = Math.max(heightLeft, heightRight);

    const targetWidth = options.maxOutputWidth ?? Math.round(maxWidth);
    const targetHeight = options.maxOutputHeight ?? Math.round(maxHeight);

    const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, ordered.flat());
    const dstTri = cv.matFromArray(
      4,
      1,
      cv.CV_32FC2,
      [
        0,
        0,
        targetWidth - 1,
        0,
        targetWidth - 1,
        targetHeight - 1,
        0,
        targetHeight - 1,
      ]
    );

    const M = cv.getPerspectiveTransform(srcTri, dstTri);
    const dsize = new cv.Size(targetWidth, targetHeight);
    const dst = new cv.Mat();

    cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

    srcTri.delete();
    dstTri.delete();
    M.delete();

    return dst;
  }

  private orderContour(points: [number, number][]): [number, number][] {
    const sum = points.map((p) => p[0] + p[1]);
    const diff = points.map((p) => p[0] - p[1]);

    const ordered: [number, number][] = [
      points[sum.indexOf(Math.min(...sum))],
      points[diff.indexOf(Math.max(...diff))],
      points[sum.indexOf(Math.max(...sum))],
      points[diff.indexOf(Math.min(...diff))],
    ];

    return ordered;
  }

  private distance(a: [number, number], b: [number, number]): number {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  private polygonArea(points: [number, number][]): number {
    let area = 0;
    for (let i = 0; i < points.length; i += 1) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      area += x1 * y2 - x2 * y1;
    }
    return Math.abs(area / 2);
  }
}
