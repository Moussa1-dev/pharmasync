import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  searchQuery = '';

  constructor(private router: Router) {}

  goToSearch(): void {
    const query = this.searchQuery.trim();
    this.router.navigate(['/search'], { queryParams: query ? { query } : {} });
  }
}
