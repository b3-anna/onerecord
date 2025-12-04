// services/camera.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private stream: MediaStream | null = null;

  async startCamera(videoElement: HTMLVideoElement): Promise<void> {
    try {
      // Stop any existing stream
      this.stopCamera();

      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use rear camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      // Set video source
      videoElement.srcObject = this.stream;

      // Play video
      await videoElement.play();

    } catch (error) {
      console.error('Camera error:', error);
      throw error;
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  takePicture(videoElement: HTMLVideoElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    }

    return canvas;
  }
}
