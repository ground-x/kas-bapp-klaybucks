import React, { Component } from "react";
import axios from "axios";
import { withRouter } from "react-router-dom";
import Caver from "caver-js";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";

const caver = new Caver();
const klaybucks_backend = "http://127.0.0.1:8080";
const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: "center",
    color: "#331a00",
    background: "#ffffff",
    height: 100,
    verticalAlign: "baseline",
  },
}));

class Main extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoggedin: false,
      address: "",
      key: "",
    };
  }

  componentDidMount() {
    this.LogIn();
  }

  GetStores = () => {
    axios
      .get(klaybucks_backend + "/node/stores")
      .then((response) => {
        console.log(response.data["result"]);
        // TODO: get real contract data from KAS
        // state.storeData.push(response.data["result"]);
        // this.setState((current) => ({
        //   storeData: items,
        // }));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  LogIn = () => {
    let walletKey = localStorage.getItem("KlaytnWalletKey");
    if (walletKey === null) {
      console.warn("no walletkey in the storage");
      return;
    }
    let keyring = caver.wallet.keyring.createFromKlaytnWalletKey(walletKey);
    this.setState((current) => ({
      isLoggedin: true,
      address: keyring.address,
      key: keyring.key,
    }));

    // TODO: qeury stores from the master contract
  };

  LogOut = () => {
    this.setState((current) => ({
      isLoggedin: false,
      address: "",
      key: "",
    }));
  };

  GenerateKey = () => {
    let keyring = caver.wallet.keyring.generate();
    localStorage.setItem("KlaytnWalletKey", keyring.getKlaytnWalletKey());
    localStorage.setItem("owner", keyring.address);
    this.LogIn();
  };

  PrintAnonymous = () => {
    return (
      <div>
        <br />
        <Button variant="contained" onClick={this.GenerateKey}>
          Generate a new key
        </Button>
        <Button variant="contained" onClick={this.LogIn}>
          Log-in with an existing key
        </Button>
      </div>
    );
  };

  PrintUser = () => {
    const current = this.state;
    return (
      <div>
        <div>
          Address: {current.address.slice(0, 8)}...
          {current.address.slice(16, 22)}
        </div>
        {/* <div>Store: </div> */}
        <div>
          <Button onClick={this.LogOut}>Logout</Button>
        </div>
      </div>
    );
  };

  PrintMainGrid = () => {
    const classes = useStyles();

    let userAccount = this.PrintAnonymous;
    if (this.state.isLoggedin) {
      userAccount = this.PrintUser;
    }

    return (
      <div className={classes.root}>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <h1>Klaybucks Store</h1>
              Register your Klaytbucks store
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
        <this.PrintMainGrid />

        {/* <div>Registered Stores</div>
        <button onClick={this.GetStores}>get stores</button> */}
      </div>
    );
  }
}

export default withRouter(Main);
