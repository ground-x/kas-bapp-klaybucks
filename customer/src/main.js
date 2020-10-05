import React, { Component } from "react";
import axios from "axios";
import { withRouter } from "react-router-dom";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Caver from "caver-js";

const caver = new Caver();
const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: "center",
    color: "#ffffff",
    background: "#331a00",
    height: 100,
    verticalAlign: "baseline",
  },
}));

class Main extends Component {
  constructor(props) {
    super(props);

    this.state = {
      url: "",
      address: "",
      balance: "",
      loggedIn: false,
    };

    let myAddress = localStorage.getItem("myAddress");
    if (myAddress !== null) {
      this.state.address = myAddress;
      this.state.loggedIn = true;
      this.GetBalance(myAddress);
    }
  }

  componentDidMount() {}

  CreateAccount = () => {
    axios.post("http://localhost:8080/kas/account").then((response) => {
      let res = JSON.parse(response.data);
      console.log(res);
      localStorage.setItem("myAddress", res["address"]);

      this.setState({
        address: res["address"],
      });
      document.location.href = "/";
    });
  };

  GetBalance = (address) => {
    axios
      .get("http://localhost:8080/node/balance?address=" + address)
      .then((response) => {
        let res = JSON.parse(response.data);
        console.log(res);
        this.setState({
          balance: res["result"],
        });
      });
  };

  UserAnonymous = () => {
    return (
      <div>
        Hello, stranger! <br />
        Make your Klaytn account <br />
        <br />
        <Button variant="contained" onClick={this.CreateAccount}>
          Create
        </Button>
      </div>
    );
  };

  UserLoggedIn = () => {
    const current = this.state;
    return (
      <div>
        <div>
          Address: {current.address.slice(0, 8)}...
          {current.address.slice(16, 22)}
        </div>
        <div>Balance: {caver.utils.toDecimal(current.balance)} KLAY</div>
        <div>
          <Button onClick={this.LogOut}>Logout</Button>
        </div>
      </div>
    );
  };

  LogOut = () => {
    this.setState({
      loggedIn: false,
      address: "",
    });
  };

  MainGrid = () => {
    const classes = useStyles();

    let userAccount = this.UserAnonymous;
    if (this.state.loggedIn) {
      userAccount = this.UserLoggedIn;
    }

    return (
      <div className={classes.root}>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <h1>Klaybucks</h1>
              Buy coffee and collect digital assets
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper className={classes.paper}>{userAccount()}</Paper>
          </Grid>
        </Grid>
      </div>
    );
  };
  render() {
    return (
      <div>
        <this.MainGrid />
      </div>
    );
  }
}

export default withRouter(Main);
