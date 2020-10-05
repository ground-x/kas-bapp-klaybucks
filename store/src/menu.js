import React, { Component } from "react";
import axios from "axios";
import { withRouter } from "react-router-dom";

const klaybucks_backend = "http://127.0.0.1:8080";

class Menu extends Component {
  constructor(props) {
    super(props);

    let contract = localStorage.getItem("contract");
    if (contract === null) {
      alert("no store in this account");
      document.location.href = "/";
      return;
    }

    // TODO: load menu from local storage. (storeAddr, menu struct)

    this.state = {
      contract: contract,
      menu: [],
      newItem: "",
      newPrice: 0,
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

  AddMenu = () => {
    let current = this.state;
    let itemInfo = {
      contract: current.contract,
      item: current.newItem,
      price: Number(current.newPrice),
    };
    axios
      .post(klaybucks_backend + "/kas/store/menu", JSON.stringify(itemInfo))
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
        .get(klaybucks_backend + "/node/receipt?tx_hash=" + txHash)
        .then((response) => {
          let result = response.data["result"];
          if (result !== null) {
            clearInterval(self.intervalId2);
            self.setState((current) => ({
              newItem: "",
              newPrice: 0,
            }));
            self.RetrieveMenu();
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }

    self.intervalId2 = setInterval(getReceipt, 1000, txHash);
    setTimeout(clearInterval, 10000, self.intervalId2);
  };

  ShowMenu = () => {
    let menu = this.state.menu.slice(1);
    if (menu === null || menu === []) {
      return <div></div>;
    }

    return (
      <div>
        {menu.map((item) => (
          <li key={item.id}>
            {item.name}
            {" . "}
            {item.price}
            {" . "}
            {item.status}
          </li>
        ))}
      </div>
    );
  };

  HandleNewItemChange = (e) => {
    this.setState({
      newItem: e.target.value,
    });
  };

  HandleNewPriceChange = (e) => {
    this.setState({
      newPrice: e.target.value,
    });
  };

  render() {
    return (
      <div>
        <div>Menu</div>
        <this.ShowMenu />
        <ul>
          <input
            placeholder="상품명"
            size="10"
            onChange={this.HandleNewItemChange}
            value={this.state.newItem}
          ></input>
          <input
            placeholder="가격"
            onChange={this.HandleNewPriceChange}
            type="number"
            value={this.state.newPrice}
          ></input>
          <button onClick={this.AddMenu}>등록</button>
        </ul>
      </div>
    );
  }
}

export default withRouter(Menu);
