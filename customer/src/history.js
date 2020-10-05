import React, { Component } from "react";
import axios from "axios";
import { withRouter } from "react-router-dom";

import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Caver from "caver-js";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

import Typography from "@material-ui/core/Typography";

const klaybucks_backend = "http://127.0.0.1:8080";
const caver = new Caver();
const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  main: {
    padding: theme.spacing(2),
    textAlign: "center",
    color: "#ffffff",
    background: "#000000",
    height: 80,
    verticalAlign: "middle",
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: "center",
    color: "#000000",
    background: "#ffffff",
    height: 150,
    verticalAlign: "baseline",
  },
  contents: {
    padding: theme.spacing(2),
    textAlign: "left",
    color: "#000000",
    background: "#ffffff",
    height: "auto",
    verticalAlign: "baseline",
  },
}));

class History extends Component {
  constructor(props) {
    super(props);

    this.state = {
      address: "",
    };

    let myAddress = localStorage.getItem("myAddress");
    if (myAddress === null) {
      document.location.href = "/";
    }
    this.state.address = myAddress;
  }

  componentDidMount() {}

  DisplayHistory = () => {
    const classes = useStyles();
    // const [dense] = React.useState(false);
    // let current = this.state;
    return (
      <div>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Paper className={classes.main}>
              <h1>이용내역</h1>
              *Sample 내용 (KAS 최신 API 사용하는 방식으로 변경 필요)
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper className={classes.contents}>
              <List className={classes.root}>
                <ListItem>
                  <ListItemText
                    primary="Klaybucks 1호점"
                    secondary="2020.09.10 14:23"
                  />
                  <ListItemText
                    primary="- 8,500 원"
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          className={classes.inline}
                          color="textPrimary"
                        >
                          + 2 KLAY
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                <hr />
                <ListItem>
                  <ListItemText
                    primary="Klaybucks 1호점"
                    secondary="2020.09.10 13:53"
                  />
                  <ListItemText
                    primary="- 8,000 원"
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          className={classes.inline}
                          color="textPrimary"
                        >
                          + 2 KLAY
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                <hr />
                <ListItem>
                  <ListItemText
                    primary="Klaybucks 1호점"
                    secondary="2020.09.10 13:45"
                  />
                  <ListItemText
                    primary="- 4,000 원"
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          className={classes.inline}
                          color="textPrimary"
                        >
                          + 1 KLAY
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                <hr />
                <ListItem>
                  <ListItemText
                    primary="Aidan Caffe"
                    secondary="2020.09.09 10:12"
                  />
                  <ListItemText
                    primary="- 7,500 원"
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          className={classes.inline}
                          color="textPrimary"
                        >
                          + 2 KLAY
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </div>
    );
  };

  render() {
    return (
      <div>
        <this.DisplayHistory />
      </div>
    );
  }
}

export default withRouter(History);
