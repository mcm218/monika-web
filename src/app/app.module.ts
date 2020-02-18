import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { HomeComponent } from "./home/home.component";
import { ListsComponent } from './lists/lists.component';
import { QueueComponent } from './queue/queue.component';
import { MusicPlayerComponent } from './music-player/music-player.component';
import { ListComponent } from './list/list.component';
import { LoginComponent } from './login/login.component';
import { SongComponent } from './song/song.component';
import { InlineMusicPlayerComponent } from './inline-music-player/inline-music-player.component';
import { SettingsComponent } from './settings/settings.component';

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
      SettingsComponent
   ],
   imports: [
      BrowserModule,
      AppRoutingModule,
      FontAwesomeModule
   ],
   providers: [],
   bootstrap: [
      AppComponent
   ]
})
export class AppModule {}
