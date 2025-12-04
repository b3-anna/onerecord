import { Component } from '@angular/core';
import { DocumentScannerComponent } from './document-scanner.component';

@Component({
  imports: [DocumentScannerComponent],
  selector: 'app-admin-entry',
  template: `<app-document-scanner></app-document-scanner>`,
})
export class RemoteEntry {}
