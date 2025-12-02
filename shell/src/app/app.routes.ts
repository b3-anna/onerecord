import { Route } from '@angular/router';
import { HomeComponent } from './home.component';

export const appRoutes: Route[] = [
  {
    path: 'admin',
    loadChildren: () => import('admin/Routes').then((m) => m!.remoteRoutes),
  },
  {
    path: 'pubSub',
    loadChildren: () => import('pubSub/Routes').then((m) => m!.remoteRoutes),
  },
  {
    path: 'logisticsObjects',
    loadChildren: () =>
      import('logisticsObjects/Routes').then((m) => m!.remoteRoutes),
  },
  {
    path: '',
    component: HomeComponent,
  },
];
