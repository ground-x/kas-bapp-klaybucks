import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Main from "./main";
import Menu from "./menu";
import Register from "./register";
import Reward from "./reward";
import Open from "./open";
import "./index.css";

import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    "& > *": {
      margin: theme.spacing(1),
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
        <Link href="/open">Open</Link>
        <Link href="/reward">Reward</Link>
        <Link href="/menu">Menu</Link>
        <Link href="/register">Register</Link>
        <Link href="/">Home</Link>
      </Typography>

      <Switch>
        <Route path="/reward" exact={true} component={Reward} />
        <Route path="/register" exact={true} component={Register} />
        <Route path="/menu" exact={true} component={Menu} />
        <Route path="/open" exact={true} component={Open} />
        <Route path="/" exact={true} component={Main} />
      </Switch>
    </Router>
  );
}

ReactDOM.render(<Navigator />, document.getElementById("root"));
