import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import qs from "qs";
import axios from "axios";
import Caver from "caver-js";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

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

class Payment extends Component {
  constructor(props) {
    super(props);

    let paymentMsg = "결제 결과 확인 중...";
    let paymentCode = this.props.match.params.result;
    if (paymentCode === "success") {
      paymentMsg = "결제 성공";
    } else if (paymentCode === "fail") {
      paymentMsg = "결제 실패";
    } else if (paymentCode === "cancel") {
      paymentMsg = "결제 취소";
    } else {
      document.location.href = "/";
      return;
    }

    let orderedInfo = qs.parse(window.sessionStorage.getItem("payment"));
    console.log(orderedInfo);
    this.state = {
      paymentMsg: paymentMsg,
      store: orderedInfo["store"],
      orderedItems: orderedInfo["items"],
      totalPrice: orderedInfo["totalAmount"],
      totalQuantity: orderedInfo["totalQuantity"],
      totalReward: caver.utils.fromPeb(orderedInfo["totalReward"], "KLAY"),
      tid: orderedInfo["tid"],
      contractUploaded: false,
      approveStatus: "가게 주인의 승인을 기다리는 중...",
      // status: 결제 확인, tx 확인, 가게 주인 승인 확인
    };

    if (paymentCode === "success") {
      console.log(this.state);
      this.SendPaymentTx();
    }
  }

  SendPaymentTx = () => {
    let current = this.state;
    let paymentInfo = {
      contract: current.store,
      items: qs.stringify(current.orderedItems),
      total_price: Number(current.totalPrice),
      tid: current.tid,
    };
    axios
      .post(
        klaybucks_backend + "/kas/store/order",
        JSON.stringify(paymentInfo)
      )
      .then((response) => {
        console.log(response);
        this.CheckExecuteReceipt(response.data["transactionHash"]);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  CheckExecuteReceipt = (txHash) => {
    let self = this;
    function getReceipt(txHash) {
      axios
        // tx re
        .get(klaybucks_backend + "/node/receipt?tx_hash=" + txHash)
        .then((response) => {
          let result = response.data["result"];
          if (result !== null) {
            clearInterval(self.intervalId);
            console.log(response);
            if (result["status"] !== "0x1") {
              console.warn("failed to execute tx", result);
              return;
            }

            self.RetrieveOrderStatus(
              caver.utils.hexToNumber(result["logs"][0]["topics"][1])
            );
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }

    self.intervalId = setInterval(getReceipt, 1000, txHash);
  };

  RetrieveOrderStatus = (orderId) => {
    let self = this;
    function getOrder(orderId) {
      axios
        .get(
          klaybucks_backend +
            "/node/order?contract=" +
            self.state.store +
            "&order_id=" +
            orderId
        )
        .then((response) => {
          console.log(response);
          if (response.data !== null && response.data["status"] !== null) {
            let status = response.data["status"];
            if (status === 1) {
              clearInterval(self.intervalOrder);
              self.setState((current) => ({
                approveStatus: "가게 주인이 승인했습니다.",
              }));
            } else if (status === 2) {
              clearInterval(self.intervalOrder);
              self.setState((current) => ({
                approveStatus: "가게 주인이 거부했습니다. 환불을 진행합니다.",
              }));
              // TODO: 카카오 페이 환불
            }
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }

    self.intervalOrder = setInterval(getOrder, 1000, orderId);
  };

  DisplayPayment = () => {
    const classes = useStyles();
    const [dense] = React.useState(false);
    let current = this.state;
    return (
      <div>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Paper className={classes.main}>
              <h1>주문 확인</h1>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper className={classes.contents}>
              Step 1) 결제 정보 확인 - {current.paymentMsg}
              <hr />
              <List dense={dense}>
                <ListItem>
                  <ListItemText
                    primary={"총 금액: " + current.totalPrice + " 원"}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={"총 보상: " + current.totalReward + " KLAY"}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={"총 수량: " + current.totalQuantity + " 개"}
                  />
                </ListItem>
                <ul>
                  {this.state.orderedItems.map((item) => (
                    <li key={item.name}>
                      {item.name} {item.quantity}
                    </li>
                  ))}
                </ul>
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper className={classes.contents}>
              Step 2) 가게 주인의 응답
              <hr />
              {this.state.approveStatus}
            </Paper>
          </Grid>
        </Grid>
      </div>
    );
  };

  render() {
    return (
      <div>
        <this.DisplayPayment />
      </div>
    );
  }
}

export default withRouter(Payment);
