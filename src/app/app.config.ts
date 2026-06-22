import { ApplicationConfig } from '@angular/core'
import { provideRouter, withViewTransitions } from '@angular/router'
import { provideAnimations } from '@angular/platform-browser/animations'
import { provideStore } from '@ngrx/store'
import { provideEffects } from '@ngrx/effects'
import { provideStoreDevtools } from '@ngrx/store-devtools'
import { provideCharts, withDefaultRegisterables } from 'ng2-charts'
import { APP_ROUTES } from './app.routes'
import { appReducer } from './core/services/store.reducer'
import { AppEffects } from './core/services/store.effects'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES, withViewTransitions()),
    provideAnimations(),
    provideStore({ app: appReducer }),
    provideEffects([AppEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: false }),
    provideCharts(withDefaultRegisterables()),
  ],
}
