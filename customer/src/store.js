import React, { Component } from "react";
import axios from "axios";
import qs from "qs";
import { withRouter } from "react-router-dom";
import "./store.css";
import Caver from "caver-js";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import configData from "./config.json";

const StyledTableCell = withStyles((theme) => ({
  head: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  body: {
    fontSize: 14,
  },
}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
  root: {
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover,
    },
  },
}))(TableRow);

const useStyles = makeStyles((theme) => ({
  table: {
    minWidth: 100,
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: "center",
    color: "#ffffff",
    background: theme.palette.common.black,
    height: 100,
    verticalAlign: "baseline",
  },
  button: {
    color: theme.palette.common.white,
    background: theme.palette.common.block,
  },
}));

const caver = new Caver();

const klaybucks_backend = "http://127.0.0.1:8080";

class Store extends Component {
  constructor(props) {
    super(props);

    let storeContract = this.props.match.params.contractAddr;
    let storeInfo = qs.parse(sessionStorage.getItem(storeContract));

    this.state = {
      totalAmount: 0,
      totalReward: 0,
      totalQuantity: 0,
      menu: [],
      storeContract: storeContract,
      storeName: storeInfo.name,
      storeLng: storeInfo.y,
      storeLat: storeInfo.x,
      location: "",
      url: "http://localhost:3000/store/" + storeContract,
    };
    console.log(this.state);
  }

  componentDidMount() {
    axios
      .post(klaybucks_backend + "/node/klaytn")
      .then((response) => {
        this.RetrieveMenu();
      })
      .catch((error) => {
        console.log(error);
      });

    const script = document.createElement("script");
    script.async = false;
    script.src =
      "https://dapi.kakao.com/v2/maps/sdk.js?appkey=" + configData.KAKAO_REST_API_KEY + "&libraries=services&autoload=false";
    document.head.appendChild(script);

    let self = this;
    script.onload = () => {
      window.kakao.maps.load(() => {
        let geocoder = new window.kakao.maps.services.Geocoder();
        let coord = new window.kakao.maps.LatLng(
          self.state.storeLng,
          self.state.storeLat
        );
        let callback = function (result, status) {
          if (status === window.kakao.maps.services.Status.OK) {
            self.setState({ location: result[0].address.address_name });
          }
        };
        geocoder.coord2Address(coord.getLng(), coord.getLat(), callback);
      });
    };
  }

  RetrieveMenu = () => {
    axios
      .get(
        klaybucks_backend +
          "/node/menu?address=" +
          this.state.storeContract
      )
      .then((response) => {
        console.log(response);
        if (response.data == null) {
          console.warn("no response data");
          return;
        }

        let basicReward = response.data[0].reward;
        let basicRewardHex = response.data[0].reward_hex;

        response.data.map((item) => {
          item.quantity = 0;
          if (item.reward === 0) {
            item.reward = basicReward;
            item.reward_hex = basicRewardHex;
          }
          return item;
        });

        this.setState((current) => ({
          menu: response.data,
        }));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  addQuantity = (id) => {
    this.setState((current) => {
      current.menu[id].quantity += 1;
      current.totalAmount += current.menu[id].price;
      current.totalReward += current.menu[id].reward;
      current.totalQuantity += 1;

      return {
        menu: current.menu,
        totalAmount: current.totalAmount,
      };
    });
  };

  minusQuantity = (id) => {
    this.setState((current) => {
      if (current.menu[id].quantity > 0) {
        current.menu[id].quantity -= 1;
        current.totalAmount -= current.menu[id].price;
        current.totalReward -= current.menu[id].reward;
        current.totalQuantity -= 1;
      }
      return {
        menu: current.menu,
        totalAmount: current.totalAmount,
      };
    });
  };

  keepPaymentData = (tid) => {
    let orderList = [];

    this.state.menu.map((item) => {
      if (item.quantity !== 0) {
        let orderItem = {
          name: item.name,
          quantity: item.quantity,
        };
        orderList.push(orderItem);
      }
      return item;
    });
    // orderList.push({ totalAmount: this.state.totalAmount });
    window.sessionStorage.setItem(
      "payment",
      qs.stringify({
        store: this.state.storeContract,
        items: orderList,
        totalAmount: this.state.totalAmount,
        totalReward: this.state.totalReward,
        totalQuantity: this.state.totalQuantity,
        tid: tid,
      })
    );
  };

  Order = () => {

    // KAKAO PAY test data
    // TODO: fill the KAKAO access key to enable KAKAO pay APIs 
    let header = {
      Authorization: "KakaoAK " + configData.KAKAO_ADMIN_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    };

    // temporary data for tests
    let readData = {
      cid: "TCSUBSCRIP",
      partner_order_id: "TC0ONETIME",
      partner_user_id: "KlaytnBucks#1",
      item_name: "coffee",
      quantity: "1",
      total_amount: this.state.totalAmount,
      tax_free_amount: this.state.totalAmount,
      approval_url: "http://localhost:3000/payment/success",
      cancel_url: this.state.url,
      fail_url: this.state.url,
    };

    axios
      .post("/v1/payment/ready", qs.stringify(readData), { headers: header })
      .then((response) => {
        console.log(JSON.stringify(response.data));
        this.keepPaymentData(response.data["tid"]);
        document.location.href = response.data["next_redirect_pc_url"];
      })
      .catch((error) => {
        console.log(error);
      });
    console.log(this.state);
  };

  DisplayStore = () => {
    const classes = useStyles();
    let current = this.state;
    return (
      <div>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <h1>{current.storeName}</h1>
              {current.location}
              <br />
              {current.storeContract.slice(0, 8)}...
              {current.storeContract.slice(16, 22)}
            </Paper>
          </Grid>
        </Grid>
      </div>
    );
  };

  DisplayMenu = () => {
    const classes = useStyles();
    let menu = this.state.menu.slice(1);
    return (
      <div>
        <TableContainer component={Paper}>
          <Table className={classes.table} aria-label="customized table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Menu</StyledTableCell>
                <StyledTableCell align="right">Price</StyledTableCell>
                <StyledTableCell align="right">Reward</StyledTableCell>
                <StyledTableCell align="right">Amount</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {menu.map((row) => (
                <StyledTableRow key={row.name}>
                  <StyledTableCell component="th" scope="row">
                    {row.name}
                  </StyledTableCell>
                  <StyledTableCell align="right">{row.price}</StyledTableCell>
                  <StyledTableCell align="right">
                    {caver.utils.convertFromPeb(
                      caver.utils.hexToNumberString(row.reward_hex),
                      "KLAY"
                    )}{" "}
                    KLAY
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    {row.quantity}&nbsp;
                    <button onClick={() => this.addQuantity(row.id)}>+</button>
                    <button onClick={() => this.minusQuantity(row.id)}>
                      -
                    </button>
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
            <TableHead>
              <TableRow>
                <StyledTableCell>Total</StyledTableCell>
                <StyledTableCell align="right">
                  {this.state.totalAmount}
                </StyledTableCell>
                <StyledTableCell align="right">
                  {caver.utils.convertFromPeb(this.state.totalReward, "KLAY")}{" "}
                  KLAY
                </StyledTableCell>
                <StyledTableCell align="right">
                  {this.state.totalQuantity}
                </StyledTableCell>
              </TableRow>
            </TableHead>
          </Table>
        </TableContainer>
        <div align="right">
          <Button className={classes.button} onClick={this.Order}>
            PURCHASE
          </Button>
        </div>
      </div>
    );
  };

  render() {
    return (
      <div>
        <this.DisplayStore />
        <this.DisplayMenu />
      </div>
    );
  }
}

export default withRouter(Store);
