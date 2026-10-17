import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [NgOptimizedImage, RouterLink],
  selector: 'app-home',
  template: `
    <main class="page">
      <img ngSrc="logo.svg" width="96" height="96" alt="" priority />
      <h1>Finance-Demo</h1>
      <a routerLink="/uebersicht" class="button">Zur Übersicht</a>
    </main>
  `,
})
export class Home {}
