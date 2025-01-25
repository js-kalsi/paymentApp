import { Component } from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {RecordsComponent} from '../records/records.component';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [
    NgOptimizedImage,
    RecordsComponent
  ],
  templateUrl: './page-not-found.component.html',
  styleUrl: './page-not-found.component.css'
})
export class PageNotFoundComponent {

}
