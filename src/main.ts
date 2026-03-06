import { registerLocaleData } from '@angular/common';
import localeEsGt from '@angular/common/locales/es-GT';
registerLocaleData(localeEsGt, 'es-GT');
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http'; //importar para ver los datos de los servicios

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
