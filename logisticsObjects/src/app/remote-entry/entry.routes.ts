import { Route } from '@angular/router';

export const remoteRoutes: Route[] = [
    {
        path: '',
        loadComponent: () => import('../list/list.component').then(m => m.LogisticsObjectsListComponent)
    },
    {
        path: 'create',
        loadComponent: () => import('../form/form.component').then(m => m.LogisticsObjectFormComponent)
    },
    {
        path: ':id/edit',
        loadComponent: () => import('../form/form.component').then(m => m.LogisticsObjectFormComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('../detail/detail.component').then(m => m.LogisticsObjectDetailComponent)
    }
];
