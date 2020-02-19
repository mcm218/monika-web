import { Component, OnInit, Input } from "@angular/core";
import { DbService } from "../db.service";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: "app-results-list",
  templateUrl: "./results-list.component.html",
  styleUrls: ["./results-list.component.css"]
})
export class ResultsListComponent implements OnInit {
  faTimes = faTimes;
  results: any[];
  constructor(private db: DbService) {
    this.db.results.subscribe(results => (this.results = results));
  }

  ngOnInit() {}

  addToQueue(result: any) {
    this.db.addToQueue(result);
  }

  back() {
    this.db.clearResults();
  }
}
