import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MockDataService } from '@iata-one-record/data-access';

interface FormFieldConfig {
    name: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'object' | 'array';
    required?: boolean;
    options?: { value: any; label: string }[];
    children?: FormFieldConfig[];
    placeholder?: string;
    hint?: string;
}

@Component({
    selector: 'app-logistics-object-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatCheckboxModule,
        MatIconModule,
        MatStepperModule,
        MatChipsModule,
        MatProgressSpinnerModule
    ],
    template: `
    <div class="container">
      <div class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ isEditMode() ? 'Edit' : 'Create' }} Logistics Object</h1>
      </div>

      <mat-stepper #stepper [linear]="true">
        <!-- Step 1: Select Type -->
        <mat-step [stepControl]="typeForm">
          <form [formGroup]="typeForm">
            <ng-template matStepLabel>Select Type</ng-template>
            <mat-card>
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Logistics Object Type</mat-label>
                  <mat-select formControlName="type" (selectionChange)="onTypeChange($event.value)">
                    <mat-option value="cargo:Piece">Piece</mat-option>
                    <mat-option value="cargo:Shipment">Shipment</mat-option>
                    <mat-option value="cargo:Company">Company</mat-option>
                    <mat-option value="cargo:CustomsInformation">Customs Information</mat-option>
                  </mat-select>
                  <mat-hint>Select the type of logistics object to create</mat-hint>
                </mat-form-field>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button color="primary" matStepperNext [disabled]="!typeForm.valid">
                  Next
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </mat-card-actions>
            </mat-card>
          </form>
        </mat-step>

        <!-- Step 2: Fill Details -->
        <mat-step [stepControl]="dataForm">
          <form [formGroup]="dataForm">
            <ng-template matStepLabel>Object Details</ng-template>
            <mat-card>
              <mat-card-header>
                <mat-card-title>{{ selectedType() }} Details</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="form-grid">
                  @for (field of formFields(); track field.name) {
                    @if (field.type === 'text' || field.type === 'number') {
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>{{ field.label }}</mat-label>
                        <input 
                          matInput 
                          [formControlName]="field.name"
                          [type]="field.type"
                          [placeholder]="field.placeholder || ''"
                        />
                        @if (field.hint) {
                          <mat-hint>{{ field.hint }}</mat-hint>
                        }
                        @if (dataForm.get(field.name)?.hasError('required')) {
                          <mat-error>{{ field.label }} is required</mat-error>
                        }
                      </mat-form-field>
                    }
                    
                    @if (field.type === 'textarea') {
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>{{ field.label }}</mat-label>
                        <textarea 
                          matInput 
                          [formControlName]="field.name"
                          rows="3"
                          [placeholder]="field.placeholder || ''"
                        ></textarea>
                        @if (field.hint) {
                          <mat-hint>{{ field.hint }}</mat-hint>
                        }
                      </mat-form-field>
                    }
                    
                    @if (field.type === 'boolean') {
                      <div class="checkbox-field">
                        <mat-checkbox [formControlName]="field.name">
                          {{ field.label }}
                        </mat-checkbox>
                        @if (field.hint) {
                          <span class="hint">{{ field.hint }}</span>
                        }
                      </div>
                    }
                    
                    @if (field.type === 'select' && field.options) {
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>{{ field.label }}</mat-label>
                        <mat-select [formControlName]="field.name">
                          @for (option of field.options; track option.value) {
                            <mat-option [value]="option.value">{{ option.label }}</mat-option>
                          }
                        </mat-select>
                        @if (field.hint) {
                          <mat-hint>{{ field.hint }}</mat-hint>
                        }
                      </mat-form-field>
                    }
                  }
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon>
                  Back
                </button>
                <button mat-raised-button color="primary" matStepperNext [disabled]="!dataForm.valid">
                  Next
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </mat-card-actions>
            </mat-card>
          </form>
        </mat-step>

        <!-- Step 3: Review & Submit -->
        <mat-step>
          <ng-template matStepLabel>Review & Submit</ng-template>
          <mat-card>
            <mat-card-header>
              <mat-card-title>Review Your Data</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="review-section">
                <h3>JSON-LD Preview</h3>
                <pre class="json-preview">{{ getJsonPreview() | json }}</pre>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button matStepperPrevious>
                <mat-icon>arrow_back</mat-icon>
                Back
              </button>
              <button 
                mat-raised-button 
                color="primary" 
                (click)="submit()"
                [disabled]="submitting()"
              >
                @if (submitting()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <mat-icon>save</mat-icon>
                }
                {{ isEditMode() ? 'Update' : 'Create' }}
              </button>
            </mat-card-actions>
          </mat-card>
        </mat-step>
      </mat-stepper>
    </div>
  `,
    styles: [`
    .container {
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;

      h1 {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
      }
    }

    .form-grid {
      display: grid;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .full-width {
      width: 100%;
    }

    .checkbox-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .hint {
        font-size: 0.875rem;
        color: rgba(0,0,0,0.6);
        margin-left: 2rem;
      }
    }

    .review-section {
      h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.25rem;
      }
    }

    .json-preview {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
      max-height: 400px;
    }

    mat-card {
      margin-bottom: 1rem;
    }

    mat-card-actions {
      display: flex;
      justify-content: space-between;
      padding: 1rem;
    }

    mat-spinner {
      display: inline-block;
      margin-right: 0.5rem;
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .header h1 {
        font-size: 1.5rem;
      }
    }
  `]
})
export class LogisticsObjectFormComponent implements OnInit {
    typeForm: FormGroup;
    dataForm: FormGroup;

