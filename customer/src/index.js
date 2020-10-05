import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Main from "./main";
import StoreMap from "./store_map";
import Store from "./store";
import Payment from "./payment";
import History from "./history";

import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import "./index.css";

const useStyles = makeStyles((theme) => ({
  root: {
    "& > *": {
      margin: theme.spacing(2),
      float: "right",
      color: "#663500",
    },
  },
}));

function Navigator() {
  const classes = useStyles();
  return (
    <Router>
      <Typography className={classes.root}>
        <Link href="/history">History</Link>
        <Link href="/map/stores">Map</Link>
        <Link href="/">Home</Link>
      </Typography>

      <Switch>
        <Route path="/history" component={History} />
        <Route path="/payment/:result" component={Payment} />
        <Route path="/map/stores" component={StoreMap} />
        <Route path="/store/:contractAddr" component={Store} />
        <Route path="/" exact={true} component={Main} />
      </Switch>
    </Router>
  );
}

ReactDOM.render(<Navigator />, document.getElementById("root"));
