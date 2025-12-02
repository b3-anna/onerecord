import { Route } from '@angular/router';

export const remoteRoutes: Route[] = [
    {
        path: '',
        loadComponent: () => import('../subscriptions/subscriptions.component').then(m => m.SubscriptionsListComponent)
    }
];
