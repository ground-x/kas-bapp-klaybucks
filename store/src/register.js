import React, { Component } from "react";
import axios from "axios";
import { withRouter } from "react-router-dom";
import "./register.css";
import TextField from "@material-ui/core/TextField";
import configData from "./config.json";

const klaybucks_backend = "http://127.0.0.1:8080";

class Register extends Component {
  constructor(props) {
    super(props);

    // stupid sesion control to build test app easy. 
    let owner = localStorage.getItem("owner");
    if (owner === null) {
      alert("not logged in");
      document.location.href = "/";
      return;
    }

    this.state = {
      addressKeyword: "테헤란로98길 11",
      storeName: "klaybucks",
      storeAddress: "",
      x: "",
      y: "",
      owner: owner,
      contract: "",
      registerTx: "",
    };

    const script = document.createElement("script");
    script.async = true;
    script.src =
      "https://dapi.kakao.com/v2/maps/sdk.js?appkey=" + configData.KAKAO_REST_API_KEY + "&libraries=services&autoload=false";
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        let mapContainer = document.getElementById("map"),
          mapOption = {
            center: new window.kakao.maps.LatLng(33.450701, 126.570667),
            level: 4,
          };
        new window.kakao.maps.Map(mapContainer, mapOption);
      });
    };
  }

  RegisterContract = () => {
    let current = this.state;
    if (current.registerTx !== "") {
      return;
    }

    let dataParam = {
      owner: current.owner,
      name: current.storeName,
      x: current.x,
      y: current.y,
      contract_addr: current.contract,
    };

    axios
      .post(klaybucks_backend + "/kas/storelist/store", dataParam)
      .then((response) => {
        console.log(response);
        let txHash = response.data["transactionHash"];
        this.CheckExecuteReceipt(txHash);
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
            localStorage.setItem("registerTx", txHash);

            self.setState((current) => ({
              registerTx: txHash,
            }));
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }

    self.intervalId2 = setInterval(getReceipt, 1000, txHash);
    setTimeout(clearInterval, 10000, self.intervalId2);
  };

  CheckDeployReceipt = (txHash) => {
    let self = this;
    if (self.state.contract !== "") {
      console.warn(
        "WARN: store contract is already deployed",
        self.state.contract
      );
      self.RegisterContract();
      return;
    }

    function getReceipt(txHash) {
      axios
        .get(klaybucks_backend + "/node/receipt?tx_hash=" + txHash)
        .then((response) => {
          let result = response.data["result"];
          if (result !== null) {
            clearInterval(self.intervalId);
            console.log("contract addr:" + result["contractAddress"]);
            localStorage.setItem("contract", result["contractAddress"]);

            self.setState((current) => ({
              contract: result["contractAddress"],
            }));
            self.RegisterContract();
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }

    self.intervalId = setInterval(getReceipt, 1000, txHash);
    setTimeout(clearInterval, 10000, self.intervalId);
  };

  DeployTx = () => {
    let storeInfo = { name: this.state.storeName, owner: this.state.owner };
    console.log(storeInfo);
    axios
      .post(klaybucks_backend + "/kas/store", JSON.stringify(storeInfo))
      .then((response) => {
        console.log(response);
        let txHash = response.data["transactionHash"];

        console.log("store contract deploy tx hash:" + txHash);
        this.CheckDeployReceipt(txHash);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  Confirm = () => {
    return (
      <div>
        <div>다음 주소로 등록하시겠습까?</div>
        <div>{this.state.storeAddress}</div>
        <div>{this.state.storeName}</div>
        <div>
          {this.state.x}, {this.state.y}
        </div>
        <button onClick={this.DeployTx}>확인</button>
      </div>
    );
  };

  FindMap = () => {
    let mapContainer = document.getElementById("map"),
      mapOption = {
        center: new window.kakao.maps.LatLng(33.450701, 126.570667),
        level: 4,
      };

    let map = new window.kakao.maps.Map(mapContainer, mapOption);
    let geocoder = new window.kakao.maps.services.Geocoder();
    let self = this;
    geocoder.addressSearch(this.state.addressKeyword, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        self.setState((current) => ({
          storeAddress: result[0].address_name,
          x: result[0].x,
          y: result[0].y,
        }));
        let coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
        let marker = new window.kakao.maps.Marker({
          map: map,
          position: coords,
        });
        let infowindow = new window.kakao.maps.InfoWindow({
          content:
            '<div style="width:150px;text-align:center;padding:6px 0;">등록 위치</div>',
        });
        infowindow.open(map, marker);
        map.setCenter(coords);
      }
    });
  };

  handleStoreNameChange = (e) => {
    this.setState({
      storeName: e.target.value,
    });
  };

  handleAddressChange = (e) => {
    this.setState({
      addressKeyword: e.target.value,
    });
  };

  InputKeyword = () => {
    return (
      <div>
        {/* <TextField
          id="standard-basic"
          label="Store Name"
          onChange={this.handleStoreNameChange}
        />
        <br />
        <TextField
          id="standard-basic"
          label="Location (e.g., 테헤란로98길 11)"
          value={this.state.addressKeyword}
          onChange={this.handleAddressChange}
        /> */}
        <li>
          가게 이름:
          <input
            placeholder="가게 이름을 입력하세요"
            onChange={this.handleStoreNameChange}
            value={this.state.storeName}
          ></input>
        </li>
        <li>
          위치:
          <input
            placeholder="가게 주소를 입력하세요"
            onChange={this.handleAddressChange}
            value={this.state.addressKeyword}
          />
          <button onClick={this.FindMap}>검색</button>
        </li>
      </div>
    );
  };

  render() {
    return (
      <div>
        <div>Register</div>
        <hr />
        정보 입력
        <div>
          <this.InputKeyword />
        </div>
        <div className="StoreMap" id="map">
          Map
        </div>
        <div>
          <this.Confirm />
        </div>
        <hr />
        {/* TODO: Print followings step-by-step */}
        Step1. Deploy a store contract
        <div>
          <a
            href={
              "https://baobab.scope.klaytn.com/account/" + this.state.contract
            }
          >
            {this.state.contract}
          </a>
        </div>
        <hr />
        Step2. Register to the master contract
        <div>
          <a
            href={"https://baobab.scope.klaytn.com/tx/" + this.state.registerTx}
          >
            {this.state.registerTx}
          </a>
        </div>
      </div>
    );
  }
}

export default withRouter(Register);
