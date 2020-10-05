import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import axios from "axios";
import "./store_map.css";
import qs from "qs";
import configData from "./config.json"

const klaybucks_backend = "http://127.0.0.1:8080";

let map = null;

class StoreMap extends Component {
  componentDidMount() {
    const script = document.createElement("script");
    script.async = false;
    script.src =
      "https://dapi.kakao.com/v2/maps/sdk.js?appkey=" + configData.KAKAO_REST_API_KEY + "&autoload=false";
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        let el = document.getElementById("map");
        map = new window.kakao.maps.Map(el, {
          center: new window.kakao.maps.LatLng(
            37.5076481634053,
            127.062735512606
          ),
          level: 4,
        });
        this.GetStores();
      });
    };
  }

  GetStores = () => {
    axios
      .get(klaybucks_backend + "/node/stores")
      .then((response) => {
        console.log(response.data);
        let storeList = response.data;
        let i = 0;
        while (i < storeList.length) {
          console.log(storeList[i]);
          let marker = new window.kakao.maps.Marker({
            map: map,
            position: new window.kakao.maps.LatLng(
              storeList[i].y,
              storeList[i].x
            ),
          });
          // contract address is stored in marker.F temporary
          marker.F = storeList[i];
          let label = new window.kakao.maps.InfoWindow({
            content: storeList[i].name,
          });
          label.open(map, marker);

          window.kakao.maps.event.addListener(marker, "click", function () {
            sessionStorage.setItem(
              marker.F.store_contract,
              qs.stringify(marker.F)
            );
            window.location.href = "/store/" + marker.F.store_contract;
          });
          i++;
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  render() {
    return <div className="StoreMap" id="map" />;
  }
}

export default withRouter(StoreMap);
