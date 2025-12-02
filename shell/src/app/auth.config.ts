import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
    issuer: 'https://idsvr4.azurewebsites.net', // Demo Identity Server
    redirectUri: window.location.origin,
    clientId: 'spa',
    responseType: 'code',
    scope: 'openid profile email offline_access',
    showDebugInformation: true,
};
