import { Routes } from '@angular/router';
// import { LoginComponent } from './login/login.component';
// import { RecordsComponent } from './records/records.component';
// import { EntryModeComponent } from './entry-mode/entry-mode.component';
// import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
// import { GenerateSrmReportComponent } from './srm-shipping-records/generate-srm-report/generate-srm-report.component';
// import { AddSRMRecordComponent } from './srm-shipping-records/add-srm-record/add-srm-record.component';
// import { OfficeModeComponent } from './office-mode/office-mode.component';

// import { AuthGuard } from './auth.guard';
// import { OfficeModeReportsComponent } from './office-mode-reports/office-mode-reports.component';
import { MainComponent } from './main/main.component';
import { EditPaymentComponent } from './edit-payment/edit-payment.component';
import { AddPaymentComponent } from './add-payment/add-payment.component';
import { ViewPaymentComponent } from './view-payment/view-payment.component';

export const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'edit-payment/:id', component: EditPaymentComponent },
  { path: 'add-payment', component: AddPaymentComponent },
  { path: 'view-payment/:id', component: ViewPaymentComponent },
  // { path: 'login', component: LoginComponent }, // Public route
  // { path: 'logout', redirectTo: 'login', pathMatch: 'full' }, // Redirect to login
  // { path: 'entry-mode', component: EntryModeComponent, canActivate: [AuthGuard] },
  // { path: 'office-mode', component: OfficeModeComponent, canActivate: [AuthGuard] },
  // { path: 'records', component: RecordsComponent, canActivate: [AuthGuard] },
  // { path: 'add-srm-record', component: AddSRMRecordComponent, canActivate: [AuthGuard] },
  // { path: 'generate-srm-report', component: GenerateSrmReportComponent, canActivate: [AuthGuard] },

  // { path: '', redirectTo: 'login', pathMatch: 'full' }, // Default route
  // { path: 'reports/:type', component: OfficeModeReportsComponent, canActivate: [AuthGuard] }, // Dynamic route
  // { path: '**', component: PageNotFoundComponent } // Wildcard route
];

