// services/opencv.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OpenCVService {
  private cv: any;
  public isReady = false;

  loadOpenCV(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isReady) {
        resolve();
        return;
      }

      // Check if OpenCV is already loaded
      if ((window as any).cv) {
        this.cv = (window as any).cv;
        this.isReady = true;
        resolve();
        return;
      }

      // Load OpenCV.js
      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/master/opencv.js';
      script.onload = () => {
        setTimeout(() => {
          this.cv = (window as any).cv;
          this.isReady = true;
          resolve();
        }, 1000); // Give time for OpenCV to initialize
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  getCV() {
    return this.cv;
  }
}