    selectedType = signal<string>('');
    formFields = signal<FormFieldConfig[]>([]);
    submitting = signal(false);
    isEditMode = signal(false);

    private readonly formConfigs: Record<string, FormFieldConfig[]> = {
        'cargo:Piece': [
            { name: 'goodsDescription', label: 'Goods Description', type: 'textarea', required: true, placeholder: 'Describe the goods', hint: 'Brief description of the cargo' },
            { name: 'coload', label: 'Coload', type: 'boolean', hint: 'Is this a coload shipment?' },
            { name: 'grossWeightValue', label: 'Gross Weight (value)', type: 'number', placeholder: '0.0' },
            {
                name: 'grossWeightUnit', label: 'Weight Unit', type: 'select', options: [
                    { value: 'KGM', label: 'Kilograms (KGM)' },
                    { value: 'LBR', label: 'Pounds (LBR)' }
                ]
            },
        ],
        'cargo:Shipment': [
            { name: 'goodsDescription', label: 'Goods Description', type: 'textarea', required: true, placeholder: 'Describe the shipment' },
            { name: 'totalGrossWeightValue', label: 'Total Gross Weight', type: 'number', placeholder: '0.0' },
            {
                name: 'totalGrossWeightUnit', label: 'Weight Unit', type: 'select', options: [
                    { value: 'KGM', label: 'Kilograms (KGM)' },
                    { value: 'LBR', label: 'Pounds (LBR)' }
                ]
            },
        ],
        'cargo:Company': [
            { name: 'name', label: 'Company Name', type: 'text', required: true, placeholder: 'Acme Corporation' },
            { name: 'shortName', label: 'Short Name', type: 'text', placeholder: 'ACME' },
            { name: 'contactFirstName', label: 'Contact First Name', type: 'text', placeholder: 'Jane' },
            { name: 'contactLastName', label: 'Contact Last Name', type: 'text', placeholder: 'Doe' },
            {
                name: 'contactSalutation', label: 'Salutation', type: 'select', options: [
                    { value: 'Mr', label: 'Mr' },
                    { value: 'Ms', label: 'Ms' },
                    { value: 'Mrs', label: 'Mrs' },
                    { value: 'Dr', label: 'Dr' }
                ]
            },
        ],
        'cargo:CustomsInformation': [
            { name: 'countryCode', label: 'Country Code', type: 'text', required: true, placeholder: 'DE', hint: 'ISO 2-letter country code' },
            { name: 'subjectCode', label: 'Subject Code', type: 'text', placeholder: 'ISS' },
            { name: 'contentCode', label: 'Content Code', type: 'text', placeholder: 'RA' },
            { name: 'otherCustomsInformation', label: 'Other Information', type: 'text', placeholder: '01234-01' },
        ]
    };

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private mockDataService: MockDataService
    ) {
        this.typeForm = this.fb.group({
            type: ['', Validators.required]
        });

        this.dataForm = this.fb.group({});
    }

    ngOnInit() {
        // Check if editing
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            // Load existing data
        }
    }

    onTypeChange(type: string) {
        this.selectedType.set(type);
        const fields = this.formConfigs[type] || [];
        this.formFields.set(fields);

        // Rebuild form
        this.dataForm = this.fb.group({});
        fields.forEach(field => {
            const validators = field.required ? [Validators.required] : [];
            this.dataForm.addControl(field.name, this.fb.control('', validators));
        });
    }

    getJsonPreview(): any {
        const type = this.typeForm.value.type;
        const formData = this.dataForm.value;

        const jsonLd: any = {
            '@context': {
                'cargo': 'https://onerecord.iata.org/ns/cargo#'
            },
            '@type': type
        };

        // Map form fields to JSON-LD structure
        if (type === 'cargo:Piece') {
            if (formData.goodsDescription) jsonLd['cargo:goodsDescription'] = formData.goodsDescription;
            jsonLd['cargo:coload'] = formData.coload || false;
            if (formData.grossWeightValue) {
                jsonLd['cargo:grossWeight'] = {
                    '@type': 'cargo:Value',
                    'cargo:value': parseFloat(formData.grossWeightValue),
                    'cargo:unit': formData.grossWeightUnit || 'KGM'
                };
            }
        } else if (type === 'cargo:Shipment') {
            if (formData.goodsDescription) jsonLd['cargo:goodsDescription'] = formData.goodsDescription;
            if (formData.totalGrossWeightValue) {
                jsonLd['cargo:totalGrossWeight'] = {
                    '@type': 'cargo:Value',
                    'cargo:value': parseFloat(formData.totalGrossWeightValue),
                    'cargo:unit': formData.totalGrossWeightUnit || 'KGM'
                };
            }
            jsonLd['cargo:containedPieces'] = [];
        } else if (type === 'cargo:Company') {
            if (formData.name) jsonLd['cargo:name'] = formData.name;
            if (formData.shortName) jsonLd['cargo:shortName'] = formData.shortName;
            if (formData.contactFirstName || formData.contactLastName) {
                jsonLd['cargo:contactPersons'] = [{
                    '@type': 'cargo:Person',
                    ...(formData.contactFirstName && { 'cargo:firstName': formData.contactFirstName }),
                    ...(formData.contactLastName && { 'cargo:lastName': formData.contactLastName }),
                    ...(formData.contactSalutation && { 'cargo:salutation': formData.contactSalutation })
                }];
            }
        } else if (type === 'cargo:CustomsInformation') {
            if (formData.countryCode) jsonLd['cargo:countryCode'] = formData.countryCode;
            if (formData.subjectCode) jsonLd['cargo:subjectCode'] = formData.subjectCode;
            if (formData.contentCode) jsonLd['cargo:contentCode'] = formData.contentCode;
            if (formData.otherCustomsInformation) jsonLd['cargo:otherCustomsInformation'] = formData.otherCustomsInformation;
        }

        return jsonLd;
    }

    submit() {
        if (!this.typeForm.valid || !this.dataForm.valid) return;

        this.submitting.set(true);
        const jsonLd = this.getJsonPreview();

        // Use mock service for now
        this.mockDataService.createLogisticsObject(jsonLd).subscribe({
            next: (result) => {
                this.submitting.set(false);
                this.router.navigate(['/logisticsObjects']);
            },
            error: (error) => {
                this.submitting.set(false);
                console.error('Error creating object:', error);
            }
        });
    }

    goBack() {
        this.router.navigate(['/logisticsObjects']);
    }
}
