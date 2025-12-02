import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { LogisticsObject } from '../models/logistics-object.model';

@Injectable({
    providedIn: 'root'
})
export class MockDataService {
    private mockObjects: LogisticsObject[] = [
        {
            '@id': 'https://1r.example.com/logistics-objects/piece-001',
            '@type': 'cargo:Piece',
            '@context': {
                'cargo': 'https://onerecord.iata.org/ns/cargo#'
            },
            'cargo:coload': false,
            'cargo:goodsDescription': 'ONE Record Advertisement Materials',
            'cargo:grossWeight': {
                '@type': 'cargo:Value',
                'cargo:value': 25.0,
                'cargo:unit': 'KGM'
            },
            'cargo:handlingInstructions': [{
                '@type': 'cargo:HandlingInstructions',
                'cargo:handlingInstructionsType': 'SPH',
                'cargo:description': 'Valuable Cargo',
                'cargo:handlingInstructionsTypeCode': 'VAL'
            }]
        },
        {
            '@id': 'https://1r.example.com/logistics-objects/shipment-001',
            '@type': 'cargo:Shipment',
            '@context': {
                'cargo': 'https://onerecord.iata.org/ns/cargo#'
            },
            'cargo:goodsDescription': 'Lots of awesome ONE Record information materials',
            'cargo:totalGrossWeight': {
                '@type': 'cargo:Value',
                'cargo:value': 125.5,
                'cargo:unit': 'KGM'
            },
            'cargo:containedPieces': [{
                '@type': 'cargo:Piece',
                '@id': 'https://1r.example.com/logistics-objects/piece-001'
            }]
        },
        {
            '@id': 'https://1r.example.com/logistics-objects/company-001',
            '@type': 'cargo:Company',
            '@context': {
                'cargo': 'https://onerecord.iata.org/ns/cargo#'
            },
            'cargo:name': 'Acme Corporation',
            'cargo:shortName': 'ACME',
            'cargo:contactPersons': [{
                '@type': 'cargo:Person',
                'cargo:firstName': 'Jane',
                'cargo:lastName': 'Doe',
                'cargo:salutation': 'Ms'
            }]
        },
        {
            '@id': 'https://1r.example.com/logistics-objects/customs-001',
            '@type': 'cargo:CustomsInformation',
            '@context': {
                'cargo': 'https://onerecord.iata.org/ns/cargo#'
            },
            'cargo:countryCode': 'DE',
            'cargo:subjectCode': 'ISS',
            'cargo:contentCode': 'RA',
            'cargo:otherCustomsInformation': '01234-01'
        },
        {
            '@id': 'https://1r.example.com/logistics-objects/piece-002',
            '@type': 'cargo:Piece',
            '@context': {
                'cargo': 'https://onerecord.iata.org/ns/cargo#'
            },
            'cargo:coload': true,
            'cargo:goodsDescription': 'Electronics - Laptops',
            'cargo:grossWeight': {
                '@type': 'cargo:Value',
                'cargo:value': 45.0,
                'cargo:unit': 'KGM'
            }
        }
    ];

    /**
     * Get all logistics objects (mock)
     */
    getAllLogisticsObjects(): Observable<LogisticsObject[]> {
        return of(this.mockObjects).pipe(delay(500));
    }

    /**
     * Get logistics object by ID (mock)
     */
    getLogisticsObjectById(id: string): Observable<LogisticsObject | undefined> {
        const fullId = id.includes('http') ? id : `https://1r.example.com/logistics-objects/${id}`;
        const object = this.mockObjects.find(obj => obj['@id'] === fullId);
        return of(object).pipe(delay(300));
    }

    /**
     * Get logistics objects by type (mock)
     */
    getLogisticsObjectsByType(type: string): Observable<LogisticsObject[]> {
        const filtered = this.mockObjects.filter(obj => obj['@type'] === type);
        return of(filtered).pipe(delay(400));
    }

    /**
     * Create new logistics object (mock)
     */
    createLogisticsObject(data: LogisticsObject): Observable<LogisticsObject> {
        const newId = `https://1r.example.com/logistics-objects/${Date.now()}`;
        const newObject = { ...data, '@id': newId };
        this.mockObjects.push(newObject);
        return of(newObject).pipe(delay(600));
    }

    /**
     * Update logistics object (mock)
     */
    updateLogisticsObject(id: string, data: Partial<LogisticsObject>): Observable<LogisticsObject> {
        const fullId = id.includes('http') ? id : `https://1r.example.com/logistics-objects/${id}`;
        const index = this.mockObjects.findIndex(obj => obj['@id'] === fullId);

        if (index !== -1) {
            this.mockObjects[index] = { ...this.mockObjects[index], ...data };
            return of(this.mockObjects[index]).pipe(delay(500));
        }

        throw new Error('Logistics object not found');
    }

    /**
     * Delete logistics object (mock)
     */
    deleteLogisticsObject(id: string): Observable<boolean> {
        const fullId = id.includes('http') ? id : `https://1r.example.com/logistics-objects/${id}`;
        const index = this.mockObjects.findIndex(obj => obj['@id'] === fullId);

        if (index !== -1) {
            this.mockObjects.splice(index, 1);
            return of(true).pipe(delay(400));
        }

        return of(false).pipe(delay(400));
    }

    /**
     * Get sample Piece data for forms
     */
    getSamplePiece(): LogisticsObject {
        return {
            '@id': 'https://1r.example.com/logistics-objects/piece-002',
            '@context': {
                'cargo': 'https://onerecord.iata.org/ns/cargo#'
            },
            '@type': 'cargo:Piece',
            'cargo:coload': false,
            'cargo:goodsDescription': '',
            'cargo:handlingInstructions': []
        };
    }

    /**
     * Get sample Shipment data for forms
     */
    getSampleShipment(): LogisticsObject {
        return {
            '@id': 'https://1r.example.com/logistics-objects/shipment-001',
            '@context': {
                'cargo': 'https://onerecord.iata.org/ns/cargo#'
            },
            '@type': 'cargo:Shipment',
            'cargo:goodsDescription': '',
            'cargo:containedPieces': []
        };
    }

    /**
     * Get sample Company data for forms
     */
    getSampleCompany(): LogisticsObject {
        return {
            '@id': 'https://1r.example.com/logistics-objects/company-001',
            '@context': {
                'cargo': 'https://onerecord.iata.org/ns/cargo#'
            },
            '@type': 'cargo:Company',
            'cargo:name': '',
            'cargo:shortName': '',
            'cargo:contactPersons': []
        };
    }
}
