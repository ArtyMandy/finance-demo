import { Component } from '@angular/core';
import { JokeCard } from './joke-card';

@Component({
  imports: [JokeCard],
  selector: 'app-overview',
  template: `
    <main class="overview">
      <section class="overview-content">
        <h1>Übersicht</h1>
        <p>Diese Seite wurde über das Routing geladen.</p>
      </section>
      <app-joke-card />
    </main>
  `,
  styles: `
    .overview {
      display: grid;
      grid-template-columns: 1fr minmax(0, 22rem);
      gap: 2rem;
      align-items: start;
      max-width: 60rem;
      margin: 0 auto;
      padding: 3rem 1rem;
    }

    .overview-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    p {
      margin: 0;
    }

    @media (max-width: 40rem) {
      .overview {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class Overview {}
