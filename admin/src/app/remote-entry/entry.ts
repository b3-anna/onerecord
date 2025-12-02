import { Component } from '@angular/core';
import { DocumentScanPage } from './document-scan-page.component';

@Component({
  imports: [DocumentScanPage],
  selector: 'app-admin-entry',
  template: `<app-document-scan-page></app-document-scan-page>`,
})
export class RemoteEntry {}
