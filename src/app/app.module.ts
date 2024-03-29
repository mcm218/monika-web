import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { DragDropModule } from "@angular/cdk/drag-drop";

import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CookieService } from "ngx-cookie-service";
import { ToastrModule } from "ngx-toastr";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTooltipModule } from '@angular/material/tooltip';

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { HomeComponent } from "./home/home.component";
import { ListsComponent } from "./lists/lists.component";
import { QueueComponent } from "./queue/queue.component";
import { MusicPlayerComponent } from "./music-player/music-player.component";
import { ListComponent } from "./list/list.component";
import { LoginComponent } from "./login/login.component";
import { SongComponent } from "./song/song.component";
import { InlineMusicPlayerComponent } from "./inline-music-player/inline-music-player.component";
import { SettingsComponent } from "./settings/settings.component";
import { environment } from "src/environments/environment";
import { ResultsListComponent } from "./results-list/results-list.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { DesktopAuthComponent } from './desktop-auth/desktop-auth.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ListsComponent,
    QueueComponent,
    MusicPlayerComponent,
    ListComponent,
    LoginComponent,
    SongComponent,
    InlineMusicPlayerComponent,
    SettingsComponent,
    ResultsListComponent,
    DesktopAuthComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    HttpClientModule,
    DragDropModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      timeOut: 2000,
      positionClass: "toast-top-center"
    }),
    MatProgressBarModule,
    MatTooltipModule
  ],
  providers: [CookieService],
  bootstrap: [AppComponent]
})
export class AppModule { }
