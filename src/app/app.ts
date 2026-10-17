import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StatusBar } from './core/status-bar';

@Component({
  imports: [RouterOutlet, StatusBar],
  selector: 'app-root',
  template: `
    <app-status-bar />
    <router-outlet />
  `,
})
export class App {}
