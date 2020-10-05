import React, { Component } from "react";
import axios from "axios";
import { withRouter } from "react-router-dom";
import Caver from "caver-js";

const caver = new Caver();
const klaybucks_backend = "http://127.0.0.1:8080";

class Reward extends Component {
  constructor(props) {
    super(props);

    // stupid contract checking 
    let contract = localStorage.getItem("contract");
    if (contract === null) {
      alert("no store in this account");
      document.location.href = "/";
      return;
    }

    this.state = {
      contract: contract,
      menu: [],
    };
  }

  componentDidMount() {
    this.RetrieveMenu();
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

  CheckExecuteReceipt = (txHash) => {
    let self = this;
    function getReceipt(txHash) {
      axios
        .get(klaybucks_backend + "/node/receipt?tx_hash=" + txHash)
        .then((response) => {
          let result = response.data["result"];
          if (result !== null) {
            clearInterval(self.intervalReward);
            self.RetrieveMenu();
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
    self.intervalReward = setInterval(getReceipt, 1000, txHash);
  };

  AddReward = (item) => {
    let current = this.state;
    let itemInfo = {
      contract: current.contract,
      menu_id: item.id,
      reward_hex: item.reward_hex,
    };
    console.log(itemInfo);
    axios
      .post(
        klaybucks_backend + "/kas/store/reward",
        JSON.stringify(itemInfo)
      )
      .then((response) => {
        console.log(response);
        this.CheckExecuteReceipt(response.data["transactionHash"]);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  HandleChange = (e, item) => {
    item.reward_hex = caver.utils.toHex(e.target.value + "000000000000000000");
  };

  ShowMenu = () => {
    let menu = this.state.menu;
    if (menu === null || menu === []) {
      return <div></div>;
    }

    return (
      <div>
        {menu.map((item) => (
          <li key={item.id}>
            {item.name}
            {" . "}
            {caver.utils.convertFromPeb(
              caver.utils.hexToNumberString(item.reward_hex),
              "KLAY"
            )}
            {" . "}
            <input
              placeholder="가격"
              type="number"
              onChange={(e) => this.HandleChange(e, item)}
            ></input>
            <button onClick={() => this.AddReward(item)}>등록</button>
          </li>
        ))}
      </div>
    );
  };

  render() {
    return (
      <div>
        <div>Reward Policy</div>
        menu. 현재 reward, 빈경할 reward(KLAY)
        <this.ShowMenu />
      </div>
    );
  }
}

export default withRouter(Reward);
