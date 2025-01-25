import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RecordsComponent } from './records/records.component';
import { EntryModeComponent } from './entry-mode/entry-mode.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { GenerateSrmReportComponent } from './srm-shipping-records/generate-srm-report/generate-srm-report.component';
import { AddSRMRecordComponent } from './srm-shipping-records/add-srm-record/add-srm-record.component';
import { OfficeModeComponent } from './office-mode/office-mode.component';

import { AuthGuard } from './auth.guard';
import { OfficeModeReportsComponent } from './office-mode-reports/office-mode-reports.component';
import { MainComponent } from './main/main.component';
import { PaymentsComponent } from './payments/payments.component';


export const routes: Routes = [
  { path: 'main', component: MainComponent },
  { path: 'login', component: LoginComponent }, // Public route
  { path: 'logout', redirectTo: 'login', pathMatch: 'full' }, // Redirect to login
  { path: 'entry-mode', component: EntryModeComponent, canActivate: [AuthGuard] },
  { path: 'office-mode', component: OfficeModeComponent, canActivate: [AuthGuard] },
  { path: 'records', component: RecordsComponent, canActivate: [AuthGuard] },
  { path: 'add-srm-record', component: AddSRMRecordComponent, canActivate: [AuthGuard] },
  { path: 'generate-srm-report', component: GenerateSrmReportComponent, canActivate: [AuthGuard] },

  { path: 'payments', component: PaymentsComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // Default route
  { path: 'reports/:type', component: OfficeModeReportsComponent, canActivate: [AuthGuard] }, // Dynamic route
  { path: '**', component: PageNotFoundComponent } // Wildcard route
];

