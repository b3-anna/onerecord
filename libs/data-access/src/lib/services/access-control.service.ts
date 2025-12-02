import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

@Injectable({
    providedIn: 'root'
})
export class AccessControlService {

    constructor(private oauthService: OAuthService) { }

    /**
     * Checks if the current user has the required role.
     * This is a basic RBAC implementation based on OIDC claims.
     */
    hasRole(role: string): boolean {
        const claims = this.oauthService.getIdentityClaims() as any;
        if (!claims) {
            return false;
        }
        // Adjust 'roles' claim based on your Identity Provider
        const roles = claims['roles'] || [];
        return Array.isArray(roles) && roles.includes(role);
    }

    /**
     * Checks if the user has permission to perform an action on a resource.
     * In ONE Record, this might involve checking specific ACLs.
     */
    hasPermission(action: string, resourceUri: string): boolean {
        // Placeholder for more complex ACL logic
        // For now, assume authenticated users have access
        return this.oauthService.hasValidAccessToken();
    }
}
