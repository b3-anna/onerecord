import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../shell/src/environments/environment';

export interface ChangeOperation {
    '@type': 'api:Operation';
    'api:op': { '@id': string };
    'api:s': string;
    'api:p': string;
    'api:o': OperationObject[];
}

export interface OperationObject {
    '@type': 'api:OperationObject';
    'api:hasDatatype': string;
    'api:hasValue': string;
}

export interface ChangeRequest {
    '@context': {
        cargo: string;
        api: string;
    };
    '@type': 'api:Change';
    'api:hasLogisticsObject': { '@id': string };
    'api:hasDescription': string;
    'api:hasOperation': ChangeOperation[];
    'api:hasRevision': {
        '@type': string;
        '@value': string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class OneRecordService {
    private http = inject(HttpClient);
    private readonly API_VERSION = '2.0.0-dev';
    private readonly baseUrl = environment.oneRecordApiUrl || 'https://1r.example.com';

    private getHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Content-Type': `application/ld+json; version=${this.API_VERSION}`,
            'Accept': `application/ld+json; version=${this.API_VERSION}`
        });
    }

    /**
     * Get server information
     */
    getServerInformation(): Observable<any> {
        return this.http.get(`${this.baseUrl}/`, {
            headers: this.getHeaders()
        });
    }

    /**
     * Create a new LogisticsObject
     */
    createLogisticsObject<T>(data: T): Observable<any> {
        return this.http.post(
            `${this.baseUrl}/logistics-objects`,
            data,
            {
                headers: this.getHeaders(),
                observe: 'response'
            }
        );
    }

    /**
     * Get a LogisticsObject by ID
     */
    getLogisticsObject<T>(logisticsObjectId: string, embedded = false): Observable<T> {
        const url = embedded
            ? `${this.baseUrl}/logistics-objects/${logisticsObjectId}?embedded=true`
            : `${this.baseUrl}/logistics-objects/${logisticsObjectId}`;

        return this.http.get<T>(url, {
            headers: this.getHeaders()
        });
    }

    /**
     * Update a LogisticsObject using PATCH with Change Request
     */
    updateLogisticsObject(
        logisticsObjectId: string,
        changeRequest: ChangeRequest
    ): Observable<any> {
        return this.http.patch(
            `${this.baseUrl}/logistics-objects/${logisticsObjectId}`,
            changeRequest,
            {
                headers: this.getHeaders(),
                observe: 'response'
            }
        );
    }

    /**
     * Get LogisticsObject version/revision
     */
    getLogisticsObjectVersion<T>(
        logisticsObjectId: string,
        version: number
    ): Observable<T> {
        return this.http.get<T>(
            `${this.baseUrl}/logistics-objects/${logisticsObjectId}?at=${version}`,
            { headers: this.getHeaders() }
        );
    }

    /**
     * Subscribe to LogisticsObject changes
     */
    subscribe(
        topic: string,
        callbackUrl: string,
        logisticsObjectId?: string
    ): Observable<any> {
        const subscriptionData = {
            '@context': {
                'cargo': 'https://onerecord.iata.org/ns/cargo#',
                'api': 'https://onerecord.iata.org/ns/api#'
            },
            '@type': 'api:Subscription',
            'api:hasTopic': topic,
            'api:hasContentType': `application/ld+json; version=${this.API_VERSION}`,
            'api:hasCallbackUrl': callbackUrl,
            ...(logisticsObjectId && {
                'api:hasSubscriptionTarget': {
                    '@id': `${this.baseUrl}/logistics-objects/${logisticsObjectId}`
                }
            })
        };

        return this.http.post(
            `${this.baseUrl}/subscriptions`,
            subscriptionData,
            {
                headers: this.getHeaders(),
                observe: 'response'
            }
        );
    }

    /**
     * Get all subscriptions
     */
    getSubscriptions(): Observable<any> {
        return this.http.get(`${this.baseUrl}/subscriptions`, {
            headers: this.getHeaders()
        });
    }

    /**
     * Delete a subscription
     */
    deleteSubscription(subscriptionId: string): Observable<any> {
        return this.http.delete(
            `${this.baseUrl}/subscriptions/${subscriptionId}`,
            {
                headers: this.getHeaders(),
                observe: 'response'
            }
        );
    }

    /**
     * Helper: Create ADD operation
     */
    createAddOperation(
        subject: string,
        predicate: string,
        datatype: string,
        value: string
    ): ChangeOperation {
        return {
            '@type': 'api:Operation',
            'api:op': { '@id': 'api:ADD' },
            'api:s': subject,
            'api:p': predicate,
            'api:o': [{
                '@type': 'api:OperationObject',
                'api:hasDatatype': datatype,
                'api:hasValue': value
            }]
        };
    }

    /**
     * Helper: Create DELETE operation
     */
    createDeleteOperation(
        subject: string,
        predicate: string,
        datatype: string,
        value: string
    ): ChangeOperation {
        return {
            '@type': 'api:Operation',
            'api:op': { '@id': 'api:DELETE' },
            'api:s': subject,
            'api:p': predicate,
            'api:o': [{
                '@type': 'api:OperationObject',
                'api:hasDatatype': datatype,
                'api:hasValue': value
            }]
        };
    }
}
