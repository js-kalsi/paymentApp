import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  title: string = 'smInventory';
  hideNavbar: boolean = true;

  constructor(private _router: Router) {
    this._router.events.subscribe((event: any) => {

      // Check the current URL and hide/show the navbar accordingly
      if (event instanceof NavigationEnd) {
        this.hideNavbar = (event.url === '/login' || event.url === '/');
      }
    });
  }
}
