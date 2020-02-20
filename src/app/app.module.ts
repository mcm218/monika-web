import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { DragDropModule } from "@angular/cdk/drag-drop";

import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { AngularFireModule } from "@angular/fire";
import { AngularFirestoreModule } from "@angular/fire/firestore";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { CookieService } from "ngx-cookie-service";

import { MatSnackBarModule } from "@angular/material/snack-bar";

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
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

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
    ResultsListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    HttpClientModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule,
    AngularFireAuthModule,
    DragDropModule,
    MatSnackBarModule,
    BrowserAnimationsModule
  ],
  providers: [CookieService],
  bootstrap: [AppComponent]
})
export class AppModule {}
