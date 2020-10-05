import React, { Component } from "react";
import axios from "axios";
import qs from "qs";
import { withRouter } from "react-router-dom";
import Caver from "caver-js";

const klaybucks_backend = "http://127.0.0.1:8080";
const caver = new Caver();

class Open extends Component {
  constructor(props) {
    super(props);

    let contract = localStorage.getItem("contract");
    if (contract === null) {
      alert("no store in this account");
      document.location.href = "/";
      return;
    }

    let walletKey = localStorage.getItem("KlaytnWalletKey");
    if (walletKey === null) {
      // TODO: print error with pop-up
      console.log("no walletkey in the storage");
      return;
    }
    let keyring = caver.wallet.keyring.createFromKlaytnWalletKey(walletKey);

    this.state = {
      contract: contract,
      keyring: keyring,
      blockNumber: 34368895,
      receipts: [],
      menu: [],
    };
    this.RetrieveMenu(); // to calculate and double-check rewards
  }

  componentDidMount() {
    axios
      .get(klaybucks_backend + "/node/blockNumber")
      .then((response) => {
        this.setState((current) => ({
          blockNumber: caver.utils.hexToNumber(
            JSON.parse(response.data)["result"]
          ),
        }));
        this.RetrieveLogs(this.state.contract);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  RetrieveMenu = () => {
    axios
      .get(
        klaybucks_backend + "/node/menu?address=" + this.state.contract
      )
      .then((response) => {
        console.log(response);
        if (response.data == null) {
          console.warn("no response data");
        }
        this.setState((current) => ({
          menu: response.data,
        }));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  RetrieveLogs = (address) => {
    let self = this;
    function getReceipt(address) {
      let hexBlockNumber = caver.utils.toHex(self.state.blockNumber - 1); // 1 seconds buffer
      axios
        .get(
          klaybucks_backend +
            "/node/logs?from_block=" +
            hexBlockNumber +
            "&to_block=" +
            hexBlockNumber +
            "&contract=" +
            address
        )
        .then((response) => {
          console.log(self.state.blockNumber);
          self.setState((current) => ({
            blockNumber: self.state.blockNumber + 1,
          }));
          if (response.data !== null) {
            console.log(response);
            let current_receipts = response.data;

            // TODO: check the validity of kakaopay tid calling 'https://kapi.kakao.com/v1/payment/order'
            current_receipts.map((item) => {
              let order = qs.parse(item.content);
              let receipt = {
                index: item.index,
                order: JSON.stringify(order), // TODO: [{name:"", quantity:""}] make it readable...
                price: item.price,
                reward: self.CalculateReward(order),
                tid: item.payment_tx_id,
                status: "ordered",
              };
              self.setState((current) => ({
                receipts: self.state.receipts.concat(receipt),
              }));
              return item;
            });
            console.log(self.state.receipts);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }

    self.intervalId = setInterval(getReceipt, 1000, address);
  };

  CalculateReward = (order) => {
    let reward = 0;
    let menu = this.state.menu;
    if (menu.length < 1) {
      console.warn("no menu");
      return reward;
    }

    let basicReward = menu[0].reward;
    for (const [key, value] of Object.entries(order)) {
      let ret = menu.slice(1).find((coffee) => coffee.name === value.name);
      if (ret.reward === 0) {
        reward = reward + basicReward;
      } else {
        reward = reward + ret.reward;
      }
    }
    return reward;
  };

  ApproveOrder = (item) => {
    // 1. get nonce
    // 2. generate and sign tx with caver-js
    // 3. /v2/tx/fd/rlp
    // 4. check receipt and update state receipt...

    //////////////////////////////////////////////

    let param = {
      contract: this.state.contract,
      order_id: item.index,
      reward: item.reward,
    };

    axios
      .post(klaybucks_backend + "/kas/store/approve", JSON.stringify(param))
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  DenyOrder = (index) => {
    let param = {
      contract: this.state.contract,
      order_id: index,
    };

    axios
      .post(klaybucks_backend + "/kas/store/deny", JSON.stringify(param))
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  render() {
    return (
      <div>
        <div>Order List</div>
        {this.state.receipts.map((item) => (
          <li key={item.index}>
            order: {item.order} reward:{" "}
            {caver.utils.convertFromPeb(item.reward, "KLAY")}
            price: {item.price} payment_tx_id: {item.tid}
            <button onClick={() => this.ApproveOrder(item)}>Approve</button>
            <button onClick={() => this.DenyOrder(item.index)}>Deny</button>
          </li>
        ))}
      </div>
    );
  }
}

export default withRouter(Open);
