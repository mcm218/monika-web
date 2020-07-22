import { Component, OnInit } from "@angular/core";
import { DbService, Song } from "../db.service";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-results-list",
  templateUrl: "./results-list.component.html",
  styleUrls: ["./results-list.component.css"]
})
export class ResultsListComponent implements OnInit {
  faTimes = faTimes;
  results: any[];
  
  constructor(private db: DbService, private toastr: ToastrService) {
    this.db.results.subscribe(results => (this.results = results));
  }

  ngOnInit() {}

  addToQueue(result: Song) {
    this.toastr.show(this.db.fixStringFormatting(result.title) + " was added to the queue!", "");
    this.db.addToQueue(result);
  }

  back() {
    this.db.clearResults();
  }
}
