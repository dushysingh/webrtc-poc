import React, { Component } from "react";
import { Route, BrowserRouter as Router, Switch } from "react-router-dom";
import Dashboard from "./Components/Dashboard/Dashboard";
import Publicroom from "./Components/Publicroom/Publicroom";

class App extends Component {
  render() {
    return (
      <Router>
        <Switch>
          <Route exact path="/" component={Dashboard} />
          <Route exact path="/dashboard" component={Dashboard} />
          <Route exact path="/broadcasting" component={Broadcasting} />
          <Route exact path="/public-room" component={Publicroom} />
        </Switch>
      </Router>
    );
  }
}
export default App;
