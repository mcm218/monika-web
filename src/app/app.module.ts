import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { HomeComponent } from "./home/home.component";
import { ListsComponent } from './lists/lists.component';
import { QueueComponent } from './queue/queue.component';
import { MusicPlayerComponent } from './music-player/music-player.component';
import { ListComponent } from './list/list.component';
import { LoginComponent } from './login/login.component';
import { SongComponent } from './song/song.component';

@NgModule({
   declarations: [
      AppComponent,
      HomeComponent,
      ListsComponent,
      QueueComponent,
      MusicPlayerComponent,
      ListComponent,
      LoginComponent,
      SongComponent
   ],
   imports: [
      BrowserModule,
      AppRoutingModule
   ],
   providers: [],
   bootstrap: [
      AppComponent
   ]
})
export class AppModule {}
