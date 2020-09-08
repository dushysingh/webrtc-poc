/* eslint-disable react/no-unused-state */
import React, { Component } from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  browserHistory,
} from 'react-router-dom'

import './Dashboard.css'

class Dashboard extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div className="container container_dashboard">
        <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">
          <Link to="/public-room">
            <button className="btn btn-primary btnRoom">
              {' '}
              Create public Room
            </button>
          </Link>
        </div>

        <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">
          <Link to="/broadcasting">
            <button className="btn btn-primary btnRoom">
              {' '}
              Start Broadcasting{' '}
            </button>
          </Link>
        </div>
      </div>
    )
  }
}
export default Dashboard
