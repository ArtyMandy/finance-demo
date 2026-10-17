import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StatusBar } from './core/status-bar';
import { SiteHeader } from './layout/site-header';

@Component({
  imports: [RouterOutlet, SiteHeader, StatusBar],
  selector: 'app-root',
  template: `
    <app-status-bar />
    <app-site-header />
    <router-outlet />
  `,
})
export class App {}
