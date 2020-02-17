import { Component, OnInit } from '@angular/core';
import { Playlist } from '../db.service';

@Component({
  selector: 'app-lists',
  templateUrl: './lists.component.html',
  styleUrls: ['./lists.component.css']
})
export class ListsComponent implements OnInit {
  playlists: Playlist[];
  constructor() { }

  ngOnInit() {
    this.playlists = [];
    this.playlists.push({
      list: [],
      source: "Spotify",
      title: "Top Tracks"
    });
    this.playlists.push({
      list: [],
      source: "Youtube",
      title: "Music"
    });
    this.playlists.push({
      list: [],
      source: "Firestore",
      title: "History"
    });
  }

}
