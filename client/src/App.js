import React, { Component } from "react";
import { Route, BrowserRouter as Router, Switch, Redirect } from "react-router-dom";
import Publicroom from "./Components/Publicroom/Publicroom";

class App extends Component {
  render() {
    return (
      <Router>
        <Switch>
          <Route exact path="/" render={() => {return ( <Redirect to="/public-room" />)}} />
          <Route exact path="/public-room" component={Publicroom} />
        </Switch>
      </Router>
    );
  }
}
export default App;
