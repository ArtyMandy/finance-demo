# Finanz-demo

All your finances in one place, as an installable PWA: income and fixed costs, bookings (manual or ING CSV import), net worth, budgets, savings goals, contracts with a cancellation assistant, depot tracking and calculators for German taxes and subsidies. Product docs (German) are in [`docs/`](docs/).

- **Local-first:** data lives in the browser (`localStorage`) and works offline without an account. When signed in, it is mirrored to Supabase (table `finance_documents`, see `supabase/migrations/`). Apply that migration before relying on the cloud sync; until then the app keeps working locally and says so.
- **Rules in one place:** yearly tax and subsidy values are in [`src/app/rules/rules.ts`](src/app/rules/rules.ts).
- **No bank connection, no investment advice.**

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
