export interface LogisticsObject {
    '@id': string;
    '@type': string | string[];
    [key: string]: any;
}

export interface Notification {
    '@type': 'https://onerecord.iata.org/ns/api#Notification';
    'https://onerecord.iata.org/ns/api#hasLogisticsObject': {
        '@id': string;
    };
    [key: string]: any;
}
