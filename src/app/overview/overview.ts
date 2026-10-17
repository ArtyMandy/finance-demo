import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-overview',
  template: `
    <main class="page">
      <h1>Übersicht</h1>
      <p>Diese Seite wurde über das Routing geladen.</p>
      <a routerLink="/" class="button">Zurück zur Startseite</a>
    </main>
  `,
})
export class Overview {}
