import { httpResource } from '@angular/common/http';
import { Component } from '@angular/core';

interface ChuckNorrisJoke {
  id: string;
  value: string;
}

export const JOKE_API_URL = 'https://api.chucknorris.io/jokes/random';

@Component({
  selector: 'app-joke-card',
  template: `
    <aside class="joke-card" aria-labelledby="joke-heading">
      <h2 id="joke-heading">Witz des Moments</h2>
      <div aria-live="polite">
        @if (joke.error()) {
          <p>Der Witz konnte nicht geladen werden.</p>
        } @else if (joke.hasValue()) {
          <blockquote lang="en">{{ joke.value().value }}</blockquote>
        } @else {
          <p>Witz wird geladen …</p>
        }
      </div>
      <button type="button" class="button" [disabled]="joke.isLoading()" (click)="joke.reload()">
        Neuer Witz
      </button>
    </aside>
  `,
  styles: `
    .joke-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.75rem;
      background: #fff;
      text-align: left;
    }

    h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    blockquote,
    p {
      margin: 0;
      line-height: 1.5;
    }

    button {
      align-self: flex-start;
    }
  `,
})
export class JokeCard {
  protected readonly joke = httpResource<ChuckNorrisJoke>(() => JOKE_API_URL);
}
